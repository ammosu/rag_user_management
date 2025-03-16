import { Request, Response } from 'express';
import { LLMService } from '../../services/llm-service';
import { ModelService } from '../../services/model-service';
import { validateChatCompletionsRequest, validateCompletionsRequest } from './validator';
import { formatChatCompletionsResponse, formatCompletionsResponse, formatModelsResponse } from './formatter';
import { User } from '../../auth/models/user';

export class OpenAICompatibleController {
  private llmService: LLMService;
  private modelService: ModelService;
  
  constructor(llmService: LLMService, modelService: ModelService) {
    this.llmService = llmService;
    this.modelService = modelService;
  }
  
  // 聊天補全 API
  async chatCompletions(req: Request, res: Response) {
    try {
      // 驗證請求
      const validationError = validateChatCompletionsRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          error: {
            message: validationError,
            type: "invalid_request_error",
            code: "invalid_request"
          }
        });
      }
      
      const user = req.user as User;
      const { messages, model, temperature, max_tokens, stream } = req.body;
      
      // 如果請求流式響應，目前不支持
      if (stream) {
        return res.status(400).json({
          error: {
            message: "Stream mode is not supported yet",
            type: "invalid_request_error",
            code: "unsupported_mode"
          }
        });
      }
      
      // 提取用戶查詢（最後一條用戶消息）
      const userMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
      
      // 提取系統提示詞
      const systemPrompt = messages.find((m: any) => m.role === 'system')?.content || '';
      
      // 提取上下文（之前的消息）
      const context = messages
        .filter((m: any) => m.role !== 'system' && !(m.role === 'user' && m.content === userMessage))
        .map((m: any) => `${m.role}: ${m.content}`);
      
      // 執行查詢
      let llmResponse;
      if (model && model !== 'auto') {
        // 使用指定模型
        llmResponse = await this.llmService.queryWithModel(
          model,
          userMessage,
          context,
          systemPrompt,
          user._id?.toString()
        );
      } else {
        // 使用模型路由自動選擇模型
        llmResponse = await this.llmService.executeQuery(
          userMessage,
          context,
          user,
          systemPrompt
        );
      }
      
      // 格式化響應
      const response = formatChatCompletionsResponse(llmResponse);
      res.json(response);
    } catch (error) {
      console.error('Chat completions error:', error);
      res.status(500).json({
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error"
        }
      });
    }
  }
  
  // 文本補全 API
  async completions(req: Request, res: Response) {
    try {
      // 驗證請求
      const validationError = validateCompletionsRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          error: {
            message: validationError,
            type: "invalid_request_error",
            code: "invalid_request"
          }
        });
      }
      
      const user = req.user as User;
      const { prompt, model, temperature, max_tokens, stream } = req.body;
      
      // 如果請求流式響應，目前不支持
      if (stream) {
        return res.status(400).json({
          error: {
            message: "Stream mode is not supported yet",
            type: "invalid_request_error",
            code: "unsupported_mode"
          }
        });
      }
      
      // 執行查詢
      let llmResponse;
      if (model && model !== 'auto') {
        // 使用指定模型
        llmResponse = await this.llmService.queryWithModel(
          model,
          prompt,
          [],
          "",
          user._id?.toString()
        );
      } else {
        // 使用模型路由自動選擇模型
        llmResponse = await this.llmService.executeQuery(
          prompt,
          [],
          user,
          ""
        );
      }
      
      // 格式化響應
      const response = formatCompletionsResponse(llmResponse);
      res.json(response);
    } catch (error) {
      console.error('Completions error:', error);
      res.status(500).json({
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error"
        }
      });
    }
  }
  
  // 列出模型 API
  async listModels(req: Request, res: Response) {
    try {
      const models = await this.modelService.getActiveModels();
      const response = formatModelsResponse(models);
      res.json(response);
    } catch (error) {
      console.error('List models error:', error);
      res.status(500).json({
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error"
        }
      });
    }
  }
  
  // 獲取模型信息 API
  async getModel(req: Request, res: Response) {
    try {
      const { model } = req.params;
      const modelInfo = await this.modelService.getModelById(model);
      
      if (!modelInfo) {
        return res.status(404).json({
          error: {
            message: `Model '${model}' not found`,
            type: "invalid_request_error",
            code: "model_not_found"
          }
        });
      }
      
      res.json({
        id: modelInfo._id?.toString() || modelInfo.id || modelInfo.modelName,
        object: "model",
        created: Math.floor((modelInfo.createdAt?.getTime() || Date.now()) / 1000),
        owned_by: modelInfo.provider,
        permission: [],
        root: modelInfo.modelName,
        parent: null
      });
    } catch (error) {
      console.error('Get model error:', error);
      res.status(500).json({
        error: {
          message: "Internal server error",
          type: "server_error",
          code: "internal_error"
        }
      });
    }
  }
}
