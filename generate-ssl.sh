#!/bin/bash

echo "🔐 Генерация SSL сертификатов..."

# Создаем папку для SSL
mkdir -p ssl

# Генерируем самоподписанный сертификат
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout ssl/localhost.key \
  -out ssl/localhost.crt \
  -days 365 \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Social Network/CN=localhost"

echo "✅ SSL сертификаты созданы:"
echo "   📄 ssl/localhost.key"
echo "   📄 ssl/localhost.crt"
echo ""
echo "⚠️  Для браузера: при предупреждении безопасности выберите 'Advanced' → 'Proceed to localhost'"