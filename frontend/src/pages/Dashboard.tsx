import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import RAGQueryPage from './RAGQueryPage';
import WorkspacePage from './WorkspacePage';
import ApiKeysPage from './ApiKeysPage';
import api from '../services/api';
import './Dashboard.css';

interface Workspace {
  id: string;
  name: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await api.getWorkspaces();
        setWorkspaces(response.data);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkspaces();
  }, []);
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>企業級 RAG 系統</h1>
        <div className="user-info">
          {user && (
            <>
              <span>{user.displayName}</span>
              <span className="user-role">{user.role}</span>
              <button onClick={logout} className="logout-button">登出</button>
            </>
          )}
        </div>
      </header>
      
      <div className="dashboard-content">
        <Sidebar workspaces={workspaces} isLoading={isLoading} />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RAGQueryPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
