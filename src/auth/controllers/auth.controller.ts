import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';

export class AuthController {
  private authService: AuthService;
  private jwtSecret: string;
  
  constructor(authService: AuthService, jwtSecret: string) {
    this.authService = authService;
    this.jwtSecret = jwtSecret;
  }
  
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: '缺少電子郵件或密碼' });
      }
      
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: '無效的憑證' });
      }
      
      // 生成 JWT 令牌
      const token = jwt.sign(
        {
          userId: user._id ? user._id.toString() : '',
          username: user.username,
          role: user.role,
          departmentId: user.departmentId?.toString()
        },
        this.jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as jwt.SignOptions
      );
      
      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          departmentId: user.departmentId
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  async register(req: Request, res: Response) {
    try {
      const { email, username, password, displayName } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ message: '缺少必要的註冊信息' });
      }
      
      // 檢查電子郵件是否已存在
      const existingUser = await this.authService.db.collection('users').findOne({ email });
      
      if (existingUser) {
        return res.status(400).json({ message: '電子郵件已被使用' });
      }
      
      // 創建新用戶
      const newUser = await this.authService.createUser({
        email,
        username,
        password,
        displayName: displayName || username,
        role: UserRole.USER
      });
      
      // 生成 JWT 令牌
      const token = jwt.sign(
        {
          userId: newUser._id ? newUser._id.toString() : '',
          username: newUser.username,
          role: newUser.role,
          departmentId: newUser.departmentId?.toString()
        },
        this.jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as jwt.SignOptions
      );
      
      return res.status(201).json({
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          displayName: newUser.displayName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        departmentId: user.departmentId
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
}
