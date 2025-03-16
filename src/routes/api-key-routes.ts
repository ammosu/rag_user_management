import express from 'express';
import { ApiKeyController } from '../controllers/api-key-controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';

export function setupApiKeyRoutes(
  apiKeyController: ApiKeyController,
  authMiddleware: AuthMiddleware
) {
  const router = express.Router();
  
  // 基本授權檢查中間件
  const auth = authMiddleware.authenticate;
  
  // 獲取用戶的 API 密鑰
  router.get('/api-keys', auth, async (req: express.Request, res: express.Response) => {
    await apiKeyController.getUserApiKeys(req, res);
  });
  
  // 生成新的 API 密鑰
  router.post('/api-keys', auth, async (req: express.Request, res: express.Response) => {
    await apiKeyController.generateApiKey(req, res);
  });
  
  // 刪除 API 密鑰
  router.delete('/api-keys/:id', auth, async (req: express.Request, res: express.Response) => {
    await apiKeyController.revokeApiKey(req, res);
  });
  
  return router;
}
