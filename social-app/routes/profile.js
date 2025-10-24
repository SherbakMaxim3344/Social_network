import express from 'express';
import { readJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { checkUserStatus, redirectAdmins } from '../middleware/auth.js';

const router = express.Router();

// Страница профиля пользователя
router.get('/profile/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    
    const user = users.find(u => u.id === userId);
    
    // Получаем ID друзей
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    const friends = users.filter(u => friendIds.includes(u.id));
    
    res.render('profile', {
      user,
      friends,
      friendsCount: friendIds.length,
      title: `Профиль - ${user.name}`,
      defaultAvatar: DEFAULT_AVATAR
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка загрузки профиля',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

export default router;