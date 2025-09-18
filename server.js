require('dotenv').config();
const WenayBotAssistant = require('./src/app');
const { validateEnvironmentVariables } = require('./src/utils');

async function startServer() {
    try {
        // Проверяем переменные окружения
        validateEnvironmentVariables();
        
        // Создаем экземпляр бота
        const botAssistant = new WenayBotAssistant();
        
        // Получаем Express приложение
        const app = botAssistant.getApp();
        
        // Добавляем health check endpoints
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        app.get('/ready', (req, res) => {
            res.json({ 
                status: 'ready',
                bot: 'Wenay Bot English Assistant',
                version: '1.0.0'
            });
        });

        // Запускаем сервер
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✓ Сервер запущен на порту ${PORT}`);
            console.log(`✓ Health check: http://localhost:${PORT}/health`);
            console.log(`✓ Ready check: http://localhost:${PORT}/ready`);
            console.log(`✓ Wenay Bot English Assistant готов к работе!`);
        });

    } catch (error) {
        console.error('❌ Ошибка при запуске сервера:', error.message);
        process.exit(1);
    }
}

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM получен, завершаем работу...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT получен, завершаем работу...');
    process.exit(0);
});

startServer();
