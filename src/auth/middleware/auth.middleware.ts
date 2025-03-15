import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';

export class AuthMiddleware {
  private authService: AuthService;
  private jwtSecret: string;
  
  constructor(authService: AuthService, jwtSecret: string) {
    this.authService = authService;
    this.jwtSecret = jwtSecret;
  }
  
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: '未提供授權令牌' });
        return;
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded: any = jwt.verify(token, this.jwtSecret);
        
        // 獲取用戶信息
        const user = await this.authService.getUserById(decoded.userId);
        
        if (!user || !user.isActive) {
          res.status(401).json({ message: '用戶不存在或已停用' });
          return;
        }
        
        // 將用戶信息添加到請求對象
        (req as any).user = user;
        next();
      } catch (error) {
        res.status(401).json({ message: '無效的令牌' });
        return;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({ message: '伺服器錯誤' });
      return;
    }
  };
  
  authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = (req as any).user;
        
        if (!user) {
          res.status(401).json({ message: '未授權' });
          return;
        }
        
        if (!roles.includes(user.role)) {
          res.status(403).json({ message: '權限不足' });
          return;
        }
        
        next();
      } catch (error) {
        console.error('Authorization error:', error);
        res.status(500).json({ message: '伺服器錯誤' });
        return;
      }
    };
  };
}
