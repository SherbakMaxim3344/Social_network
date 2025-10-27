import express from 'express';
import { readJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { checkUserStatus, redirectAdmins } from '../middleware/auth.js';
import { User, Friendship } from '../types/index.js';

const router = express.Router();

// Страница профиля пользователя
router.get('/profile/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users: User[] = await readJSON('users.json') as User[];
    const friendships: Friendship[] = await readJSON('friendships.json') as Friendship[];
    
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) {
      res.redirect('/?error=user_not_found');
      return;
    }
    
    // Получаем ID друзей
    const friendIds = friendships
      .filter((f: Friendship) => f.userId === userId)
      .map((f: Friendship) => f.friendId);
    
    const friends = users.filter((u: User) => friendIds.includes(u.id));
    
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