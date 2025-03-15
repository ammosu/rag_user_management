import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  departmentId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  handleAuthCallback: (params: URLSearchParams) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化時從本地存儲加載用戶和令牌
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          api.setAuthToken(storedToken);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // 登入函數
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      api.setAuthToken(token);
      
      // 保存到本地存儲
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出函數
  const logout = () => {
    setUser(null);
    setToken(null);
    api.setAuthToken(null);
    
    // 清除本地存儲
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // 處理 OAuth 或 SAML 回調
  const handleAuthCallback = (params: URLSearchParams) => {
    const token = params.get('token');
    const userStr = params.get('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setUser(user);
        setToken(token);
        api.setAuthToken(token);
        
        // 保存到本地存儲
        localStorage.setItem('user', userStr);
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    handleAuthCallback
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
