import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ApiKeysPage.css';

interface ApiKey {
  _id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 獲取API密鑰列表
  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await api.getApiKeys();
      setApiKeys(response.data);
      setError('');
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      setError(error.response?.data?.message || '獲取API密鑰失敗');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加載
  useEffect(() => {
    fetchApiKeys();
  }, []);
  
  // 生成新的API密鑰
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const response = await api.generateApiKey(newKeyName);
      setNewKey(response.data);
      setNewKeyName('');
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error generating API key:', error);
      setError(error.response?.data?.message || '生成API密鑰失敗');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 撤銷API密鑰
  const handleRevokeKey = async (id: string) => {
    if (!window.confirm('確定要撤銷此API密鑰嗎？此操作無法撤銷。')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await api.revokeApiKey(id);
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error revoking API key:', error);
      setError(error.response?.data?.message || '撤銷API密鑰失敗');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString();
  };
  
  // 複製API密鑰到剪貼板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已複製到剪貼板');
  };
  
  return (
    <div className="api-keys-page">
      <h2>API 密鑰管理</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="api-keys-container">
        <div className="api-keys-form">
          <h3>生成新的API密鑰</h3>
          <form onSubmit={handleGenerateKey}>
            <div className="input-group">
              <label htmlFor="key-name">密鑰名稱 (可選)</label>
              <input
                id="key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="例如：開發環境、測試環境"
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '處理中...' : '生成新密鑰'}
            </button>
          </form>
        </div>
        
        {newKey && (
          <div className="new-key-container">
            <h3>新生成的API密鑰</h3>
            <p className="warning">請立即複製此密鑰，它只會顯示一次！</p>
            <div className="key-display">
              <code>{newKey.apiKey}</code>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(newKey.apiKey)}
              >
                複製
              </button>
            </div>
          </div>
        )}
        
        <div className="api-keys-list">
          <h3>您的API密鑰</h3>
          {apiKeys.length === 0 ? (
            <p>您還沒有API密鑰。</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>密鑰</th>
                  <th>創建時間</th>
                  <th>最後使用</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(key => (
                  <tr key={key._id}>
                    <td>{key.name || '未命名'}</td>
                    <td className="key-preview">{key.apiKey}</td>
                    <td>{formatDate(key.createdAt)}</td>
                    <td>{key.lastUsed ? formatDate(key.lastUsed) : '從未使用'}</td>
                    <td>
                      <button 
                        className="revoke-button"
                        onClick={() => handleRevokeKey(key._id)}
                        disabled={isLoading}
                      >
                        撤銷
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <div className="api-usage-info">
        <h3>如何使用API</h3>
        <p>您可以使用API密鑰通過我們的OpenAI兼容API訪問語言模型。</p>
        
        <div className="code-example">
          <h4>示例請求 (使用curl)</h4>
          <pre>
            {`curl -X POST \\
  ${window.location.origin}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "auto",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'`}
          </pre>
        </div>
        
        <div className="code-example">
          <h4>示例請求 (使用JavaScript)</h4>
          <pre>
            {`const response = await fetch('${window.location.origin}/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'auto',
    messages: [
      {role: 'system', content: 'You are a helpful assistant.'},
      {role: 'user', content: 'Hello, how are you?'}
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysPage;
