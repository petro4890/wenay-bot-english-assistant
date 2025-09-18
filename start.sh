#!/bin/bash

echo "🚀 Запуск Wenay Bot English Assistant..."

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Скопируйте .env.example в .env и заполните необходимые переменные"
    exit 1
fi

# Проверяем наличие node_modules
if [ ! -d node_modules ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

# Создаем папку для логов если её нет
mkdir -p logs

# Запускаем бота
echo "✅ Запускаем бота..."
npm start
