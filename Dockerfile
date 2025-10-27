FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Копируем EJS шаблоны и создаем необходимые папки
RUN cp -r views dist/ && \
    mkdir -p dist/public/css dist/public/images && \
    cp -r public/css/* dist/public/css/ 2>/dev/null || true && \
    cp -r public/images/* dist/public/images/ 2>/dev/null || true

EXPOSE 3005

CMD ["npm", "start"]