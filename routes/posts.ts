import express from 'express';
import { readJSON, writeJSON, DEFAULT_AVATAR } from '../utils/data.js';
import { checkUserStatus, redirectAdmins } from '../middleware/auth.js';
import { User, Post, Friendship, PostLike, Comment } from '../types/index.js';

const router = express.Router();

// Лента новостей
router.get('/news/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users: User[] = await readJSON('users.json') as User[];
    const friendships: Friendship[] = await readJSON('friendships.json') as Friendship[];
    const posts: Post[] = await readJSON('posts.json') as Post[];
    const postLikes: PostLike[] = await readJSON('post_likes.json') as PostLike[];
    
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) {
      res.redirect('/?error=user_not_found');
      return;
    }
    
    // Получаем ID друзей
    const friendIds = friendships
      .filter((f: Friendship) => f.userId === userId)
      .map((f: Friendship) => f.friendId);
    
    // Посты пользователя и его друзей
    const friendsPosts = posts.filter((post: Post) => 
      friendIds.includes(post.userId) || post.userId === userId
    ).sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Добавляем информацию об авторе и проверяем лайки
    const postsWithAuthors = friendsPosts.map(post => {
      const author = users.find((u: User) => u.id === post.userId);
      const userLike = postLikes.find((like: PostLike) => 
        like.postId === post.id && like.userId === userId
      );
      
      return {
        ...post,
        author: author,
        liked: !!userLike,
        likes: post.likes || 0,
        comments: post.comments || []
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

// Добавление поста
router.post('/api/posts/:userId', checkUserStatus, redirectAdmins, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { content } = req.body;
    
    console.log('📝 Добавление поста:', { userId, content });
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'empty_content' });
    }
    
    const posts: Post[] = await readJSON('posts.json') as Post[];
    const users: User[] = await readJSON('users.json') as User[];
    
    const newPost: Post = {
      id: posts.length > 0 ? Math.max(...posts.map((p: Post) => p.id)) + 1 : 1,
      userId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    posts.push(newPost);
    await writeJSON('posts.json', posts);
    
    const author = users.find((u: User) => u.id === userId);
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
    const userId = parseInt(req.query.userId as string);
    
    console.log('❤️ Лайк поста:', { postId, userId });
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const posts: Post[] = await readJSON('posts.json') as Post[];
    let postLikes: PostLike[] = await readJSON('post_likes.json') as PostLike[];
    
    const existingLike = postLikes.find((like: PostLike) => 
      like.postId === postId && like.userId === userId
    );
    
    const post = posts.find((p: Post) => p.id === postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    if (existingLike) {
      // Убираем лайк
      post.likes = Math.max(0, (post.likes || 0) - 1);
      postLikes = postLikes.filter((like: PostLike) => 
        !(like.postId === postId && like.userId === userId)
      );
    } else {
      // Добавляем лайк
      post.likes = (post.likes || 0) + 1;
      postLikes.push({
        id: postLikes.length > 0 ? Math.max(...postLikes.map((l: PostLike) => l.id)) + 1 : 1,
        postId,
        userId,
        createdAt: new Date().toISOString()
      });
    }
    
    await writeJSON('posts.json', posts);
    await writeJSON('post_likes.json', postLikes);
    
    res.json({ 
      success: true, 
      likes: post.likes,
      liked: !existingLike
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
    
    const posts: Post[] = await readJSON('posts.json') as Post[];
    const users: User[] = await readJSON('users.json') as User[];
    
    const post = posts.find((p: Post) => p.id === postId);
    const user = users.find((u: User) => u.id === parseInt(userId));
    
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    
    if (!post.comments) {
      post.comments = [];
    }
    
    const newComment: Comment = {
      id: post.comments.length > 0 ? Math.max(...post.comments.map((c: Comment) => c.id)) + 1 : 1,
      userId: parseInt(userId),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      author: {
        id: user!.id,
        name: user!.name,
        avatar: user!.avatar
      }
    };
    
    post.comments.push(newComment);
    await writeJSON('posts.json', posts);
    
    res.json({ 
      success: true, 
      comment: newComment 
    });
  } catch (error) {
    console.error('❌ Add comment error:', error);
    res.status(500).json({ error: 'Ошибка добавления комментария' });
  }
});

export default router;