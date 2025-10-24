import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import https from 'https';
import http from 'http';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы - теперь из shared папки
app.use('/shared/public', express.static(path.join(__dirname, 'public')));
app.use('/dist-gulp', express.static(path.join(__dirname, 'dist-gulp')));
app.use('/dist-webpack', express.static(path.join(__dirname, 'dist-webpack')));

// EJS шаблонизатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const DATA_DIR = path.join(__dirname, 'data');

// Функции для работы с JSON файлами
const readJSON = async (filename) => {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

const writeJSON = async (filename, data) => {
  try {
    await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    return false;
  }
};

// Middleware для определения типа сборки
app.use((req, res, next) => {
  res.locals.buildType = req.query.build || 'gulp';
  next();
});

// Главная страница - список пользователей
app.get('/', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    res.render('users', { 
      users,
      title: 'Управление пользователями',
      buildType: res.locals.buildType
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка загрузки пользователей' });
  }
});

// Страница пользователей (альтернативный маршрут)
app.get('/users', async (req, res) => {
  try {
    const users = await readJSON('users.json');
    res.render('users', { 
      users,
      title: 'Управление пользователями',
      buildType: res.locals.buildType
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка загрузки пользователей' });
  }
});

// Страница друзей пользователя
app.get('/friends/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).render('error', { error: 'Пользователь не найден' });
    }
    
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    const friends = users.filter(u => friendIds.includes(u.id));
    
    res.render('friends', {
      user,
      friends,
      title: `Друзья ${user.name}`,
      buildType: res.locals.buildType
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка загрузки друзей' });
  }
});

// Страница новостей друзей
app.get('/news/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    const posts = await readJSON('posts.json');
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).render('error', { error: 'Пользователь не найден' });
    }
    
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    const friendsPosts = posts.filter(post => 
      friendIds.includes(post.userId) || post.userId === userId
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Добавляем информацию об авторе к каждому посту
    const postsWithAuthors = friendsPosts.map(post => ({
      ...post,
      author: users.find(u => u.id === post.userId)
    }));
    
    res.render('news', {
      user,
      posts: postsWithAuthors,
      title: `Лента новостей ${user.name}`,
      buildType: res.locals.buildType
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка загрузки новостей' });
  }
});

// Форма редактирования пользователя
app.get('/users/:id/edit', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = await readJSON('users.json');
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).render('error', { error: 'Пользователь не найден' });
    }
    
    res.render('user-edit', {
      user,
      title: `Редактирование ${user.name}`,
      buildType: res.locals.buildType
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка загрузки пользователя' });
  }
});

// Обновление пользователя
app.post('/users/:id/update', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, role, status, birthDate } = req.body;
    
    const users = await readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).render('error', { error: 'Пользователь не найден' });
    }
    
    users[userIndex] = {
      ...users[userIndex],
      name,
      email,
      role,
      status,
      birthDate: birthDate || users[userIndex].birthDate,
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeJSON('users.json', users);
    
    if (success) {
      res.redirect(`/?build=${res.locals.buildType}`);
    } else {
      res.status(500).render('error', { error: 'Ошибка сохранения пользователя' });
    }
  } catch (error) {
    res.status(500).render('error', { error: 'Ошибка обновления пользователя' });
  }
});

// API для проверки сборок
app.get('/api/builds', async (req, res) => {
  try {
    const gulpFiles = await fs.readdir(path.join(__dirname, 'dist-gulp'));
    const webpackFiles = await fs.readdir(path.join(__dirname, 'dist-webpack'));
    
    res.json({
      gulp: {
        status: 'built',
        files: gulpFiles,
        features: ['LESS compilation', 'CSS minification', 'Babel transformation', 'JS minification']
      },
      webpack: {
        status: 'built', 
        files: webpackFiles,
        features: ['Module bundling', 'Tree shaking', 'Asset optimization', 'Production build']
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Builds not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает!',
    timestamp: new Date().toISOString(),
    protocol: req.protocol
  });
});

const HTTP_PORT = process.env.HTTP_PORT || 3003;
const HTTPS_PORT = process.env.HTTPS_PORT || 3444;

// Запуск HTTP сервера (редирект на HTTPS)
const httpServer = http.createServer((req, res) => {
  const httpsUrl = `https://${req.headers.host?.replace(/:\d+$/, '')}:${HTTPS_PORT}${req.url}`;
  res.writeHead(301, { Location: httpsUrl });
  res.end();
});

// SSL опции
const sslOptions = {
  key: fsSync.readFileSync(path.join(__dirname, 'ssl/localhost.key')),
  cert: fsSync.readFileSync(path.join(__dirname, 'ssl/localhost.crt'))
};

// Запуск HTTPS сервера
const httpsServer = https.createServer(sslOptions, app);

// Запуск серверов
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🔒 HTTP сервер запущен (редирект на HTTPS)');
  console.log(`📍 http://localhost:${HTTP_PORT} → https://localhost:${HTTPS_PORT}`);
});

httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('✅ АДМИНКА СОЦИАЛЬНОЙ СЕТИ ЗАПУЩЕНА С HTTPS!');
  console.log('='.repeat(50));
  console.log(`🔐 Админ панель: https://localhost:${HTTPS_PORT}`);
  console.log(`📊 API health: https://localhost:${HTTPS_PORT}/api/health`);
  console.log('='.repeat(50));
  console.log('🚀 ФУНКЦИОНАЛ:');
  console.log('   👥 Управление пользователями');
  console.log('   🤝 Просмотр друзей');
  console.log('   📰 Лента новостей');
  console.log('   ⚙️ Две системы сборки (Gulp + Webpack)');
  console.log('   🔒 Защищенное HTTPS соединение');
  console.log('='.repeat(50));
});