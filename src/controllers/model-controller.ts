import { Request, Response } from 'express';
import { ModelService } from '../services/model-service';
import { ModelConfig, ModelRoutingRule } from '../models/model-types';

export class ModelController {
  private modelService: ModelService;
  
  constructor(modelService: ModelService) {
    this.modelService = modelService;
  }
  
  // 獲取所有模型
  async getAllModels(req: Request, res: Response) {
    try {
      const models = await this.modelService.getAllModels();
      res.json(models);
    } catch (error) {
      console.error('Error getting models:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 獲取活躍模型
  async getActiveModels(req: Request, res: Response) {
    try {
      const models = await this.modelService.getActiveModels();
      res.json(models);
    } catch (error) {
      console.error('Error getting active models:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 獲取模型詳情
  async getModelById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const model = await this.modelService.getModelById(id);
      
      if (!model) {
        return res.status(404).json({ message: '模型不存在' });
      }
      
      res.json(model);
    } catch (error) {
      console.error('Error getting model:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 創建模型
  async createModel(req: Request, res: Response) {
    try {
      const modelData = req.body as Omit<ModelConfig, '_id' | 'createdAt' | 'updatedAt'>;
      const model = await this.modelService.createModel(modelData);
      res.status(201).json(model);
    } catch (error) {
      console.error('Error creating model:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 更新模型
  async updateModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const modelData = req.body as Partial<ModelConfig>;
      const success = await this.modelService.updateModel(id, modelData);
      
      if (!success) {
        return res.status(404).json({ message: '模型不存在或更新失敗' });
      }
      
      res.json({ message: '模型更新成功' });
    } catch (error) {
      console.error('Error updating model:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 刪除模型
  async deleteModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await this.modelService.deleteModel(id);
      
      if (!success) {
        return res.status(404).json({ message: '模型不存在或刪除失敗' });
      }
      
      res.json({ message: '模型刪除成功' });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 切換模型活躍狀態
  async toggleModelActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive 必須是布爾值' });
      }
      
      const success = await this.modelService.toggleModelActive(id, isActive);
      
      if (!success) {
        return res.status(404).json({ message: '模型不存在或更新失敗' });
      }
      
      res.json({ message: `模型${isActive ? '啟用' : '停用'}成功` });
    } catch (error) {
      console.error('Error toggling model status:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 獲取所有路由規則
  async getAllRoutingRules(req: Request, res: Response) {
    try {
      const rules = await this.modelService.getAllRoutingRules();
      res.json(rules);
    } catch (error) {
      console.error('Error getting routing rules:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 獲取活躍路由規則
  async getActiveRoutingRules(req: Request, res: Response) {
    try {
      const rules = await this.modelService.getActiveRoutingRules();
      res.json(rules);
    } catch (error) {
      console.error('Error getting active routing rules:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 創建路由規則
  async createRoutingRule(req: Request, res: Response) {
    try {
      const ruleData = req.body as Omit<ModelRoutingRule, '_id' | 'createdAt' | 'updatedAt'>;
      const rule = await this.modelService.createRoutingRule(ruleData);
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating routing rule:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 更新路由規則
  async updateRoutingRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ruleData = req.body as Partial<ModelRoutingRule>;
      const success = await this.modelService.updateRoutingRule(id, ruleData);
      
      if (!success) {
        return res.status(404).json({ message: '路由規則不存在或更新失敗' });
      }
      
      res.json({ message: '路由規則更新成功' });
    } catch (error) {
      console.error('Error updating routing rule:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 刪除路由規則
  async deleteRoutingRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await this.modelService.deleteRoutingRule(id);
      
      if (!success) {
        return res.status(404).json({ message: '路由規則不存在或刪除失敗' });
      }
      
      res.json({ message: '路由規則刪除成功' });
    } catch (error) {
      console.error('Error deleting routing rule:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 切換路由規則活躍狀態
  async toggleRoutingRuleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive 必須是布爾值' });
      }
      
      const success = await this.modelService.toggleRoutingRuleActive(id, isActive);
      
      if (!success) {
        return res.status(404).json({ message: '路由規則不存在或更新失敗' });
      }
      
      res.json({ message: `路由規則${isActive ? '啟用' : '停用'}成功` });
    } catch (error) {
      console.error('Error toggling routing rule status:', error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
}
