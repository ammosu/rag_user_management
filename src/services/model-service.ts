import { ModelConfig, ModelRoutingRule, ModelType, ModelProvider, RoutingStrategy } from '../models/model-types';
import { MongoClient, ObjectId } from 'mongodb';

export class ModelService {
  private db: any; // MongoDB 連接實例

  constructor(mongoClient: MongoClient) {
    this.db = mongoClient.db('rag_system');
  }

  // 獲取所有模型配置
  async getAllModels(): Promise<ModelConfig[]> {
    return await this.db.collection('models').find({}).toArray();
  }

  // 獲取活躍模型
  async getActiveModels(): Promise<ModelConfig[]> {
    return await this.db.collection('models').find({ isActive: true }).sort({ priority: 1 }).toArray();
  }

  // 獲取模型詳情
  async getModelById(id: string): Promise<ModelConfig | null> {
    return await this.db.collection('models').findOne({ _id: new ObjectId(id) });
  }

  // 創建新模型配置
  async createModel(model: Omit<ModelConfig, '_id' | 'createdAt' | 'updatedAt'>): Promise<ModelConfig> {
    const now = new Date();
    const newModel = {
      ...model,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.collection('models').insertOne(newModel);
    return { ...newModel, _id: result.insertedId };
  }

  // 更新模型配置
  async updateModel(id: string, model: Partial<ModelConfig>): Promise<boolean> {
    const result = await this.db.collection('models').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...model,
          updatedAt: new Date()
        }
      }
    );
    
    return result.modifiedCount > 0;
  }

  // 刪除模型配置
  async deleteModel(id: string): Promise<boolean> {
    const result = await this.db.collection('models').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // 切換模型活躍狀態
  async toggleModelActive(id: string, isActive: boolean): Promise<boolean> {
    return await this.updateModel(id, { isActive });
  }

  // 獲取所有路由規則
  async getAllRoutingRules(): Promise<ModelRoutingRule[]> {
    return await this.db.collection('routing_rules').find({}).sort({ priority: 1 }).toArray();
  }

  // 獲取活躍路由規則
  async getActiveRoutingRules(): Promise<ModelRoutingRule[]> {
    return await this.db.collection('routing_rules').find({ isActive: true }).sort({ priority: 1 }).toArray();
  }

  // 創建路由規則
  async createRoutingRule(rule: Omit<ModelRoutingRule, '_id' | 'createdAt' | 'updatedAt'>): Promise<ModelRoutingRule> {
    const now = new Date();
    const newRule = {
      ...rule,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.collection('routing_rules').insertOne(newRule);
    return { ...newRule, _id: result.insertedId };
  }

  // 更新路由規則
  async updateRoutingRule(id: string, rule: Partial<ModelRoutingRule>): Promise<boolean> {
    const result = await this.db.collection('routing_rules').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...rule,
          updatedAt: new Date()
        }
      }
    );
    
    return result.modifiedCount > 0;
  }

  // 刪除路由規則
  async deleteRoutingRule(id: string): Promise<boolean> {
    const result = await this.db.collection('routing_rules').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // 切換路由規則活躍狀態
  async toggleRoutingRuleActive(id: string, isActive: boolean): Promise<boolean> {
    return await this.updateRoutingRule(id, { isActive });
  }
}
