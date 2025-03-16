import { ModelConfig, ModelRoutingRule, QueryClassification, RoutingStrategy, RouteCondition } from '../models/model-types';
import { User } from '../auth/models/user';
import { ModelService } from './model-service';
import { QueryClassifier } from './query-classifier';

export class ModelRouter {
  private modelService: ModelService;
  private queryClassifier: QueryClassifier;
  
  constructor(modelService: ModelService, queryClassifier: QueryClassifier) {
    this.modelService = modelService;
    this.queryClassifier = queryClassifier;
  }
  
  // Expose method to get model by ID
  async getModelById(id: string): Promise<ModelConfig | null> {
    return this.modelService.getModelById(id);
  }
  
  // 根據查詢內容、用戶信息和上下文選擇合適的模型
  async selectModel(query: string, user: User, additionalContext: Record<string, any> = {}): Promise<ModelConfig> {
    // 1. 分類查詢
    const queryClassification = this.queryClassifier.classifyQuery(query);
    
    // 2. 獲取所有活躍路由規則
    const routingRules = await this.modelService.getActiveRoutingRules();
    
    // 3. 獲取所有活躍模型
    const activeModels = await this.modelService.getActiveModels();
    
    if (activeModels.length === 0) {
      throw new Error('No active models available');
    }
    
    // 4. 遍歷規則，查找匹配的規則
    for (const rule of routingRules) {
      if (this.matchesRule(rule, query, queryClassification, user, additionalContext)) {
        // 找到匹配的規則，選擇目標模型
        const targetModels = activeModels.filter(model => 
          rule.targetModelIds.includes(model._id?.toString() || '')
        );
        
        if (targetModels.length > 0) {
          // 返回優先級最高的模型
          return targetModels.sort((a, b) => a.priority - b.priority)[0];
        }
      }
    }
    
    // 5. 如果沒有匹配的規則，返回默認模型（最高優先級的活躍模型）
    return activeModels[0];
  }
  
  // 檢查查詢是否匹配規則
  private matchesRule(
    rule: ModelRoutingRule, 
    query: string, 
    classification: QueryClassification, 
    user: User, 
    context: Record<string, any>
  ): boolean {
    // 檢查規則條件
    return rule.conditions.every(condition => this.matchesCondition(
      condition, 
      query, 
      classification, 
      user, 
      context
    ));
  }
  
  // 檢查單個條件是否匹配
  private matchesCondition(
    condition: RouteCondition, 
    query: string, 
    classification: QueryClassification, 
    user: User, 
    context: Record<string, any>
  ): boolean {
    const { field, operator, value } = condition;
    
    // 獲取條件字段的實際值
    let actualValue: any;
    
    switch (field) {
      case 'query_length':
        actualValue = query.length;
        break;
      case 'query_type':
      case 'category':
        actualValue = classification.category;
        break;
      case 'complexity':
        actualValue = classification.complexity;
        break;
      case 'sensitivity':
        actualValue = classification.sensitivity;
        break;
      case 'estimated_tokens':
        actualValue = classification.estimatedTokens;
        break;
      case 'requires_code':
        actualValue = classification.requiresCode;
        break;
      case 'requires_creativity':
        actualValue = classification.requiresCreativity;
        break;
      case 'requires_factuality':
        actualValue = classification.requiresFactuality;
        break;
      case 'user_role':
        actualValue = user.role;
        break;
      case 'department_id':
        actualValue = user.departmentId?.toString();
        break;
      case 'current_load':
        actualValue = context.currentLoad || 0;
        break;
      default:
        // 嘗試從上下文中獲取值
        actualValue = context[field];
    }
    
    // 如果無法獲取字段值，條件不匹配
    if (actualValue === undefined) {
      return false;
    }
    
    // 比較操作符
    switch (operator) {
      case '=':
      case 'eq':
        return actualValue === value;
      case '!=':
      case 'ne':
        return actualValue !== value;
      case '>':
      case 'gt':
        return actualValue > value;
      case '>=':
      case 'gte':
        return actualValue >= value;
      case '<':
      case 'lt':
        return actualValue < value;
      case '<=':
      case 'lte':
        return actualValue <= value;
      case 'contains':
        return String(actualValue).includes(String(value));
      case 'not_contains':
        return !String(actualValue).includes(String(value));
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(actualValue);
      default:
        return false;
    }
  }
}
