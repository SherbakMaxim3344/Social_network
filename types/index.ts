export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  birthDate: string | null;
  avatar: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'blocked' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  userId: number;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  author?: {
    id: number;
    name: string;
    avatar: string;
  };
}

export interface Friendship {
  id: number;
  userId: number;
  friendId: number;
  createdAt?: string;
}

export interface PostLike {
  id: number;
  postId: number;
  userId: number;
  createdAt: string;
}