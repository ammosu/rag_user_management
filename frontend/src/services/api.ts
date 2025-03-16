import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API 服務
const apiService = {
  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  },
  
  // 認證相關 API
  post: (url: string, data: any) => api.post(url, data),
  get: (url: string) => api.get(url),
  
  // RAG 查詢 API
  queryRAG: (query: string) => api.post('/rag/query', { query }),
  
  // 獲取用戶可訪問的 workspaces
  getWorkspaces: () => api.get('/workspaces'),
  
  // 獲取文檔
  getDocuments: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/documents`),
};

export default apiService;
