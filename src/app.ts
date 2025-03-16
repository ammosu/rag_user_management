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
import { ModelService } from './services/model-service';
import { QueryClassifier } from './services/query-classifier';
import { ModelRouter } from './services/model-router';
import { LLMService } from './services/llm-service';
import { RetrievalService } from './services/retrieval-service';
import { ModelController } from './controllers/model-controller';
import { RAGController } from './controllers/rag-controller';
import { ApiKeyController } from './controllers/api-key-controller';
import { setupModelRoutes } from './routes/model-routes';
import { setupRAGRoutes } from './routes/rag-routes';
import { setupApiKeyRoutes } from './routes/api-key-routes';
import { setupOpenAICompatibleRoutes, extendAuthServiceWithApiKeys } from './api/openai-compatible/routes';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
    
    // 初始化認證服務
    const authService = new AuthService(client);
    const authMiddleware = new AuthMiddleware(authService, jwtSecret);
    const authController = new AuthController(authService, jwtSecret);
    
    // 初始化 SSO 服務
    const ssoService = new SSOService(client, authService, ssoConfig);
    const ssoController = new SSOController(ssoService);
    
    // 初始化 LLM 服務
    const modelService = new ModelService(client);
    const queryClassifier = new QueryClassifier();
    const modelRouter = new ModelRouter(modelService, queryClassifier);
    const llmService = new LLMService(modelRouter);
    const retrievalService = new RetrievalService(client);
    
    // 初始化控制器
    const modelController = new ModelController(modelService);
    const ragController = new RAGController(llmService, retrievalService);
    const apiKeyController = new ApiKeyController(authService);
    
    // 擴展 AuthService 以支持 API 密鑰管理
    extendAuthServiceWithApiKeys(authService);
    
    // 確保數據目錄存在
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 創建默認的分類關鍵詞和敏感詞文件（如果不存在）
    const keywordsPath = path.join(dataDir, 'classification_keywords.json');
    if (!fs.existsSync(keywordsPath)) {
      const defaultKeywords = {
        technical: ['code', 'algorithm', 'api', 'database', 'programming', 'development', 'bug', 'server'],
        business: ['strategy', 'market', 'sales', 'customer', 'revenue', 'profit', 'competitor', 'partnership'],
        general: ['information', 'summary', 'overview', 'explain', 'describe', 'what', 'how', 'when', 'who']
      };
      fs.writeFileSync(keywordsPath, JSON.stringify(defaultKeywords, null, 2));
    }
    
    const sensitivePath = path.join(dataDir, 'sensitive_terms.json');
    if (!fs.existsSync(sensitivePath)) {
      const defaultSensitiveTerms = ['confidential', 'secret', 'private', 'sensitive', 'internal', 'restricted'];
      fs.writeFileSync(sensitivePath, JSON.stringify(defaultSensitiveTerms, null, 2));
    }
    
    // 設置路由
    app.use('/api/auth', setupAuthRoutes(authController, authMiddleware));
    app.use('/api/auth', setupSSORoutes(ssoController));
    app.use('/api/auth', setupApiKeyRoutes(apiKeyController, authMiddleware));
    app.use('/api/model-manager', setupModelRoutes(modelController, authMiddleware));
    app.use('/api/rag', setupRAGRoutes(ragController, authMiddleware));
    app.use('/v1', setupOpenAICompatibleRoutes(llmService, modelService, authService));
    
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
