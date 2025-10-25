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
    const postLikes = await readJSON('post_likes.json');
    
    const user = users.find(u => u.id === userId);
    
    // Получаем ID друзей
    const friendIds = friendships
      .filter(f => f.userId === userId)
      .map(f => f.friendId);
    
    // Посты пользователя и его друзей
    const friendsPosts = posts.filter(post => 
      friendIds.includes(post.userId) || post.userId === userId
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Добавляем информацию об авторе и проверяем лайки
    const postsWithAuthors = friendsPosts.map(post => {
      const author = users.find(u => u.id === post.userId);
      // Проверяем, лайкал ли текущий пользователь этот пост
      const userLike = postLikes.find(like => 
        like.postId === post.id && like.userId === userId
      );
      
      return {
        ...post,
        author: author,
        liked: !!userLike,
        likes: post.likes || 0
      };
    });
    
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

// Добавление новости (AJAX endpoint)
router.post('/api/posts/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { content } = req.body;
    
    console.log('📝 Добавление поста:', { userId, content });
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'empty_content' });
    }
    
    const posts = await readJSON('posts.json');
    const users = await readJSON('users.json');
    
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
    
    const author = users.find(u => u.id === userId);
    const postWithAuthor = {
      ...newPost,
      author: author,
      liked: false
    };
    
    console.log(`✅ Новый пост от пользователя ${userId}`);
    
    res.json({ success: true, post: postWithAuthor });
  } catch (error) {
    console.error('❌ Add post error:', error);
    res.status(500).json({ error: 'Ошибка добавления поста' });
  }
});

// Лайк поста
router.post('/api/posts/:postId/like', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = parseInt(req.query.userId) || req.body.userId || req.user?.id;
    
    console.log('❤️ Лайк поста:', { postId, userId });
    
    if (!userId) {
      console.log('❌ User ID required');
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const posts = await readJSON('posts.json');
    let postLikes = await readJSON('post_likes.json');
    
    // Проверяем, лайкал ли уже пользователь этот пост
    const existingLike = postLikes.find(like => 
      like.postId === postId && like.userId === userId
    );
    
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      console.log('❌ Пост не найден:', postId);
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    if (existingLike) {
      // Убираем лайк
      post.likes = Math.max(0, (post.likes || 0) - 1);
      // Удаляем запись о лайке
      const likeIndex = postLikes.findIndex(like => 
        like.postId === postId && like.userId === userId
      );
      if (likeIndex !== -1) {
        postLikes.splice(likeIndex, 1);
      }
      console.log(`👎 Убран лайк с поста ${postId} пользователем ${userId}`);
    } else {
      // Добавляем лайк
      post.likes = (post.likes || 0) + 1;
      // Сохраняем информацию о лайке
      postLikes.push({
        id: postLikes.length > 0 ? Math.max(...postLikes.map(l => l.id)) + 1 : 1,
        postId,
        userId,
        createdAt: new Date().toISOString()
      });
      console.log(`👍 Добавлен лайк к посту ${postId} пользователем ${userId}`);
    }
    
    await writeJSON('posts.json', posts);
    await writeJSON('post_likes.json', postLikes);
    
    console.log(`✅ Лайк обработан: пост ${postId}, лайков: ${post.likes}, liked: ${!existingLike}`);
    
    res.json({ 
      success: true, 
      likes: post.likes,
      liked: !existingLike // возвращаем текущее состояние
    });
  } catch (error) {
    console.error('❌ Like error:', error);
    res.status(500).json({ error: 'Ошибка обработки лайка' });
  }
});

// Добавление комментария
router.post('/api/posts/:postId/comments', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { userId, content } = req.body;
    
    console.log('💬 Добавление комментария:', { postId, userId, content });
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'empty_comment' });
    }
    
    const posts = await readJSON('posts.json');
    const users = await readJSON('users.json');
    
    const post = posts.find(p => p.id === postId);
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!post) {
      console.log('❌ Пост не найден:', postId);
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    if (!user) {
      console.log('❌ Пользователь не найден:', userId);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Инициализируем комментарии, если их нет
    if (!post.comments) {
      post.comments = [];
    }
    
    const newComment = {
      id: post.comments.length > 0 ? Math.max(...post.comments.map(c => c.id)) + 1 : 1,
      userId: parseInt(userId),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      }
    };
    
    post.comments.push(newComment);
    await writeJSON('posts.json', posts);
    
    console.log(`✅ Новый комментарий к посту ${postId} от пользователя ${userId}`);
    
    res.json({ 
      success: true, 
      comment: newComment 
    });
  } catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
});

// Проверка обновлений
router.get('/api/posts/check-updates/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const lastUpdate = req.query.lastUpdate;
    
    const posts = await readJSON('posts.json');
    
    // Ищем посты, созданные после последнего обновления
    const newPosts = posts.filter(post => 
      post.createdAt > lastUpdate && post.userId !== userId
    );
    
    res.json({
      hasUpdates: newPosts.length > 0,
      newPostsCount: newPosts.length
    });
  } catch (error) {
    console.error('Check updates error:', error);
    res.status(500).json({ error: 'Ошибка проверки обновлений' });
  }
});

// Старый endpoint для редиректа (оставляем для совместимости)
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