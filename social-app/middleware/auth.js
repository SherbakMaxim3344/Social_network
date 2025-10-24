import { readJSON, DEFAULT_AVATAR } from '../utils/data.js';

export const checkUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).render('error', { 
        error: 'Пользователь не найден',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    if (user.status === 'blocked') {
      return res.status(403).render('error', { 
        error: 'Ваш аккаунт заблокирован',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    if (user.status === 'pending') {
      return res.status(403).render('error', { 
        error: 'Ваш аккаунт ожидает подтверждения',
        defaultAvatar: DEFAULT_AVATAR
      });
    }
    
    // Добавляем пользователя в запрос для использования в роутах
    req.user = user;
    next();
  } catch (error) {
    res.status(500).render('error', { 
      error: 'Ошибка сервера',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
};

export const redirectAdmins = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return res.redirect(`https://localhost:3444/?userId=${req.user.id}`);
  }
  next();
};