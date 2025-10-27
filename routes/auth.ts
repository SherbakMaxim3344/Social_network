import express from 'express';
import { readJSON, writeJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { User } from '../types/index.js';

const router = express.Router();

// Главная страница - вход
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Социальная сеть - Вход',
    error: req.query.error,
    defaultAvatar: '/images/default-avatar.png'
  });
});

// Страница регистрации
router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Регистрация в социальной сети',
    error: req.query.error,
    defaultAvatar: DEFAULT_AVATAR
  });
});

// Обработка регистрации
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log(`🔧 Регистрация: ${name}, ${email}, ${password}`);
    
    // Валидация
    if (!name || !email || !password) {
      return res.render('register', { 
        error: 'Все поля обязательны для заполнения',
        title: 'Регистрация',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    if (password.length < 6) {
      return res.render('register', { 
        error: 'Пароль должен содержать минимум 6 символов',
        title: 'Регистрация',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    const users: User[] = await readJSON('users.json') as User[];
    console.log(`📊 Текущие пользователи: ${users.length}`);
    
    // Проверяем, нет ли уже пользователя с таким email
    const existingUser = users.find((u: User) => u.email === email);
    if (existingUser) {
      console.log(`❌ Пользователь с email ${email} уже существует`);
      return res.render('register', { 
        error: 'Пользователь с таким email уже существует',
        title: 'Регистрация',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    // Создаем нового пользователя
    const newUserId = users.length > 0 ? Math.max(...users.map((u: User) => u.id)) + 1 : 1;
    const newUser: User = {
      id: newUserId,
      name,
      email,
      password,
      avatar: DEFAULT_AVATAR,
      role: 'user',
      status: 'active',
      birthDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    const writeSuccess = await writeJSON('users.json', users);
    
    if (writeSuccess) {
      console.log(`✅ Новый пользователь зарегистрирован: ${name} (${email}), ID: ${newUserId}`);
      res.redirect(`/news/${newUser.id}`);
    } else {
      console.log(`❌ Ошибка сохранения пользователя`);
      res.status(500).render('error', { 
        error: 'Ошибка сохранения данных',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка регистрации: ' + (error as Error).message,
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

// Обработка входа
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users: User[] = await readJSON('users.json') as User[];
    
    const user = users.find((u: User) => u.email === email && u.password === password);
    if (!user) {
      return res.render('index', { 
        error: 'Неверный email или пароль',
        title: 'Социальная сеть - Вход',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    // Проверяем статус пользователя
    if (user.status === 'blocked') {
      return res.render('index', { 
        error: 'Ваш аккаунт заблокирован',
        title: 'Социальная сеть - Вход',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    if (user.status === 'pending') {
      return res.render('index', { 
        error: 'Ваш аккаунт ожидает подтверждения',
        title: 'Социальная сеть - Вход',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    // РЕДИРЕКТ В ЗАВИСИМОСТИ ОТ РОЛИ
    if (user.role === 'admin') {
      console.log(`🔐 Админ ${user.name} перенаправлен в админку`);
      res.redirect(`https://localhost:3444/?userId=${user.id}`);
    } else {
      console.log(`👤 Пользователь ${user.name} вошел в соцсеть`);
      res.redirect(`/news/${user.id}`);
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка входа',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

export default router;