import express, { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export function setupAuthRoutes(authController: AuthController, authMiddleware: AuthMiddleware) {
  const router = express.Router();
  
  // 公開路由
  router.post('/login', async (req: Request, res: Response) => {
    await authController.login(req, res);
  });
  
  router.post('/register', async (req: Request, res: Response) => {
    await authController.register(req, res);
  });
  
  // 需要身份驗證的路由
  router.get('/profile', authMiddleware.authenticate, async (req: Request, res: Response) => {
    await authController.getProfile(req, res);
  });
  
  return router;
}
