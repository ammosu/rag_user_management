import React, { useState } from 'react';
import api from '../services/api';
import './RAGQueryPage.css';

const RAGQueryPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceDocs, setSourceDocs] = useState<any[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await api.queryRAG(query);
      setResponse(result.data.response);
      setSourceDocs(result.data.sourceDocs || []);
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
        
        <button type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? '處理中...' : '送出查詢'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {response && (
        <div className="response-container">
          <h3>回應</h3>
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
