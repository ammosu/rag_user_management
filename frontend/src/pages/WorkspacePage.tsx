import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './WorkspacePage.css';

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!workspaceId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await api.getDocuments(workspaceId);
        setDocuments(response.data);
      } catch (error: any) {
        console.error('Error fetching documents:', error);
        setError(error.response?.data?.message || '無法載入文件。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, [workspaceId]);
  
  if (isLoading) {
    return <div className="loading">載入中...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="workspace-page">
      <h2>工作區文件</h2>
      
      {documents.length === 0 ? (
        <p>此工作區中沒有文件。</p>
      ) : (
        <div className="documents-list">
          <table>
            <thead>
              <tr>
                <th>標題</th>
                <th>類型</th>
                <th>建立日期</th>
                <th>最後更新</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.title}</td>
                  <td>{doc.type}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
