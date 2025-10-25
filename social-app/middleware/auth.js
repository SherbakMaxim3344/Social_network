import { readJSON } from '../utils/data.js';

export const checkUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.redirect('/?error=invalid_user');
    }
    
    const users = await readJSON('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.redirect('/?error=user_not_found');
    }
    
    if (user.status === 'blocked') {
      return res.redirect('/?error=account_blocked');
    }
    
    if (user.status === 'pending') {
      return res.redirect('/?error=account_pending');
    }
    
    // Добавляем пользователя в req для использования в других middleware
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.redirect('/?error=auth_error');
  }
};

export const redirectAdmins = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return res.redirect(`https://localhost:3444/?userId=${req.user.id}`);
  }
  next();
};