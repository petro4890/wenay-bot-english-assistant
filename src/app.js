const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const express = require('express');
const { knowledgeBase } = require('./knowledge-base');
const { surveyQuestions } = require('./survey');
const { formatConnectionRequest } = require('./utils');

class WenayBotAssistant {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        
        this.userSessions = new Map();
        this.setupBot();
    }

    setupBot() {
        // Обработчик команды /start
        this.bot.onText(/\/start/, (msg) => {
            this.handleStart(msg);
        });

        // Обработчик всех текстовых сообщений
        this.bot.on('message', (msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                // Проверяем, находится ли пользователь в процессе анкетирования
                if (this.userSessions.has(msg.chat.id)) {
                    // Игнорируем текстовые сообщения во время анкетирования
                    return;
                }
                this.handleMessage(msg);
            }
        });

        // Обработчик callback query для кнопок
        this.bot.on('callback_query', (callbackQuery) => {
            this.handleCallbackQuery(callbackQuery);
        });

        console.log('✓ Wenay Bot English Assistant запущен');
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const welcomeMessage = `👋 Welcome!
I'm Wenay AI Assistant — a smart bot powered by GPT.
You can chat with me in any language you prefer — just start typing.

I can:

• Answer questions about Wenay Bot and our products

• Explain terms, conditions, and security rules

• Help you understand how to get started

• If you're interested, guide you through a quick form so our team can contact you

⚠️ Disclaimer: I share information about Wenay Bot only. I do not provide financial advice. Past results do not guarantee future outcomes.

💬 Just type your question — and let's talk!`;

        await this.bot.sendMessage(chatId, welcomeMessage);
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const userMessage = msg.text;
        

        try {
            // Отправляем индикатор печати
            await this.bot.sendChatAction(chatId, 'typing');

            // Проверяем, хочет ли пользователь подключиться (написал "+")
            if (userMessage.trim() === '+') {
                await this.startSurvey(chatId);
            } else {
                // Получаем ответ от OpenAI
                const response = await this.getAIResponse(userMessage);
                
                // Добавляем призыв к действию в конце каждого ответа
                const responseWithCTA = response + '\n\n---\n\nIf you are ready to connect to the bot or want to talk to the curator, fill out the application by answering a few questions. Write + in the chat.';
                await this.bot.sendMessage(chatId, responseWithCTA, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
            await this.bot.sendMessage(chatId, 'Sorry, I encountered an error. Please try again or contact our support @wenaysupport');
        }
    }

    async getAIResponse(userMessage) {
        const systemPrompt = `You are Wenay AI Assistant, a helpful bot that provides information about Wenay Bot trading system. 

Your task is to have a dialogue and tell the person everything they want to know about us, the team, the product, conditions and everything else the user asks you about, based on the knowledge base you have. You don't need to make anything up on your own, you just need to inform. The knowledge base has everything you need, as well as answers to the most popular questions.

If a user asks a question that is not answered in the knowledge base, then you politely suggest that they take a short survey and then a curator will contact them and help answer their question or help them connect.

IMPORTANT: Always respond in the same language the user writes to you. If they write in English, respond in English. If they write in Russian, respond in Russian.

Knowledge Base:
${knowledgeBase}

Guidelines:
- Be helpful and informative
- Only provide information from the knowledge base
- Don't make up information
- If you don't know something, suggest the survey
- Be professional but friendly
- Always include the disclaimer about financial advice when discussing returns`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        return completion.choices[0].message.content;
    }


    async startSurvey(chatId) {
        this.userSessions.set(chatId, {
            currentQuestion: 0,
            answers: {},
            startTime: new Date()
        });

        await this.askCurrentQuestion(chatId);
    }

    async askCurrentQuestion(chatId) {
        const session = this.userSessions.get(chatId);
        const question = surveyQuestions[session.currentQuestion];

        if (!question) {
            await this.completeSurvey(chatId);
            return;
        }

        const keyboard = {
            inline_keyboard: question.options.map((option, index) => [{
                text: option,
                callback_data: `answer_${index + 1}`
            }])
        };

        await this.bot.sendMessage(chatId, question.text, {
            reply_markup: keyboard
        });
    }

    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (data.startsWith('answer_')) {
            const answerIndex = parseInt(data.split('_')[1]);
            await this.processSurveyAnswer(chatId, answerIndex);
        }

        await this.bot.answerCallbackQuery(callbackQuery.id);
    }


    async processSurveyAnswer(chatId, answerIndex) {
        const session = this.userSessions.get(chatId);
        const question = surveyQuestions[session.currentQuestion];

        session.answers[`question_${session.currentQuestion + 1}`] = {
            question: question.text,
            answer: question.options[answerIndex - 1],
            answerIndex: answerIndex
        };

        session.currentQuestion++;
        await this.askCurrentQuestion(chatId);
    }

    async completeSurvey(chatId) {
        const session = this.userSessions.get(chatId);
        
        // Получаем информацию о пользователе
        let userInfo = null;
        try {
            const chat = await this.bot.getChat(chatId);
            userInfo = chat;
        } catch (error) {
            console.log('Не удалось получить информацию о пользователе:', error.message);
        }
        
        // Форматируем данные для отправки
        const connectionRequest = formatConnectionRequest(session.answers, chatId, userInfo);
        
        try {
            // Отправляем данные в канал поддержки
            await this.bot.sendMessage(process.env.SUPPORT_CHANNEL_ID, connectionRequest, {
                parse_mode: 'Markdown'
            });

            // Уведомляем пользователя
            await this.bot.sendMessage(chatId, 
                `Thank you for your answers. Your curator will contact you shortly. If you have any further questions, I will be happy to answer them.`
            );
        } catch (error) {
            console.error('Ошибка при отправке данных в группу поддержки:', error);
            await this.bot.sendMessage(chatId, 
                'Thank you for your answers. Your curator will contact you shortly. If you have any further questions, I will be happy to answer them.'
            );
        }

        // Очищаем сессию
        this.userSessions.delete(chatId);
    }

    getApp() {
        const app = express();
        
        app.use(express.json());
        
        // Базовый роут для проверки работоспособности
        app.get('/', (req, res) => {
            res.json({ 
                status: 'ok', 
                bot: 'Wenay Bot English Assistant',
                version: '1.0.0'
            });
        });

        return app;
    }
}

module.exports = WenayBotAssistant;
