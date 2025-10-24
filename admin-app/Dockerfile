FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем необходимые папки
RUN mkdir -p data dist-gulp dist-webpack ssl

# Генерируем SSL сертификаты
RUN apk add --no-cache openssl && \
    openssl req -x509 -newkey rsa:4096 -nodes \
      -keyout ssl/localhost.key \
      -out ssl/localhost.crt \
      -days 365 \
      -subj "/C=RU/ST=Moscow/L=Moscow/O=Social Network/CN=localhost"

# Удаляем старые сборки и собираем заново
RUN rm -rf dist-gulp dist-webpack
RUN npx gulp build
RUN npx webpack --mode=production

EXPOSE 3003 3444

CMD ["node", "app.js"]