import express from 'express';
import { OpenAICompatibleController } from './controller';
import { LLMService } from '../../services/llm-service';
import { ModelService } from '../../services/model-service';
import { AuthService } from '../../auth/services/auth.service';
import { ApiKey } from '../../models/model-types';
import { ObjectId } from 'mongodb';
import './auth-service-extensions';

// API 密鑰驗證中間件
const validateApiKey = (authService: AuthService) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      res.status(401).json({
        error: {
          message: "Missing API key",
          type: "authentication_error",
          code: "invalid_api_key"
        }
      });
      return;
    }
    
    try {
      // 從數據庫查找 API 密鑰對應的用戶
      const apiKeyRecord = await authService.db.collection('api_keys').findOne({ apiKey });
      
      if (!apiKeyRecord) {
        res.status(401).json({
          error: {
            message: "Invalid API key",
            type: "authentication_error",
            code: "invalid_api_key"
          }
        });
        return;
      }
      
      // 更新最後使用時間
      await authService.db.collection('api_keys').updateOne(
        { apiKey },
        { $set: { lastUsed: new Date() } }
      );
      
      // 獲取用戶信息
      const user = await authService.getUserById(apiKeyRecord.userId.toString());
      
      if (!user || !user.isActive) {
        res.status(401).json({
          error: {
            message: "User not found or inactive",
            type: "authentication_error",
            code: "invalid_user"
          }
        });
        return;
      }
      
      // 將用戶信息添加到請求對象
      (req as any).user = user;
      next();
    } catch (error) {
      console.error('API key validation error:', error);
      res.status(500).json({
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error"
        }
      });
      return;
    }
  };
};

export function setupOpenAICompatibleRoutes(
  llmService: LLMService,
  modelService: ModelService,
  authService: AuthService
) {
  const router = express.Router();
  const controller = new OpenAICompatibleController(llmService, modelService);
  
  // API 密鑰驗證中間件
  const apiKeyAuth = validateApiKey(authService);
  
  // Chat completions endpoint
  router.post('/chat/completions', apiKeyAuth, async (req: express.Request, res: express.Response) => {
    await controller.chatCompletions(req, res);
  });
  
  // Completions endpoint
  router.post('/completions', apiKeyAuth, async (req: express.Request, res: express.Response) => {
    await controller.completions(req, res);
  });
  
  // Models endpoints
  router.get('/models', apiKeyAuth, async (req: express.Request, res: express.Response) => {
    await controller.listModels(req, res);
  });
  
  router.get('/models/:model', apiKeyAuth, async (req: express.Request, res: express.Response) => {
    await controller.getModel(req, res);
  });
  
  return router;
}

// 擴展 AuthService 以支持 API 密鑰管理
export function extendAuthServiceWithApiKeys(authService: AuthService) {
  // 獲取用戶的 API 密鑰
  authService.getUserApiKeys = async (userId: string): Promise<ApiKey[]> => {
    return authService.db.collection('api_keys').find(
      { userId: new ObjectId(userId) },
      { projection: { _id: 1, apiKey: 1, name: 1, createdAt: 1, lastUsed: 1, expiresAt: 1 } }
    ).toArray();
  };
  
  // 生成新的 API 密鑰
  authService.generateApiKey = async (userId: string, name?: string): Promise<ApiKey> => {
    // 生成隨機 API 密鑰
    const crypto = require('crypto');
    const apiKey = `sk-${crypto.randomBytes(24).toString('hex')}`;
    
    const now = new Date();
    const apiKeyRecord: ApiKey = {
      userId,
      apiKey,
      name: name || `API Key ${now.toISOString().split('T')[0]}`,
      createdAt: now
    };
    
    const result = await authService.db.collection('api_keys').insertOne(apiKeyRecord);
    return { ...apiKeyRecord, _id: result.insertedId };
  };
  
  // 刪除 API 密鑰
  authService.revokeApiKey = async (apiKeyId: string, userId: string): Promise<boolean> => {
    const result = await authService.db.collection('api_keys').deleteOne({
      _id: new ObjectId(apiKeyId),
      userId: new ObjectId(userId)
    });
    
    return result.deletedCount > 0;
  };
  
  // 通過 API 密鑰獲取用戶
  authService.getUserByApiKey = async (apiKey: string): Promise<any> => {
    const apiKeyRecord = await authService.db.collection('api_keys').findOne({ apiKey });
    
    if (!apiKeyRecord) {
      return null;
    }
    
    return authService.getUserById(apiKeyRecord.userId.toString());
  };
}
