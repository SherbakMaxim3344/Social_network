import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/shared/public/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

// EJS шаблонизатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware для отладки
app.use((req, res, next) => {
    if (req.url.match(/\.(css|png|jpg|jpeg)$/)) {
        console.log(`📁 Статический файл: ${req.url}`);
    }
    next();
});

// Импортируем роутеры
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import friendsRouter from './routes/friends.js';
import postsRouter from './routes/posts.js';

// Подключаем роутеры
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', friendsRouter);
app.use('/', postsRouter);

// УДАЛИТЬ ВСЕ API ENDPOINTS ОТСЮДА - они уже в posts.js

const PORT = process.env.PORT || 3005;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🌐 СОЦИАЛЬНАЯ СЕТЬ ЗАПУЩЕНА!');
  console.log('='.repeat(50));
  console.log(`📍 http://localhost:${PORT}`);
  console.log('='.repeat(50));
});