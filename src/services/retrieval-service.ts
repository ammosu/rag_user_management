import { MongoClient, ObjectId } from 'mongodb';
import { User } from '../auth/models/user';

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  source: string;
  score: number;
}

export class RetrievalService {
  private db: any;
  
  constructor(mongoClient: MongoClient) {
    this.db = mongoClient.db('rag_system');
  }
  
  /**
   * 檢索與查詢相關的文檔
   * @param query 用戶查詢
   * @param user 當前用戶
   * @param accessibleDocIds 可訪問的文檔ID列表（可選）
   * @param limit 返回結果數量限制
   * @returns 檢索結果
   */
  async retrieveDocuments(
    query: string,
    user: User,
    accessibleDocIds?: string[],
    limit: number = 5
  ): Promise<RetrievalResult[]> {
    try {
      // 構建查詢過濾條件
      const filter: any = {
        // 基本過濾：文檔必須是活躍的
        isActive: true
      };
      
      // 添加用戶權限過濾
      if (user.role !== 'admin') {
        // 非管理員用戶只能訪問公開文檔或分配給他們的文檔
        filter.$or = [
          { isPublic: true },
          { ownerId: user._id },
          { sharedWith: user._id }
        ];
        
        // 如果用戶有部門，也可以訪問部門文檔
        if (user.departmentId) {
          filter.$or.push({ departmentId: user.departmentId });
        }
      }
      
      // 如果提供了可訪問的文檔ID列表，進一步限制結果
      if (accessibleDocIds && accessibleDocIds.length > 0) {
        filter._id = { $in: accessibleDocIds.map(id => new ObjectId(id)) };
      }
      
      // 這裡應該使用向量搜索來查找相關文檔
      // 但為了簡化，我們使用基本的文本搜索
      
      // 創建文本搜索查詢
      const textSearchFilter = {
        ...filter,
        $text: { $search: query }
      };
      
      // 執行文本搜索
      const documents = await this.db.collection('documents')
        .find(textSearchFilter)
        .project({
          _id: 1,
          title: 1,
          content: 1,
          source: 1,
          score: { $meta: 'textScore' }
        })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .toArray();
      
      // 如果沒有找到結果，嘗試使用關鍵詞搜索
      if (documents.length === 0) {
        // 提取查詢中的關鍵詞
        const keywords = query.split(/\s+/)
          .filter(word => word.length > 3)
          .map(word => new RegExp(word, 'i'));
        
        if (keywords.length > 0) {
          const keywordFilter = {
            ...filter,
            $or: [
              { title: { $in: keywords } },
              { content: { $in: keywords } },
              { tags: { $in: keywords.map(k => k.toString().replace(/[\/^$*+?.()|[\]{}]/g, '')) } }
            ]
          };
          
          const keywordResults = await this.db.collection('documents')
            .find(keywordFilter)
            .limit(limit)
            .toArray();
          
          // 為關鍵詞結果添加一個基本分數
          keywordResults.forEach((doc: any) => {
            doc.score = 0.5; // 基本分數低於文本搜索
          });
          
          documents.push(...keywordResults);
        }
      }
      
      // 格式化結果
      return documents.map((doc: any) => {
        // 提取匹配查詢的片段
        const snippet = this.extractSnippet(doc.content, query);
        
        return {
          id: doc._id.toString(),
          title: doc.title,
          content: doc.content,
          snippet,
          source: doc.source || 'internal',
          score: doc.score || 0
        };
      });
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }
  
  /**
   * 從文檔內容中提取與查詢相關的片段
   * @param content 文檔內容
   * @param query 用戶查詢
   * @returns 相關片段
   */
  private extractSnippet(content: string, query: string): string {
    if (!content) return '';
    
    // 獲取查詢中的關鍵詞
    const keywords = query.split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase());
    
    // 如果沒有有效的關鍵詞，返回內容的前200個字符
    if (keywords.length === 0) {
      return content.substring(0, 200) + '...';
    }
    
    // 將內容分成句子
    const sentences = content.split(/[.!?]+/);
    
    // 為每個句子評分（基於包含的關鍵詞數量）
    const scoredSentences = sentences.map(sentence => {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        if (sentenceLower.includes(keyword)) {
          score += 1;
        }
      });
      
      return { sentence, score };
    });
    
    // 按分數排序句子
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // 選擇最相關的句子（最多3個）
    const topSentences = scoredSentences
      .filter(item => item.score > 0)
      .slice(0, 3)
      .map(item => item.sentence.trim())
      .join('. ');
    
    // 如果沒有找到相關句子，返回內容的前200個字符
    if (!topSentences) {
      return content.substring(0, 200) + '...';
    }
    
    return topSentences + '.';
  }
}
