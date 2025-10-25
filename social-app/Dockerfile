FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем ВСЕ файлы включая CSS
COPY . .

# Создаем структуру папок и копируем CSS файлы
RUN mkdir -p /app/public/css && \
    find . -name "*.css" -exec cp {} /app/public/css/ \; 2>/dev/null || true && \
    ls -la /app/public/css/

EXPOSE 3005

CMD ["node", "app.js"]