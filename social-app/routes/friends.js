import express from 'express';
import { readJSON, writeJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { checkUserStatus, redirectAdmins } from '../middleware/auth.js';

const router = express.Router();

// Страница управления друзьями
router.get('/friends/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    
    const user = users.find(u => u.id === userId);
    
    // Получаем текущих друзей
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    const friends = users.filter(u => friendIds.includes(u.id));
    
    // Получаем возможных друзей (все пользователи кроме текущего и уже друзей)
    const potentialFriends = users.filter(u => 
      u.id !== userId && !friendIds.includes(u.id) && u.status === 'active'
    );
    
    res.render('friends', {
      user,
      friends,
      potentialFriends,
      title: `Друзья - ${user.name}`,
      defaultAvatar: DEFAULT_AVATAR
    });
  } catch (error) {
    console.error('Friends error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка загрузки друзей',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

// Добавление друга
router.post('/friends/:userId/add/:friendId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const friendId = parseInt(req.params.friendId);
    
    const friendships = await readJSON('friendships.json');
    
    // Проверяем, не друзья ли уже
    const existingFriendship = friendships.find(f => 
      f.userId === userId && f.friendId === friendId
    );
    
    if (!existingFriendship) {
      const newFriendship = {
        id: friendships.length > 0 ? Math.max(...friendships.map(f => f.id)) + 1 : 1,
        userId,
        friendId,
        createdAt: new Date().toISOString()
      };
      
      friendships.push(newFriendship);
      await writeJSON('friendships.json', friendships);
      console.log(`✅ Пользователь ${userId} добавил в друзья ${friendId}`);
    }
    
    res.redirect(`/friends/${userId}`);
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка добавления друга',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

// Удаление друга
router.post('/friends/:userId/remove/:friendId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const friendId = parseInt(req.params.friendId);
    
    const friendships = await readJSON('friendships.json');
    
    // Удаляем дружбу в обе стороны
    const updatedFriendships = friendships.filter(f => 
      !(f.userId === userId && f.friendId === friendId) &&
      !(f.userId === friendId && f.friendId === userId)
    );
    
    await writeJSON('friendships.json', updatedFriendships);
    console.log(`❌ Пользователь ${userId} удалил из друзей ${friendId}`);
    
    res.redirect(`/friends/${userId}`);
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка удаления друга',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

export default router;