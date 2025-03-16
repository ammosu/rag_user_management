import { ObjectId } from 'mongodb';

export enum ModelType {
  OPEN_SOURCE = 'open_source',
  COMMERCIAL_API = 'commercial_api'
}

export enum ModelProvider {
  LLAMA = 'llama',
  MISTRAL = 'mistral',
  QWEN = 'qwen',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  BAIDU = 'baidu',
  CUSTOM = 'custom'
}

export enum RoutingStrategy {
  CONTENT_BASED = 'content_based',  // 基於內容複雜度和敏感度
  COST_BASED = 'cost_based',        // 基於成本效益
  LOAD_BASED = 'load_based',        // 基於系統負載
  USER_BASED = 'user_based',        // 基於用戶角色或部門
  FAILOVER = 'failover'             // 故障轉移策略
}

export interface ModelConfig {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  type: ModelType;
  provider: ModelProvider;
  endpoint?: string;           // API端點或本地服務地址
  apiKey?: string;            // API金鑰（加密存儲）
  apiVersion?: string;        // API版本
  modelName: string;          // 具體模型名稱，如 'gpt-4-turbo'
  contextWindow: number;      // 上下文窗口大小
  costPerToken: number;       // 每千tokens的成本（美元）
  maxTokens: number;          // 最大生成tokens數
  temperature: number;        // 溫度參數
  isActive: boolean;          // 是否啟用
  priority: number;           // 優先級（值越小優先級越高）
  supportedFeatures: string[]; // 支持的功能，如 'rag', 'code', 'chat'
  rateLimit: number;          // 每分鐘請求限制
  defaultSystemPrompt?: string; // 默認系統提示詞
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelRoutingRule {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  strategy: RoutingStrategy;
  isActive: boolean;
  priority: number;           // 規則優先級
  conditions: RouteCondition[]; // 觸發條件
  targetModelIds: string[];   // 目標模型ID列表
  fallbackModelId?: string;   // 備用模型ID
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteCondition {
  field: string;              // 條件字段，如 'query_length', 'user_role', 'department_id', 'query_type'
  operator: string;           // 操作符，如 '>', '<', '=', 'contains', 'in'
  value: any;                 // 條件值
}

export interface QueryClassification {
  complexity: number;         // 複雜度评分 (0-10)
  sensitivity: number;        // 敏感度评分 (0-10)
  category: string;           // 查詢類別，如 'technical', 'business', 'general'
  estimatedTokens: number;    // 預估所需tokens
  requiresCode: boolean;      // 是否需要代碼生成能力
  requiresCreativity: boolean; // 是否需要創意內容生成
  requiresFactuality: boolean; // 是否需要高事實準確性
}

// API Key interface
export interface ApiKey {
  _id?: string;
  userId: string;
  apiKey: string;
  name?: string;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
}
