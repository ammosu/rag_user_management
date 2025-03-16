import express from 'express';
import { RAGController } from '../controllers/rag-controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';

export function setupRAGRoutes(
  ragController: RAGController,
  authMiddleware: AuthMiddleware
) {
  const router = express.Router();
  
  // 基本授權檢查中間件
  const auth = authMiddleware.authenticate;
  
  // 向量搜索過濾中間件
  const getVectorSearchFilter = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    // 這裡可以根據用戶權限設置向量搜索過濾條件
    // 例如，獲取用戶可訪問的文檔ID列表
    // 在實際應用中，這可能需要查詢數據庫
    
    // 簡單示例：將用戶ID添加到請求對象
    const user = (req as any).user;
    if (user) {
      (req as any).vectorSearchFilter = {
        userId: user._id,
        departmentId: user.departmentId
      };
    }
    
    next();
  };
  
  // RAG查詢端點
  router.post('/query', auth, getVectorSearchFilter, async (req: express.Request, res: express.Response) => {
    await ragController.executeQuery(req, res);
  });
  
  // 獲取可用模型列表
  router.get('/models', auth, async (req: express.Request, res: express.Response) => {
    await ragController.getAvailableModels(req, res);
  });
  
  return router;
}
