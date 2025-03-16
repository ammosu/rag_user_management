const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3002;
const JWT_SECRET = 'your-secret-key-for-testing';

// 啟用中間件
app.use(cors());
app.use(bodyParser.json());

// 模擬資料
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    displayName: '系統管理員',
    email: 'admin@example.com',
    role: 'admin',
    departmentId: '1'
  },
  {
    id: '2',
    username: 'manager1',
    password: 'manager123',
    displayName: '研發部經理',
    email: 'manager1@example.com',
    role: 'manager',
    departmentId: '2'
  },
  {
    id: '3',
    username: 'manager2',
    password: 'manager123',
    displayName: '市場部經理',
    email: 'manager2@example.com',
    role: 'manager',
    departmentId: '3'
  },
  {
    id: '4',
    username: 'user1',
    password: 'user123',
    displayName: '研發部成員',
    email: 'user1@example.com',
    role: 'user',
    departmentId: '2'
  },
  {
    id: '5',
    username: 'user2',
    password: 'user123',
    displayName: '市場部成員',
    email: 'user2@example.com',
    role: 'user',
    departmentId: '3'
  }
];

const departments = [
  {
    id: '1',
    name: '管理部',
    description: '公司管理部門'
  },
  {
    id: '2',
    name: '研發部',
    description: '負責技術研發'
  },
  {
    id: '3',
    name: '市場部',
    description: '負責市場營銷'
  }
];

const workspaces = [
  {
    id: '1',
    name: '公司通用知識庫',
    description: '所有員工可訪問的基本知識庫',
    departmentId: null
  },
  {
    id: '2',
    name: '技術資料庫',
    description: '技術文檔和程式碼示例',
    departmentId: '2'
  },
  {
    id: '3',
    name: '市場策略知識庫',
    description: '市場策略和銷售資料',
    departmentId: '3'
  },
  {
    id: '4',
    name: '管理層文件庫',
    description: '僅管理層可訪問的文件',
    roleRequired: 'manager'
  }
];

const documents = {
  '1': [
    {
      id: '101',
      title: '公司簡介',
      type: 'text',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '102',
      title: '員工手冊',
      type: 'pdf',
      createdAt: '2023-01-10T00:00:00Z',
      updatedAt: '2023-02-15T00:00:00Z'
    }
  ],
  '2': [
    {
      id: '201',
      title: 'API 文檔',
      type: 'markdown',
      createdAt: '2023-02-01T00:00:00Z',
      updatedAt: '2023-03-05T00:00:00Z'
    },
    {
      id: '202',
      title: '系統架構圖',
      type: 'draw.io',
      createdAt: '2023-02-10T00:00:00Z',
      updatedAt: '2023-03-01T00:00:00Z'
    },
    {
      id: '203',
      title: '代碼風格指南',
      type: 'markdown',
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: '2023-01-15T00:00:00Z'
    }
  ],
  '3': [
    {
      id: '301',
      title: '市場分析報告',
      type: 'pdf',
      createdAt: '2023-02-05T00:00:00Z',
      updatedAt: '2023-03-10T00:00:00Z'
    },
    {
      id: '302',
      title: '競爭對手分析',
      type: 'spreadsheet',
      createdAt: '2023-02-20T00:00:00Z',
      updatedAt: '2023-03-15T00:00:00Z'
    }
  ],
  '4': [
    {
      id: '401',
      title: '公司戰略規劃',
      type: 'pdf',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-03-01T00:00:00Z'
    },
    {
      id: '402',
      title: '預算計劃',
      type: 'spreadsheet',
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: '2023-02-01T00:00:00Z'
    }
  ]
};

