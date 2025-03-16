import { Request, Response } from 'express';
import { LLMService } from '../services/llm-service';
import { RetrievalService } from '../services/retrieval-service';
import { User } from '../auth/models/user';

export class RAGController {
  private llmService: LLMService;
  private retrievalService: RetrievalService;
  
  constructor(llmService: LLMService, retrievalService: RetrievalService) {
    this.llmService = llmService;
    this.retrievalService = retrievalService;
  }
  
  // 執行RAG查詢
  async executeQuery(req: Request, res: Response) {
    try {
      const { query, systemPrompt, modelId } = req.body;
      const user = req.user as User;
      
      if (!query) {
        return res.status(400).json({ message: '查詢內容不能為空' });
      }
      
      // 檢索相關文檔
      const retrievalResults = await this.retrievalService.retrieveDocuments(
        query, 
        user, 
        req.body.accessibleDocIds
      );
      
      // 獲取上下文信息
      const context = retrievalResults.map(doc => doc.content);
      
      // 執行LLM查詢
      let llmResponse;
      if (modelId) {
        // 使用指定模型
        llmResponse = await this.llmService.queryWithModel(
          modelId,
          query,
          context,
          systemPrompt,
          user._id?.toString()
        );
      } else {
        // 使用模型路由自動選擇模型
        llmResponse = await this.llmService.executeQuery(
          query, 
          context, 
          user, 
          systemPrompt
        );
      }
      
      // 返回結果
      res.json({
        response: llmResponse.text,
        model: llmResponse.model,
        sourceDocs: retrievalResults.map(doc => ({
          id: doc.id,
          title: doc.title,
          snippet: doc.snippet,
          source: doc.source
        })),
        tokens: {
          total: llmResponse.totalTokens,
          prompt: llmResponse.promptTokens,
          completion: llmResponse.completionTokens
        },
        timeTaken: llmResponse.timeTaken
      });
    } catch (error) {
      console.error('RAG query error:', error);
      res.status(500).json({ message: '處理查詢時發生錯誤' });
    }
  }
  
  // 獲取可用模型列表
  async getAvailableModels(req: Request, res: Response) {
    try {
      // 這裡應該從 ModelService 獲取模型列表
      // 但為了簡化，我們直接從 ModelRouter 獲取
      // 在實際應用中，應該注入 ModelService 並使用它
      
      // 返回簡化的模型信息
      const models = [
        { id: 'default', name: '自動選擇', description: '根據查詢內容自動選擇最合適的模型' }
        // 實際應用中，這裡應該返回從數據庫獲取的模型列表
      ];
      
      res.json(models);
    } catch (error) {
      console.error('Error getting available models:', error);
      res.status(500).json({ message: '獲取可用模型時發生錯誤' });
    }
  }
}
