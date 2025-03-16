import React, { useState, useEffect } from 'react';
import './ModelSelector.css';

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

interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  apiKeys: Record<string, string>;
  onApiKeyChange: (provider: string, key: string) => void;
  customBaseUrls: Record<string, string>;
  onCustomBaseUrlChange: (provider: string, url: string) => void;
  useCustomBaseUrl: Record<string, boolean>;
  onUseCustomBaseUrlChange: (provider: string, use: boolean) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onModelSelect,
  apiKeys,
  onApiKeyChange,
  customBaseUrls,
  onCustomBaseUrlChange,
  useCustomBaseUrl,
  onUseCustomBaseUrlChange
}) => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providerModels, setProviderModels] = useState<Model[]>([]);

  // 初始化和更新選中的模型
  useEffect(() => {
    if (models.length > 0) {
      const model = models.find(m => m.id === selectedModelId) || models[0];
      setSelectedModel(model);
      
      // 獲取所有唯一的提供商，過濾掉undefined
      const uniqueProviders = Array.from(new Set(models.map(m => m.provider).filter((p): p is string => p !== undefined)));
      setProviders(uniqueProviders);
      
      // 設置當前選中的提供商
      if (model && model.provider) {
        setSelectedProvider(model.provider);
      } else if (uniqueProviders.length > 0) {
        setSelectedProvider(uniqueProviders[0]);
      }
    }
  }, [models, selectedModelId]);

  // 當提供商變更時，更新該提供商的模型列表
  useEffect(() => {
    if (selectedProvider) {
      const filteredModels = models.filter(m => m.provider === selectedProvider);
      setProviderModels(filteredModels);
      
      // 如果當前選中的模型不屬於選中的提供商，則選擇該提供商的第一個模型
      if (selectedModel && selectedModel.provider !== selectedProvider && filteredModels.length > 0) {
        onModelSelect(filteredModels[0].id);
      }
    }
  }, [selectedProvider, models, selectedModel, onModelSelect]);

  // 處理提供商變更
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
  };

  // 處理模型變更
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelSelect(e.target.value);
  };

  // 處理API密鑰變更
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(selectedProvider, e.target.value);
  };

  // 處理自定義基礎URL開關
  const handleUseCustomBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUseCustomBaseUrlChange(selectedProvider, e.target.checked);
  };

  // 處理自定義基礎URL變更
  const handleCustomBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomBaseUrlChange(selectedProvider, e.target.value);
  };

  // 格式化價格顯示
  const formatPrice = (price?: number) => {
    if (price === undefined) return 'N/A';
    if (price === 0) return '免費';
    return `$${price.toFixed(2)}/百萬tokens`;
  };

  return (
    <div className="model-selector">
      <div className="selector-section">
        <label htmlFor="provider-select">API Provider</label>
        <select 
          id="provider-select"
          value={selectedProvider}
          onChange={handleProviderChange}
        >
          {providers.map(provider => (
            <option key={provider} value={provider}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {selectedProvider && selectedProvider !== 'system' && (
        <div className="selector-section">
          <label htmlFor="api-key-input">{selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key</label>
          <input
            id="api-key-input"
            type="password"
            value={apiKeys[selectedProvider] || ''}
            onChange={handleApiKeyChange}
            placeholder="輸入API密鑰"
          />
          <p className="info-text">此密鑰僅存儲在本地，僅用於從此系統發出API請求。</p>
        </div>
      )}

      {selectedProvider && selectedProvider !== 'system' && selectedModel?.customizableBaseUrl && (
        <div className="selector-section custom-url-section">
          <div className="checkbox-container">
            <input
              id="use-custom-url"
              type="checkbox"
              checked={useCustomBaseUrl[selectedProvider] || false}
              onChange={handleUseCustomBaseUrlChange}
            />
            <label htmlFor="use-custom-url">使用自定義基礎URL</label>
          </div>
          
          {useCustomBaseUrl[selectedProvider] && (
            <input
              type="text"
              value={customBaseUrls[selectedProvider] || ''}
              onChange={handleCustomBaseUrlChange}
              placeholder="輸入自定義基礎URL"
            />
          )}
        </div>
      )}

      <div className="selector-section">
        <label htmlFor="model-select">Model</label>
        <select 
          id="model-select"
          value={selectedModelId}
          onChange={handleModelChange}
        >
          {providerModels.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {selectedModel && selectedModel.features && (
        <div className="model-features">
          <div className="feature-list">
            {selectedModel.features.supportsImages && (
              <div className="feature-item">✓ 支持圖像</div>
            )}
            {selectedModel.features.supportsComputerUse && (
              <div className="feature-item">✓ 支持電腦使用</div>
            )}
            {selectedModel.features.supportsPromptCaching && (
              <div className="feature-item">✓ 支持提示緩存</div>
            )}
          </div>
          
          <div className="model-specs">
            {selectedModel.features.maxOutput && (
              <div className="spec-item">最大輸出: {selectedModel.features.maxOutput.toLocaleString()} tokens</div>
            )}
            {selectedModel.contextWindow && (
              <div className="spec-item">上下文窗口: {selectedModel.contextWindow.toLocaleString()} tokens</div>
            )}
            {selectedModel.features.inputPrice !== undefined && (
              <div className="spec-item">輸入價格: {formatPrice(selectedModel.features.inputPrice)}</div>
            )}
            {selectedModel.features.outputPrice !== undefined && (
              <div className="spec-item">輸出價格: {formatPrice(selectedModel.features.outputPrice)}</div>
            )}
            {selectedModel.features.cacheWritePrice !== undefined && (
              <div className="spec-item">緩存寫入價格: {formatPrice(selectedModel.features.cacheWritePrice)}</div>
            )}
            {selectedModel.features.cacheReadPrice !== undefined && (
              <div className="spec-item">緩存讀取價格: {formatPrice(selectedModel.features.cacheReadPrice)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
