import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSSOLogin = (provider: string) => {
    const redirectUri = `${window.location.origin}/oauth2/callback`;
    window.location.href = `/api/auth/oauth2/${provider}?redirectUri=${encodeURIComponent(redirectUri)}`;
  };
  
  const handleSAMLLogin = () => {
    const redirectUri = `${window.location.origin}/saml/callback`;
    window.location.href = `/api/auth/saml?redirectUri=${encodeURIComponent(redirectUri)}`;
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>企業級 RAG 系統</h1>
        <h2>登入</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用戶名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
        
        <div className="sso-section">
          <h3>或使用單一登入 (SSO)</h3>
          
          <div className="sso-buttons">
            <button 
              className="sso-button google" 
              onClick={() => handleSSOLogin('google')}
            >
              使用 Google 登入
            </button>
            
            <button 
              className="sso-button microsoft" 
              onClick={() => handleSSOLogin('azure')}
            >
              使用 Microsoft 登入
            </button>
            
            <button 
              className="sso-button saml" 
              onClick={handleSAMLLogin}
            >
              使用企業帳號登入 (SAML)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
