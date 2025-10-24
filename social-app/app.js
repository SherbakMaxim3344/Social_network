import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы из общей папки
app.use('/shared/public', express.static(path.join(__dirname, '../shared/public')));
app.use('/images', express.static(path.join(__dirname, '../shared/public/images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// EJS шаблонизатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

// API endpoints
import { readJSON } from './utils/data.js';

app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Не возвращаем пароль в API
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/posts/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    const posts = await readJSON('posts.json');
    
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    const friendsPosts = posts.filter(post => 
      friendIds.includes(post.userId) || post.userId === userId
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const postsWithAuthors = friendsPosts.map(post => ({
      ...post,
      author: users.find(u => u.id === post.userId)
    }));
    
    res.json(postsWithAuthors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🌐 СОЦИАЛЬНАЯ СЕТЬ ЗАПУЩЕНА!');
  console.log('='.repeat(50));
  console.log(`📍 http://localhost:${PORT}`);
  console.log('🚀 ФУНКЦИОНАЛ:');
  console.log('   👤 Регистрация и вход');
  console.log('   📷 Управление фотографией');
  console.log('   🤝 Управление друзьями');
  console.log('   📰 Лента новостей');
  console.log('   ✍️ Добавление постов');
  console.log('   🔐 Автоматический редирект админов в админку');
  console.log('   💾 Сохранение данных в общий JSON');
  console.log('='.repeat(50));
});