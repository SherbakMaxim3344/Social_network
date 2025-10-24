import express from 'express';
import { readJSON, writeJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { checkUserStatus, redirectAdmins } from '../middleware/auth.js';

const router = express.Router();

// Лента новостей
router.get('/news/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await readJSON('users.json');
    const friendships = await readJSON('friendships.json');
    const posts = await readJSON('posts.json');
    
    const user = users.find(u => u.id === userId);
    
    // Получаем ID друзей
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    // Посты пользователя и его друзей
    const friendsPosts = posts.filter(post => 
      friendIds.includes(post.userId) || post.userId === userId
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Добавляем информацию об авторе
    const postsWithAuthors = friendsPosts.map(post => ({
      ...post,
      author: users.find(u => u.id === post.userId)
    }));
    
    res.render('news', {
      user,
      posts: postsWithAuthors,
      friendsCount: friendIds.length,
      title: `Лента новостей - ${user.name}`,
      defaultAvatar: DEFAULT_AVATAR
    });
  } catch (error) {
    console.error('News feed error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка загрузки новостей',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

// Добавление новости
router.post('/posts/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.redirect(`/news/${userId}?error=empty_content`);
    }
    
    const posts = await readJSON('posts.json');
    
    const newPost = {
      id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
      userId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    posts.push(newPost);
    await writeJSON('posts.json', posts);
    
    console.log(`📝 Новый пост от пользователя ${userId}`);
    
    res.redirect(`/news/${userId}`);
  } catch (error) {
    console.error('Add post error:', error);
    res.status(500).render('error', { 
      error: 'Ошибка добавления поста',
      defaultAvatar: DEFAULT_AVATAR
    });
  }
});

export default router;