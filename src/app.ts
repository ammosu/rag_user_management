import express from 'express';
import { MongoClient } from 'mongodb';
import { AuthService } from './auth/services/auth.service';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { AuthController } from './auth/controllers/auth.controller';
import { setupAuthRoutes } from './auth/routes/auth.routes';
import { SSOService } from './auth/services/sso.service';
import { SSOController } from './auth/controllers/sso.controller';
import { setupSSORoutes } from './auth/routes/sso.routes';
import { ssoConfig } from './config/sso.config';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rag_system';
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  
  // 中間件
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  
  // 初始化 Passport
  app.use(passport.initialize());
  
  try {
    // 資料庫連接
    const client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // 初始化服務
    const authService = new AuthService(client);
    const authMiddleware = new AuthMiddleware(authService, jwtSecret);
    const authController = new AuthController(authService, jwtSecret);
    
    // 初始化 SSO 服務
    const ssoService = new SSOService(client, authService, ssoConfig);
    const ssoController = new SSOController(ssoService);
    
    // 設置路由
    app.use('/api/auth', setupAuthRoutes(authController, authMiddleware));
    app.use('/api/auth', setupSSORoutes(ssoController));
    
    // 健康檢查路由
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    
    // 啟動伺服器
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    // 優雅關閉
    process.on('SIGINT', async () => {
      await client.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
