#!/bin/bash

# Останавливаем контейнеры если они запущены
echo "🛑 Останавливаем контейнеры..."
docker-compose down 2>/dev/null || true

# Очищаем dangling образы (тег <none>)
echo "🧹 Очистка неиспользуемых Docker образов..."
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    echo "🗑️  Удаление dangling образов:"
    docker images -f "dangling=true"
    docker rmi -f $DANGLING_IMAGES 2>/dev/null || true
    echo "✅ Dangling образы удалены"
else
    echo "✅ Dangling образы не найдены"
fi

# Проверяем наличие SSL сертификатов в shared папке
if [ ! -f "shared/ssl/localhost.crt" ] || [ ! -f "shared/ssl/localhost.key" ]; then
    echo "🔐 Генерация SSL сертификатов..."
    mkdir -p shared/ssl
    openssl req -x509 -newkey rsa:4096 -nodes \
        -keyout shared/ssl/localhost.key \
        -out shared/ssl/localhost.crt \
        -days 365 \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=Social Network/CN=localhost"
    echo "✅ SSL сертификаты созданы"
fi

# Проверяем доступность портов
echo "🔍 Проверка портов..."
if lsof -Pi :3444 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Порт 3444 занят, используем порт 3445"
    export ADMIN_HTTPS_PORT=3445
else
    export ADMIN_HTTPS_PORT=3444
fi

if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Порт 3005 занят, используем порт 3006"
    export SOCIAL_PORT=3006
else
    export SOCIAL_PORT=3005
fi

# Создаем необходимые папки в контейнерах при первом запуске
echo "📁 Создаем структуру папок..."
mkdir -p admin-app/dist-gulp admin-app/dist-webpack admin-app/public admin-app/data admin-app/ssl
mkdir -p social-app/data social-app/public

# Собираем и запускаем с кэшем
echo "🏗️ Собираем новые образы (с использованием кэша)..."
if docker-compose build; then
    echo "🚀 Запускаем контейнеры..."
    ADMIN_HTTPS_PORT=$ADMIN_HTTPS_PORT SOCIAL_PORT=$SOCIAL_PORT docker-compose up -d
    
    # Даем время на запуск
    echo "⏳ Ждем запуска серверов..."
    sleep 10
    
    # Проверяем статус админки через HTTPS
    echo "🔍 Проверяем админку..."
    if curl -k -f https://localhost:$ADMIN_HTTPS_PORT/api/health >/dev/null 2>&1; then
        echo "✅ Админка запущена: https://localhost:$ADMIN_HTTPS_PORT"
    else
        echo "⚠️  Админка HTTPS не доступна, проверяем HTTP..."
        if curl -f http://localhost:3003/api/health >/dev/null 2>&1; then
            echo "✅ Админка запущена (HTTP): http://localhost:3003"
        else
            echo "❌ Админка не запустилась"
        fi
    fi
    
    # Проверяем статус социальной сети
    echo "🔍 Проверяем социальную сеть..."
    if curl -f http://localhost:$SOCIAL_PORT/ >/dev/null 2>&1; then
        echo "✅ Социальная сеть запущена: http://localhost:$SOCIAL_PORT"
    else
        echo "❌ Социальная сеть не запустилась"
    fi
    
    echo ""
    echo "============================================"
    echo "🌐 ПРИЛОЖЕНИЯ ЗАПУЩЕНЫ!"
    echo "============================================"
    echo "🔐 Админка:    https://localhost:$ADMIN_HTTPS_PORT"
    echo "👥 Соц. сеть:  http://localhost:$SOCIAL_PORT"
    echo "============================================"
    
else
    echo "❌ Ошибка сборки Docker образов"
    exit 1
fi