import { QueryClassification } from '../models/model-types';
import { promises as fs } from 'fs';
import path from 'path';

export class QueryClassifier {
  private keywordSets: Record<string, string[]> = {};
  private sensitiveTerms: string[] = [];
  private tokenizer: any;
  
  constructor() {
    this.loadClassificationData();
    // Simple tokenizer implementation since we don't have natural library yet
    this.tokenizer = {
      tokenize: (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean)
    };
  }
  
  private async loadClassificationData() {
    try {
      // 載入分類關鍵詞
      const keywordsPath = path.join(__dirname, '../data/classification_keywords.json');
      const keywordsData = await fs.readFile(keywordsPath, 'utf8');
      this.keywordSets = JSON.parse(keywordsData);
      
      // 載入敏感詞
      const sensitivePath = path.join(__dirname, '../data/sensitive_terms.json');
      const sensitiveData = await fs.readFile(sensitivePath, 'utf8');
      this.sensitiveTerms = JSON.parse(sensitiveData);
    } catch (error) {
      console.error('Failed to load classification data:', error);
      // 備用分類關鍵詞
      this.keywordSets = {
        technical: ['code', 'algorithm', 'api', 'database', 'programming', 'development', 'bug', 'server'],
        business: ['strategy', 'market', 'sales', 'customer', 'revenue', 'profit', 'competitor', 'partnership'],
        general: ['information', 'summary', 'overview', 'explain', 'describe', 'what', 'how', 'when', 'who']
      };
      
      // 備用敏感詞
      this.sensitiveTerms = ['confidential', 'secret', 'private', 'sensitive', 'internal', 'restricted'];
    }
  }
  
  // 分類查詢
  public classifyQuery(query: string): QueryClassification {
    const tokens = this.tokenizer.tokenize(query);
    
    // 計算複雜度（基於句子長度、問題深度等）
    const complexity = this.calculateComplexity(query, tokens);
    
    // 判斷敏感度
    const sensitivity = this.calculateSensitivity(query, tokens);
    
    // 確定類別
    const category = this.determineCategory(tokens);
    
    // 估計token數量
    const estimatedTokens = Math.ceil(query.length / 4);
    
    // 檢測是否需要代碼生成
    const requiresCode = this.detectCodeRequirement(query, tokens);
    
    // 檢測是否需要創意生成
    const requiresCreativity = this.detectCreativityRequirement(query, tokens);
    
    // 檢測是否需要事實準確性
    const requiresFactuality = this.detectFactualityRequirement(query, tokens);
    
    return {
      complexity,
      sensitivity,
      category,
      estimatedTokens,
      requiresCode,
      requiresCreativity,
      requiresFactuality
    };
  }
  
  private calculateComplexity(query: string, tokens: string[]): number {
    // 複雜度因素：句子長度、特殊字符出現率、專業術語數量等
    const sentenceCount = query.split(/[.!?]+/).length;
    const avgSentenceLength = tokens.length / Math.max(1, sentenceCount);
    
    const complexityScore = Math.min(10, Math.max(1, (
      (tokens.length * 0.05) +              // 較長查詢更複雜
      (avgSentenceLength * 0.2) +           // 較長的句子更複雜
      (query.includes('how') ? 1 : 0) +     // "how"通常表示更複雜的問題
      (query.includes('why') ? 2 : 0) +     // "why"通常表示更複雜的問題
      (query.match(/(?:compare|difference|versus|vs)/gi) ? 2 : 0) // 比較類問題更複雜
    )));
    
    return Math.round(complexityScore * 10) / 10; // 四捨五入到一位小數
  }
  
  private calculateSensitivity(query: string, tokens: string[]): number {
    // 檢查敏感詞出現次數
    let sensitivityScore = 0;
    
    for (const term of this.sensitiveTerms) {
      if (query.toLowerCase().includes(term)) {
        sensitivityScore += 2;
      }
    }
    
    // 檢查是否包含組織或個人敏感信息
    if (query.match(/(?:password|account|confidential|secret|private|internal)/gi)) {
      sensitivityScore += 3;
    }
    
    // 檢查是否提到財務或戰略資訊
    if (query.match(/(?:revenue|profit|strategy|acquisition|layoff|restructuring)/gi)) {
      sensitivityScore += 2;
    }
    
    return Math.min(10, Math.max(0, sensitivityScore));
  }
  
  private determineCategory(tokens: string[]): string {
    const categoryScores: Record<string, number> = {};
    
    // 計算每個類別的匹配得分
    for (const [category, keywords] of Object.entries(this.keywordSets)) {
      categoryScores[category] = keywords.filter(keyword => 
        tokens.includes(keyword) || 
        tokens.some(token => token.includes(keyword))
      ).length;
    }
    
    // 選擇得分最高的類別
    let maxScore = 0;
    let maxCategory = 'general';
    
    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
    }
    
    return maxCategory;
  }
  
  private detectCodeRequirement(query: string, tokens: string[]): boolean {
    const codeKeywords = ['code', 'function', 'program', 'script', 'algorithm', 'implement', 'debug', 'syntax'];
    const codePatterns = [
      /how to (?:code|program|implement)/i,
      /(?:write|create) (?:a|an) (?:function|program|script|code)/i,
      /example (?:code|function)/i
    ];
    
    // 檢查關鍵詞
    const hasCodeKeyword = codeKeywords.some(keyword => tokens.includes(keyword));
    
    // 檢查模式
    const matchesCodePattern = codePatterns.some(pattern => query.match(pattern));
    
    // 檢查程式語言名稱
    const mentionsLanguage = /(?:python|javascript|java|c\+\+|typescript|php|ruby|go|rust|sql)/i.test(query);
    
    return hasCodeKeyword || matchesCodePattern || mentionsLanguage;
  }
  
  private detectCreativityRequirement(query: string, tokens: string[]): boolean {
    const creativityKeywords = ['creative', 'generate', 'story', 'design', 'imagine', 'innovative', 'unique'];
    const creativityPatterns = [
      /(?:write|create|generate) (?:a|an) (?:story|poem|article|essay)/i,
      /(?:come up with|think of|suggest) (?:ideas|alternatives|solutions)/i,
      /how (?:would|could|might)/i,
      /what if/i
    ];
    
    // 檢查關鍵詞
    const hasCreativityKeyword = creativityKeywords.some(keyword => tokens.includes(keyword));
    
    // 檢查模式
    const matchesCreativityPattern = creativityPatterns.some(pattern => query.match(pattern));
    
    return hasCreativityKeyword || matchesCreativityPattern;
  }
  
  private detectFactualityRequirement(query: string, tokens: string[]): boolean {
    const factualKeywords = ['facts', 'information', 'data', 'statistics', 'history', 'report', 'accurate'];
    const factualPatterns = [
      /(?:what|when|where|who|why) (?:is|are|was|were)/i,
      /tell me about/i,
      /how (?:does|do|did)/i,
      /explain/i
    ];
    
    // 檢查關鍵詞
    const hasFactualKeyword = factualKeywords.some(keyword => tokens.includes(keyword));
    
    // 檢查模式
    const matchesFactualPattern = factualPatterns.some(pattern => query.match(pattern));
    
    return hasFactualKeyword || matchesFactualPattern;
  }
}
