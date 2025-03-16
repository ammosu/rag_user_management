import { BaseLLMClient, LLMRequest, LLMResponse } from './base-llm-client';
import { ModelConfig } from '../../models/model-types';

// Note: We're not actually importing the Anthropic SDK here since we don't have it installed yet
// In a real implementation, you would import it like this:
// import Anthropic from '@anthropic-ai/sdk';

export class AnthropicClient extends BaseLLMClient {
  private client: any;
  
  constructor(model: ModelConfig) {
    super(model);
    
    if (!model.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    // In a real implementation, you would initialize the Anthropic client like this:
    // this.client = new Anthropic({
    //   apiKey: model.apiKey
    // });
    
    // For now, we'll just create a placeholder
    this.client = {
      messages: {
        create: this.mockCreateMessage.bind(this)
      }
    };
  }
  
  async query(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    let systemPrompt = request.systemPrompt || this.model.defaultSystemPrompt || '';
    let userMessage = request.query;
    
    // 添加上下文
    if (request.context && request.context.length > 0) {
      userMessage = `Context information:\n${request.context.join('\n\n')}\n\nQuestion: ${request.query}`;
    }
    
    try {
      const message = await this.client.messages.create({
        model: this.model.modelName,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage }
        ],
        temperature: request.temperature ?? this.model.temperature,
        max_tokens: request.maxTokens ?? this.model.maxTokens
      });
      
      const response = message.content[0].text || '';
      
      return {
        text: response,
        model: this.model.modelName,
        totalTokens: message.usage?.input_tokens + (message.usage?.output_tokens || 0),
        promptTokens: message.usage?.input_tokens,
        completionTokens: message.usage?.output_tokens,
        finishReason: message.stop_reason,
        timeTaken: Date.now() - startTime
      };
    } catch (error) {
      console.error(`Error calling Anthropic API: ${error}`);
      throw error;
    }
  }
  
  // Mock implementation for testing without the actual Anthropic SDK
  private async mockCreateMessage(params: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a mock response
    return {
      content: [
        {
          text: `This is a mock response from the Anthropic client using model ${params.model}. Your query was: "${params.messages[0].content}"`
        }
      ],
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 120,
        output_tokens: 60
      }
    };
  }
}
