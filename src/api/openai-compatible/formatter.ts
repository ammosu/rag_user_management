import { LLMResponse } from '../../services/llm-clients/base-llm-client';
import { ModelConfig } from '../../models/model-types';

// Format response for chat completions API
export function formatChatCompletionsResponse(llmResponse: LLMResponse): any {
  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: llmResponse.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: llmResponse.text
        },
        finish_reason: llmResponse.finishReason || "stop"
      }
    ],
    usage: {
      prompt_tokens: llmResponse.promptTokens || 0,
      completion_tokens: llmResponse.completionTokens || 0,
      total_tokens: llmResponse.totalTokens || 0
    }
  };
}

// Format response for completions API
export function formatCompletionsResponse(llmResponse: LLMResponse): any {
  return {
    id: `cmpl-${Date.now()}`,
    object: "text_completion",
    created: Math.floor(Date.now() / 1000),
    model: llmResponse.model,
    choices: [
      {
        text: llmResponse.text,
        index: 0,
        logprobs: null,
        finish_reason: llmResponse.finishReason || "stop"
      }
    ],
    usage: {
      prompt_tokens: llmResponse.promptTokens || 0,
      completion_tokens: llmResponse.completionTokens || 0,
      total_tokens: llmResponse.totalTokens || 0
    }
  };
}

// Format response for models API
export function formatModelsResponse(models: ModelConfig[]): any {
  return {
    object: "list",
    data: models.map(model => ({
      id: model._id?.toString() || model.id || model.modelName,
      object: "model",
      created: Math.floor((model.createdAt?.getTime() || Date.now()) / 1000),
      owned_by: model.provider,
      permission: [],
      root: model.modelName,
      parent: null
    }))
  };
}