const ragResponses = {
  '研發部': [
    {
      query: '我們的 API 文檔',
      response: 'API 文檔位於技術資料庫中，最近一次更新是在 2023 年 3 月 5 日。文檔包含了所有 REST API 的詳細說明，包括端點、參數、請求和響應範例。您可以在技術資料庫中找到完整的文檔。',
      sourceDocs: [
        {
          title: 'API 文檔',
          snippet: 'REST API 文檔 v1.3，包含所有端點說明和使用範例。支援 JSON 和 XML 格式的請求和響應。'
        }
      ]
    },
    {
      query: '公司的市場策略',
      response: '抱歉，您沒有權限訪問市場部的知識庫內容。請聯繫您的部門經理或系統管理員申請相應權限。',
      sourceDocs: []
    }
  ],
  '市場部': [
    {
      query: '我們的 API 文檔',
      response: '抱歉，API 文檔位於研發部的技術資料庫中，您目前沒有權限訪問該知識庫。請聯繫您的部門經理或系統管理員申請相應權限。',
      sourceDocs: []
    },
    {
      query: '公司的市場策略',
      response: '根據最新的市場分析報告，公司的市場策略重點關注三個方面：一、拓展企業客戶市場，提高產品在大型企業中的滲透率；二、優化產品用戶體驗，提高用戶滿意度和留存率；三、發展合作夥伴生態系統，擴大產品影響力。詳細策略可參考市場分析報告和競爭對手分析文檔。',
      sourceDocs: [
        {
          title: '市場分析報告',
          snippet: '2023年第一季度市場分析報告，包含市場趨勢、用戶需求分析和產品競爭力評估。'
        },
        {
          title: '競爭對手分析',
          snippet: '主要競爭對手的產品功能、價格策略和市場份額比較分析。'
        }
      ]
    }
  ],
  '管理部': [
    {
      query: '我們的 API 文檔',
      response: 'API 文檔位於技術資料庫中，最近一次更新是在 2023 年 3 月 5 日。文檔包含了所有 REST API 的詳細說明，包括端點、參數、請求和響應範例。您可以在技術資料庫中找到完整的文檔。',
      sourceDocs: [
        {
          title: 'API 文檔',
          snippet: 'REST API 文檔 v1.3，包含所有端點說明和使用範例。支援 JSON 和 XML 格式的請求和響應。'
        }
      ]
    },
    {
      query: '公司的市場策略',
      response: '根據最新的市場分析報告，公司的市場策略重點關注三個方面：一、拓展企業客戶市場，提高產品在大型企業中的滲透率；二、優化產品用戶體驗，提高用戶滿意度和留存率；三、發展合作夥伴生態系統，擴大產品影響力。詳細策略可參考市場分析報告和競爭對手分析文檔。',
      sourceDocs: [
        {
          title: '市場分析報告',
          snippet: '2023年第一季度市場分析報告，包含市場趨勢、用戶需求分析和產品競爭力評估。'
        },
        {
          title: '競爭對手分析',
          snippet: '主要競爭對手的產品功能、價格策略和市場份額比較分析。'
        }
      ]
    },
    {
      query: '公司戰略規劃',
      response: '公司的五年戰略規劃重點包括：1) 產品線擴展 - 計劃在未來兩年內開發三個新產品；2) 市場擴張 - 目標在亞太地區建立更強勢的市場地位；3) 人才發展 - 引進高級技術人才並建立完善的培訓系統；4) 技術創新 - 增加研發投入，提高核心技術競爭力。詳細內容可查閱管理層文件庫中的戰略規劃文檔。',
      sourceDocs: [
        {
          title: '公司戰略規劃',
          snippet: '2023-2028年公司戰略發展規劃，包含業務發展目標、市場策略、產品路線圖和組織結構規劃。'
        },
        {
          title: '預算計劃',
          snippet: '2023年度各部門預算分配和主要投資方向，包含季度執行計劃。'
        }
      ]
    }
  ],
};

// 驗證中間件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '需要授權令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '無效的令牌' });
    }
    req.user = user;
    next();
  });
};

// 登入路由
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: '用戶名或密碼錯誤' });
  }
  
  // 創建令牌
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role,
      departmentId: user.departmentId
    }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  // 返回用戶信息和令牌
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      departmentId: user.departmentId
    }
  });
});

