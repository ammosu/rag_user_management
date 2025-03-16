import express from 'express';
import { ModelController } from '../controllers/model-controller';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { UserRole } from '../auth/models/user';

export function setupModelRoutes(
  modelController: ModelController,
  authMiddleware: AuthMiddleware
) {
  const router = express.Router();
  
  // 基本授權檢查中間件
  const auth = authMiddleware.authenticate;
  
  // 管理員權限檢查中間件
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const user = (req as any).user;
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: '權限不足' });
      return;
    }
    next();
  };
  
  // 模型管理路由 (需要管理員權限)
  
  // 獲取所有模型
  router.get('/models', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.getAllModels(req, res);
  });
  
  // 獲取活躍模型
  router.get('/models/active', auth, async (req: express.Request, res: express.Response) => {
    await modelController.getActiveModels(req, res);
  });
  
  // 獲取模型詳情
  router.get('/models/:id', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.getModelById(req, res);
  });
  
  // 創建模型
  router.post('/models', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.createModel(req, res);
  });
  
  // 更新模型
  router.put('/models/:id', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.updateModel(req, res);
  });
  
  // 刪除模型
  router.delete('/models/:id', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.deleteModel(req, res);
  });
  
  // 切換模型活躍狀態
  router.patch('/models/:id/active', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.toggleModelActive(req, res);
  });
  
  // 路由規則管理路由 (需要管理員權限)
  
  // 獲取所有路由規則
  router.get('/routing-rules', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.getAllRoutingRules(req, res);
  });
  
  // 獲取活躍路由規則
  router.get('/routing-rules/active', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.getActiveRoutingRules(req, res);
  });
  
  // 創建路由規則
  router.post('/routing-rules', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.createRoutingRule(req, res);
  });
  
  // 更新路由規則
  router.put('/routing-rules/:id', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.updateRoutingRule(req, res);
  });
  
  // 刪除路由規則
  router.delete('/routing-rules/:id', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.deleteRoutingRule(req, res);
  });
  
  // 切換路由規則活躍狀態
  router.patch('/routing-rules/:id/active', auth, requireAdmin, async (req: express.Request, res: express.Response) => {
    await modelController.toggleRoutingRuleActive(req, res);
  });
  
  return router;
}
