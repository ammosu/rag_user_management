import { BaseLLMClient, LLMRequest, LLMResponse } from './llm-clients/base-llm-client';
import { OpenAIClient } from './llm-clients/openai-client';
import { AnthropicClient } from './llm-clients/anthropic-client';
import { LocalLLMClient } from './llm-clients/local-llm-client';
import { ModelConfig, ModelProvider, ModelType } from '../models/model-types';
import { ModelRouter } from './model-router';
import { User } from '../auth/models/user';

export class LLMService {
  private modelRouter: ModelRouter;
  private clientCache: Map<string, BaseLLMClient> = new Map();
  
  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }
  
  // 執行RAG查詢
  async executeQuery(
    query: string, 
    context: string[], 
    user: User, 
    systemPrompt?: string,
    additionalContext: Record<string, any> = {}
  ): Promise<LLMResponse> {
    // 1. 根據查詢內容、用戶信息和上下文選擇合適的模型
    const model = await this.modelRouter.selectModel(query, user, additionalContext);
    
    // 2. 獲取或創建對應的LLM客戶端
    const client = this.getClientForModel(model);
    
    // 3. 構建請求
    const request: LLMRequest = {
      query,
      context,
      systemPrompt,
      user: user._id?.toString()
    };
    
    // 4. 發送請求並返回回應
    return await client.query(request);
  }
  
  // 獲取模型客戶端
  private getClientForModel(model: ModelConfig): BaseLLMClient {
    const modelId = model._id?.toString() || model.id || '';
    
    // 檢查緩存
    if (this.clientCache.has(modelId)) {
      return this.clientCache.get(modelId)!;
    }
    
    // 根據模型類型和提供商創建客戶端
    let client: BaseLLMClient;
    
    if (model.type === ModelType.COMMERCIAL_API) {
      // 商業API模型
      switch (model.provider) {
        case ModelProvider.OPENAI:
          client = new OpenAIClient(model);
          break;
        case ModelProvider.ANTHROPIC:
          client = new AnthropicClient(model);
          break;
        default:
          throw new Error(`Unsupported commercial API provider: ${model.provider}`);
      }
    } else {
      // 開源/自託管模型
      client = new LocalLLMClient(model);
    }
    
    // 添加到緩存
    this.clientCache.set(modelId, client);
    
    return client;
  }
  
  // 清除客戶端緩存
  clearClientCache(): void {
    this.clientCache.clear();
  }
  
  // 直接使用指定模型進行查詢
  async queryWithModel(
    modelId: string, 
    query: string, 
    context: string[] = [], 
    systemPrompt?: string,
    user?: string
  ): Promise<LLMResponse> {
    // 獲取模型配置
    const model = await this.modelRouter.getModelById(modelId);
    
    if (!model) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    
    // 獲取或創建客戶端
    const client = this.getClientForModel(model);
    
    // 構建請求
    const request: LLMRequest = {
      query,
      context,
      systemPrompt,
      user
    };
    
    // 發送請求並返回回應
    return await client.query(request);
  }
}
