import { BaseLLMClient, LLMRequest, LLMResponse } from './base-llm-client';
import { ModelConfig } from '../../models/model-types';

// Note: We're not actually importing node-fetch here since we don't have it installed yet
// In a real implementation, you would import it like this:
// import fetch from 'node-fetch';

export class LocalLLMClient extends BaseLLMClient {
  constructor(model: ModelConfig) {
    super(model);
    
    if (!model.endpoint) {
      throw new Error('Local LLM endpoint is required');
    }
  }
  
  async query(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // 構建請求的一致格式，無論後端是哪種LLM
    const requestBody: any = {
      prompt: request.query,
      temperature: request.temperature ?? this.model.temperature,
      max_tokens: request.maxTokens ?? this.model.maxTokens
    };
    
    // 添加系統提示詞
    if (request.systemPrompt || this.model.defaultSystemPrompt) {
      requestBody.system_prompt = request.systemPrompt || this.model.defaultSystemPrompt;
    }
    
    // 添加上下文
    if (request.context && request.context.length > 0) {
      requestBody.context = request.context;
    }
    
    try {
      // In a real implementation, you would use fetch like this:
      // const response = await fetch(this.model.endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': this.model.apiKey ? `Bearer ${this.model.apiKey}` : ''
      //   },
      //   body: JSON.stringify(requestBody)
      // });
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      // }
      
      // const result = await response.json();
      
      // For now, we'll just create a mock response
      const result = await this.mockLocalLLMResponse(requestBody);
      
      return {
        text: result.response || result.text || result.output || '',
        model: this.model.modelName,
        totalTokens: result.usage?.total_tokens,
        promptTokens: result.usage?.prompt_tokens,
        completionTokens: result.usage?.completion_tokens,
        timeTaken: Date.now() - startTime
      };
    } catch (error) {
      console.error(`Error calling Local LLM API: ${error}`);
      throw error;
    }
  }
  
  // Mock implementation for testing without actual HTTP requests
  private async mockLocalLLMResponse(requestBody: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create a mock response
    return {
      response: `This is a mock response from the Local LLM client using endpoint ${this.model.endpoint}. Your query was: "${requestBody.prompt}"`,
      usage: {
        prompt_tokens: 80,
        completion_tokens: 40,
        total_tokens: 120
      }
    };
  }
}