// OAuth2 模擬回調
app.get('/api/auth/oauth2/:provider/callback', (req, res) => {
  const { provider } = req.params;
  const { code } = req.query;
  
  // 在實際應用中，這裡會使用code獲取訪問令牌並獲取用戶信息
  // 為了演示，我們直接返回一個模擬用戶
  
  const mockUser = {
    id: '6',
    username: `${provider}_user`,
    displayName: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
    role: 'user',
    departmentId: '2' // 假設 OAuth 用戶屬於研發部
  };
  
  const token = jwt.sign(
    { 
      userId: mockUser.id, 
      username: mockUser.username,
      role: mockUser.role,
      departmentId: mockUser.departmentId
    }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  // 構建回調 URL
  const redirectUri = req.query.redirect_uri || req.query.redirectUri || '/';
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.append('token', token);
  callbackUrl.searchParams.append('user', JSON.stringify(mockUser));
  
  res.redirect(callbackUrl.toString());
});

// OAuth2 重定向
app.get('/api/auth/oauth2/:provider', (req, res) => {
  const { provider } = req.params;
  // 在實際應用中，這裡會重定向到提供商的授權頁面
  // 為了演示，我們直接重定向到模擬回調
  const redirectUri = encodeURIComponent(req.query.redirectUri || `${req.protocol}://${req.get('host')}/oauth2/callback`);
  res.redirect(`/api/auth/oauth2/${provider}/callback?code=mock_code&redirect_uri=${redirectUri}`);
});

// SAML 模擬回調
app.post('/api/auth/saml/callback', (req, res) => {
  // 在實際應用中，這裡會處理SAML響應
  // 為了演示，我們直接返回一個模擬用戶
  
  const mockUser = {
    id: '7',
    username: 'saml_user',
    displayName: 'SAML User',
    role: 'manager',
    departmentId: '3' // 假設 SAML 用戶是市場部經理
  };
  
  const token = jwt.sign(
    { 
      userId: mockUser.id, 
      username: mockUser.username,
      role: mockUser.role,
      departmentId: mockUser.departmentId
    }, 
    JWT_SECRET, 
    { expiresIn: '8h' }
  );
  
  // 構建回調 URL
  const redirectUri = req.query.redirectUri || '/';
  const callbackUrl = new URL(redirectUri, `${req.protocol}://${req.get('host')}`);
  callbackUrl.searchParams.append('token', token);
  callbackUrl.searchParams.append('user', JSON.stringify(mockUser));
  
  res.redirect(callbackUrl.toString());
});

// SAML 重定向
app.get('/api/auth/saml', (req, res) => {
  // 在實際應用中，這裡會重定向到身份提供商
  // 為了演示，我們直接發送一個HTML表單自動提交到回調
  const redirectUri = req.query.redirectUri || `${req.protocol}://${req.get('host')}/saml/callback`;
  
  res.send(`
    <html>
      <body>
        <form id="samlForm" method="post" action="/api/auth/saml/callback?redirectUri=${encodeURIComponent(redirectUri)}">
          <input type="hidden" name="SAMLResponse" value="mock_saml_response" />
          <input type="submit" value="繼續" />
        </form>
        <script>document.getElementById('samlForm').submit();</script>
      </body>
    </html>
  `);
});

// 獲取工作區列表 (根據用戶權限過濾)
app.get('/api/workspaces', authenticateToken, (req, res) => {
  const { role, departmentId } = req.user;
  
  // 過濾工作區列表
  let accessibleWorkspaces = workspaces.filter(ws => {
    // 公共工作區
    if (!ws.departmentId && !ws.roleRequired) {
      return true;
    }
    
    // 部門工作區
    if (ws.departmentId) {
      // 管理員可以訪問所有部門工作區
      if (role === 'admin') {
        return true;
      }
      // 用戶只能訪問自己部門的工作區
      return ws.departmentId === departmentId;
    }
    
    // 基於角色的工作區
    if (ws.roleRequired) {
      const roleWeight = {
        'admin': 3,
        'manager': 2,
        'user': 1
      };
      
      const requiredWeight = roleWeight[ws.roleRequired] || 0;
      const userWeight = roleWeight[role] || 0;
      
      return userWeight >= requiredWeight;
    }
    
    return false;
  });
  
  res.json(accessibleWorkspaces);
});

// 獲取工作區文檔
app.get('/api/workspaces/:workspaceId/documents', authenticateToken, (req, res) => {
  const { workspaceId } = req.params;
  const { role, departmentId } = req.user;
  
  // 檢查工作區訪問權限
  const workspace = workspaces.find(ws => ws.id === workspaceId);
  
  if (!workspace) {
    return res.status(404).json({ message: '工作區不存在' });
  }
  
  // 檢查權限
  let hasAccess = false;
  
  // 公共工作區
  if (!workspace.departmentId && !workspace.roleRequired) {
    hasAccess = true;
  }
  // 部門工作區
  else if (workspace.departmentId) {
    hasAccess = role === 'admin' || workspace.departmentId === departmentId;
  }
  // 基於角色的工作區
  else if (workspace.roleRequired) {
    const roleWeight = {
      'admin': 3,
      'manager': 2,
      'user': 1
    };
    
    const requiredWeight = roleWeight[workspace.roleRequired] || 0;
    const userWeight = roleWeight[role] || 0;
    
    hasAccess = userWeight >= requiredWeight;
  }
  
  if (!hasAccess) {
    return res.status(403).json({ message: '沒有權限訪問此工作區' });
  }
  
  // 返回文檔列表
  const workspaceDocs = documents[workspaceId] || [];
  res.json(workspaceDocs);
});

// 模型選項端點
app.get('/api/rag/models', authenticateToken, (req, res) => {
  // 模擬從API獲取的模型列表
  const models = [
    { 
      id: 'default', 
      name: '自動選擇', 
      description: '根據查詢內容自動選擇最合適的模型',
      type: 'auto',
      provider: 'system',
      features: {}
    },
    { 
      id: 'openai-gpt-4-turbo', 
      name: 'GPT-4 Turbo', 
      description: '強大的通用大型語言模型',
      type: 'commercial_api',
      provider: 'openai',
      modelName: 'gpt-4-turbo',
      contextWindow: 128000,
      maxTokens: 4096,
      features: {
        supportsImages: true,
        supportsComputerUse: true,
        supportsPromptCaching: true,
        maxOutput: 4096,
        inputPrice: 10.00,
        outputPrice: 30.00
      },
      customizableBaseUrl: true
    },
    { 
      id: 'openai-gpt-3.5-turbo', 
      name: 'GPT-3.5 Turbo', 
      description: '高效能的通用大型語言模型',
      type: 'commercial_api',
      provider: 'openai',
      modelName: 'gpt-3.5-turbo',
      contextWindow: 16385,
      maxTokens: 4096,
      features: {
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCaching: true,
        maxOutput: 4096,
        inputPrice: 0.50,
        outputPrice: 1.50
      },
      customizableBaseUrl: true
    },
    { 
      id: 'anthropic-claude-3-sonnet-20240229', 
      name: 'Claude 3 Sonnet', 
      description: '優秀的理解和創作能力',
      type: 'commercial_api',
      provider: 'anthropic',
      modelName: 'claude-3-sonnet-20240229',
      contextWindow: 200000,
      maxTokens: 8192,
      features: {
        supportsImages: true,
        supportsComputerUse: true,
        supportsPromptCaching: true,
        maxOutput: 8192,
        inputPrice: 3.00,
        outputPrice: 15.00,
        cacheWritePrice: 3.75,
        cacheReadPrice: 0.30
      },
      customizableBaseUrl: true
    },
    { 
      id: 'anthropic-claude-3-haiku-20240307', 
      name: 'Claude 3 Haiku', 
      description: '最快速的Claude模型',
      type: 'commercial_api',
      provider: 'anthropic',
      modelName: 'claude-3-haiku-20240307',
      contextWindow: 200000,
      maxTokens: 4096,
      features: {
        supportsImages: true,
        supportsComputerUse: true,
        supportsPromptCaching: true,
        maxOutput: 4096,
        inputPrice: 0.25,
        outputPrice: 1.25
      },
      customizableBaseUrl: true
    },
    { 
      id: 'ollama-llama3', 
      name: 'Llama 3 70B', 
      description: '本地運行的高效開源模型',
      type: 'open_source',
      provider: 'ollama',
      modelName: 'llama3:70b',
      endpoint: 'http://localhost:11434/api',
      contextWindow: 8192,
      maxTokens: 2048,
      features: {
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCaching: false,
        maxOutput: 2048,
        inputPrice: 0,
        outputPrice: 0
      },
      customizableBaseUrl: false
    },
    { 
      id: 'ollama-mistral', 
      name: 'Mistral 7B', 
      description: '本地運行的輕量級開源模型',
      type: 'open_source',
      provider: 'ollama',
      modelName: 'mistral:7b',
      endpoint: 'http://localhost:11434/api',
      contextWindow: 8192,
      maxTokens: 2048,
      features: {
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCaching: false,
        maxOutput: 2048,
        inputPrice: 0,
        outputPrice: 0
      },
      customizableBaseUrl: false
    }
  ];
  
  // 延遲響應，模擬API調用
  setTimeout(() => {
    res.json(models);
  }, 500);
});

// RAG 查詢端點
app.post('/api/rag/query', authenticateToken, (req, res) => {
  const { query, modelId, apiKey, baseUrl } = req.body;
  const { role, departmentId } = req.user;
  
  if (!query) {
    return res.status(400).json({ message: '查詢內容不能為空' });
  }
  
  // 根據用戶部門確定回應內容
  let departmentName = 'unknown';
  
  if (role === 'admin') {
    departmentName = '管理部';
  } else {
    const department = departments.find(dept => dept.id === departmentId);
    departmentName = department ? department.name : 'unknown';
  }
  
  // 查找匹配的回應
  const departmentResponses = ragResponses[departmentName] || [];
  
  // 簡單的關鍵詞匹配
  let response = departmentResponses.find(r => 
    query.includes(r.query) || r.query.includes(query)
  );
  
  // 如果沒有找到匹配的回應，返回默認回應
  if (!response) {
    response = {
      response: `抱歉，我沒有找到與「${query}」相關的資訊。請嘗試其他關鍵詞或聯繫您的部門管理員。`,
      sourceDocs: []
    };
  }
  
  // 延遲響應，模擬真實處理時間
  setTimeout(() => {
    res.json(response);
  }, 1000);
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`模擬 API 伺服器運行在 http://localhost:${PORT}`);
  console.log(`可用測試帳號：`);
  console.log(`- 管理員：username=admin, password=admin123`);
  console.log(`- 研發部經理：username=manager1, password=manager123`);
  console.log(`- 市場部經理：username=manager2, password=manager123`);
  console.log(`- 研發部用戶：username=user1, password=user123`);
  console.log(`- 市場部用戶：username=user2, password=user123`);
});
