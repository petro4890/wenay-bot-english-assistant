function formatConnectionRequest(answers, chatId, userInfo = null) {
    let formattedRequest = `⚠️ Connection request\n`;
    
    // Если есть информация о пользователе, показываем имя и ссылку
    if (userInfo && (userInfo.first_name || userInfo.username)) {
        const displayName = userInfo.first_name || userInfo.username;
        formattedRequest += `🌐 Link: [${displayName}](tg://user?id=${chatId})\n`;
    } else {
        formattedRequest += `🌐 Link: [User Profile](tg://user?id=${chatId})\n`;
    }

    // Добавляем ответы на вопросы в простом формате
    Object.keys(answers).forEach((key, index) => {
        const questionNum = index + 1;
        const answer = answers[key];
        
        switch(questionNum) {
            case 1:
                formattedRequest += `1. Experience: ${answer.answer}\n`;
                break;
            case 2:
                formattedRequest += `2. Deposit: ${answer.answer}\n`;
                break;
            case 3:
                formattedRequest += `3. Product: ${answer.answer}\n`;
                break;
            case 4:
                formattedRequest += `4. Source: ${answer.answer}\n`;
                break;
        }
    });

    return formattedRequest;
}

function validateEnvironmentVariables() {
    const required = [
        'TELEGRAM_BOT_TOKEN',
        'OPENAI_API_KEY',
        'SUPPORT_CHANNEL_ID'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

module.exports = {
    formatConnectionRequest,
    validateEnvironmentVariables
};
