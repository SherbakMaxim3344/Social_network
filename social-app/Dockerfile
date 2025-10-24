FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем необходимые папки
RUN mkdir -p data public views

EXPOSE 3005

CMD ["node", "app.js"]