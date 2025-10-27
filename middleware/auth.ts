import { Request, Response, NextFunction } from 'express';
import { readJSON } from '../utils/data.js';
import { User } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const checkUserStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      res.redirect('/?error=invalid_user');
      return;
    }
    
    const users: User[] = await readJSON('users.json') as User[];
    const user = users.find((u: User) => u.id === userId);
    
    if (!user) {
      res.redirect('/?error=user_not_found');
      return;
    }
    
    if (user.status === 'blocked') {
      res.redirect('/?error=account_blocked');
      return;
    }
    
    if (user.status === 'pending') {
      res.redirect('/?error=account_pending');
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.redirect('/?error=auth_error');
  }
};

export const redirectAdmins = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    res.redirect(`https://localhost:3444/?userId=${req.user.id}`);
    return;
  }
  next();
};