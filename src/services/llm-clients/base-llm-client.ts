import { ModelConfig } from '../../models/model-types';

export interface LLMRequest {
  query: string;
  context?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  user?: string;
}

export interface LLMResponse {
  text: string;
  model: string;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  finishReason?: string;
  timeTaken?: number;
}

export abstract class BaseLLMClient {
  protected model: ModelConfig;
  
  constructor(model: ModelConfig) {
    this.model = model;
  }
  
  abstract query(request: LLMRequest): Promise<LLMResponse>;
}
