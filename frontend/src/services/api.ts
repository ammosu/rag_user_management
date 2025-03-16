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
  
  // 通用 HTTP 方法
  post: (url: string, data: any) => api.post(url, data),
  get: (url: string) => api.get(url),
  put: (url: string, data: any) => api.put(url, data),
  delete: (url: string) => api.delete(url),
  
  // 認證相關 API
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  
  // API 密鑰管理
  getApiKeys: () => api.get('/auth/api-keys'),
  generateApiKey: (name?: string) => api.post('/auth/api-keys', { name }),
  revokeApiKey: (id: string) => api.delete(`/auth/api-keys/${id}`),
  
  // RAG 查詢 API
  queryRAG: (requestData: {
    query: string, 
    modelId?: string, 
    systemPrompt?: string,
    apiKey?: string,
    baseUrl?: string
  }) => api.post('/rag/query', requestData),
  getAvailableModels: () => api.get('/rag/models'),
  
  // 模型管理 API (僅限管理員)
  getAllModels: () => api.get('/model-manager/models'),
  getActiveModels: () => api.get('/model-manager/models/active'),
  getModelById: (id: string) => api.get(`/model-manager/models/${id}`),
  createModel: (modelData: any) => api.post('/model-manager/models', modelData),
  updateModel: (id: string, modelData: any) => api.put(`/model-manager/models/${id}`, modelData),
  deleteModel: (id: string) => api.delete(`/model-manager/models/${id}`),
  toggleModelActive: (id: string, isActive: boolean) => 
    api.patch(`/model-manager/models/${id}/active`, { isActive }),
  
  // 路由規則管理 API (僅限管理員)
  getAllRoutingRules: () => api.get('/model-manager/routing-rules'),
  getActiveRoutingRules: () => api.get('/model-manager/routing-rules/active'),
  createRoutingRule: (ruleData: any) => api.post('/model-manager/routing-rules', ruleData),
  updateRoutingRule: (id: string, ruleData: any) => 
    api.put(`/model-manager/routing-rules/${id}`, ruleData),
  deleteRoutingRule: (id: string) => api.delete(`/model-manager/routing-rules/${id}`),
  toggleRoutingRuleActive: (id: string, isActive: boolean) => 
    api.patch(`/model-manager/routing-rules/${id}/active`, { isActive }),
  
  // 獲取用戶可訪問的 workspaces
  getWorkspaces: () => api.get('/workspaces'),
  
  // 獲取文檔
  getDocuments: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/documents`),
};

export default apiService;
