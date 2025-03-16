import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ModelSelector from '../components/ModelSelector';
import './RAGQueryPage.css';

interface ModelFeatures {
  supportsImages?: boolean;
  supportsComputerUse?: boolean;
  supportsPromptCaching?: boolean;
  maxOutput?: number;
  inputPrice?: number;
  outputPrice?: number;
  cacheWritePrice?: number;
  cacheReadPrice?: number;
}

interface Model {
  id: string;
  name: string;
  description: string;
  type?: string;
  provider?: string;
  modelName?: string;
  contextWindow?: number;
  maxTokens?: number;
  features?: ModelFeatures;
  customizableBaseUrl?: boolean;
}

const RAGQueryPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceDocs, setSourceDocs] = useState<any[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelInfo, setModelInfo] = useState('');
  
  // 新增狀態
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [customBaseUrls, setCustomBaseUrls] = useState<Record<string, string>>({});
  const [useCustomBaseUrl, setUseCustomBaseUrl] = useState<Record<string, boolean>>({});
  
  // 從本地存儲加載API密鑰和URL設置
  useEffect(() => {
    const savedApiKeys = localStorage.getItem('model_api_keys');
    if (savedApiKeys) {
      try {
        setApiKeys(JSON.parse(savedApiKeys));
      } catch (e) {
        console.error('Failed to parse saved API keys:', e);
      }
    }
    
    const savedBaseUrls = localStorage.getItem('model_base_urls');
    if (savedBaseUrls) {
      try {
        setCustomBaseUrls(JSON.parse(savedBaseUrls));
      } catch (e) {
        console.error('Failed to parse saved base URLs:', e);
      }
    }
    
    const savedUseCustomUrl = localStorage.getItem('use_custom_base_urls');
    if (savedUseCustomUrl) {
      try {
        setUseCustomBaseUrl(JSON.parse(savedUseCustomUrl));
      } catch (e) {
        console.error('Failed to parse saved custom URL settings:', e);
      }
    }
  }, []);
  
  // 獲取可用模型
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const result = await api.getAvailableModels();
        setModels(result.data);
        
        // 如果沒有選擇模型，默認選擇第一個
        if (!selectedModelId && result.data.length > 0) {
          setSelectedModelId(result.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // 如果API調用失敗，使用默認模型列表
        const defaultModels = [
          { 
            id: 'default', 
            name: '自動選擇', 
            description: '根據查詢內容自動選擇最合適的模型',
            type: 'auto',
            provider: 'system'
          }
        ];
        setModels(defaultModels);
        if (!selectedModelId) {
          setSelectedModelId(defaultModels[0].id);
        }
      }
    };
    
    fetchModels();
  }, [selectedModelId]);
  
  // 處理API密鑰變更
  const handleApiKeyChange = (provider: string, key: string) => {
    const newApiKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newApiKeys);
    localStorage.setItem('model_api_keys', JSON.stringify(newApiKeys));
  };
  
  // 處理自定義基礎URL變更
  const handleCustomBaseUrlChange = (provider: string, url: string) => {
    const newUrls = { ...customBaseUrls, [provider]: url };
    setCustomBaseUrls(newUrls);
    localStorage.setItem('model_base_urls', JSON.stringify(newUrls));
  };
  
  // 處理使用自定義基礎URL開關
  const handleUseCustomBaseUrlChange = (provider: string, use: boolean) => {
    const newSettings = { ...useCustomBaseUrl, [provider]: use };
    setUseCustomBaseUrl(newSettings);
    localStorage.setItem('use_custom_base_urls', JSON.stringify(newSettings));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 添加API密鑰和基礎URL到請求
      const selectedModel = models.find(m => m.id === selectedModelId);
      const provider = selectedModel?.provider;
      
      const requestData: any = {
        query,
        modelId: selectedModelId || undefined,
        systemPrompt: systemPrompt || undefined
      };
      
      // 如果有API密鑰，添加到請求
      if (provider && apiKeys[provider]) {
        requestData.apiKey = apiKeys[provider];
      }
      
      // 如果使用自定義基礎URL，添加到請求
      if (provider && useCustomBaseUrl[provider] && customBaseUrls[provider]) {
        requestData.baseUrl = customBaseUrls[provider];
      }
      
      const result = await api.queryRAG(requestData);
      setResponse(result.data.response);
      setSourceDocs(result.data.sourceDocs || []);
      setModelInfo(`使用模型: ${result.data.model || '未知'} | 處理時間: ${result.data.timeTaken ? (result.data.timeTaken / 1000).toFixed(2) + 's' : '未知'}`);
    } catch (error: any) {
      console.error('Query error:', error);
      setError(error.response?.data?.message || '查詢發生錯誤。請再試一次。');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="rag-query-page">
      <h2>RAG 知識庫查詢</h2>
      
      <form onSubmit={handleSubmit} className="query-form">
        <div className="input-group">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="輸入您的問題..."
            rows={3}
          />
        </div>
        
        <div className="advanced-options">
          <button 
            type="button" 
            className="toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '隱藏進階選項' : '顯示進階選項'}
          </button>
          
          {showAdvanced && (
            <div className="advanced-controls">
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId}
                onModelSelect={setSelectedModelId}
                apiKeys={apiKeys}
                onApiKeyChange={handleApiKeyChange}
                customBaseUrls={customBaseUrls}
                onCustomBaseUrlChange={handleCustomBaseUrlChange}
                useCustomBaseUrl={useCustomBaseUrl}
                onUseCustomBaseUrlChange={handleUseCustomBaseUrlChange}
              />
              
              <div className="input-group">
                <label htmlFor="system-prompt">系統提示詞:</label>
                <textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="可選的系統提示詞，用於指導模型回應..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
        
        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? '處理中...' : '送出查詢'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {response && (
        <div className="response-container">
          <h3>回應</h3>
          {modelInfo && <div className="model-info">{modelInfo}</div>}
          <div className="response-content">
            {response.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          
          {sourceDocs.length > 0 && (
            <div className="source-documents">
              <h4>來源文件</h4>
              <ul>
                {sourceDocs.map((doc, index) => (
                  <li key={index}>
                    <h5>{doc.title || `文件 ${index + 1}`}</h5>
                    <p>{doc.snippet || doc.content?.substring(0, 200) + '...'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RAGQueryPage;
