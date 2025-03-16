import { Request, Response } from 'express';
import { AuthService } from '../auth/services/auth.service';
import { User } from '../auth/models/user';
import '../api/openai-compatible/auth-service-extensions';

export class ApiKeyController {
  private authService: AuthService;
  
  constructor(authService: AuthService) {
    this.authService = authService;
  }
  
  // 獲取用戶的 API 密鑰
  async getUserApiKeys(req: Request, res: Response) {
    try {
      const user = req.user as User;
      
      if (!user || !user._id) {
        return res.status(401).json({ message: '未授權' });
      }
      
      const apiKeys = await this.authService.getUserApiKeys(user._id.toString());
      
      // 隱藏完整的 API 密鑰，只返回前 8 個字符和後 4 個字符
      const maskedApiKeys = apiKeys.map(key => ({
        ...key,
        apiKey: key.apiKey ? `${key.apiKey.substring(0, 8)}...${key.apiKey.substring(key.apiKey.length - 4)}` : null
      }));
      
      res.json(maskedApiKeys);
    } catch (error) {
      console.error('Error getting API keys:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 生成新的 API 密鑰
  async generateApiKey(req: Request, res: Response) {
    try {
      const user = req.user as User;
      
      if (!user || !user._id) {
        return res.status(401).json({ message: '未授權' });
      }
      
      const { name } = req.body;
      
      const apiKey = await this.authService.generateApiKey(user._id.toString(), name);
      
      // 返回完整的 API 密鑰（僅在創建時）
      res.status(201).json(apiKey);
    } catch (error) {
      console.error('Error generating API key:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 刪除 API 密鑰
  async revokeApiKey(req: Request, res: Response) {
    try {
      const user = req.user as User;
      
      if (!user || !user._id) {
        return res.status(401).json({ message: '未授權' });
      }
      
      const { id } = req.params;
      
      const success = await this.authService.revokeApiKey(id, user._id.toString());
      
      if (!success) {
        return res.status(404).json({ message: 'API 密鑰不存在或刪除失敗' });
      }
      
      res.json({ message: 'API 密鑰已撤銷' });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
}
