import { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole } from '../models/user';
import { AuthService } from './auth.service';
import { Strategy as SamlStrategy } from 'passport-saml';
import passport from 'passport';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export interface SSOConfig {
  // OAuth2 配置
  oauth2: {
    enabled: boolean;
    providers: {
      [key: string]: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        authorizationUrl?: string;
        tokenUrl?: string;
        userInfoUrl?: string;
        scope?: string;
      }
    }
  };
  
  // SAML 配置
  saml: {
    enabled: boolean;
    entryPoint: string;
    issuer: string;
    cert: string;
    signatureAlgorithm?: string;
    digestAlgorithm?: string;
    attributeMapping: {
      email: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      departmentId?: string;
      role?: string;
    }
  };
  
  // JWT 配置
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export class SSOService {
  private db: any; // MongoDB 連接實例
  private authService: AuthService;
  private config: SSOConfig;
  private oauthClients: { [key: string]: OAuth2Client } = {};
  
  constructor(mongoClient: MongoClient, authService: AuthService, config: SSOConfig) {
    this.db = mongoClient.db('rag_system');
    this.authService = authService;
    this.config = config;
    
    // 初始化 OAuth2 客戶端
    if (config.oauth2.enabled) {
      Object.keys(config.oauth2.providers).forEach(provider => {
        const providerConfig = config.oauth2.providers[provider];
        this.oauthClients[provider] = new OAuth2Client({
          clientId: providerConfig.clientId,
          clientSecret: providerConfig.clientSecret,
          redirectUri: providerConfig.redirectUri
        });
      });
    }
    
    // 初始化 SAML 策略
    if (config.saml.enabled) {
      this.initializeSamlStrategy();
    }
  }
  
  // 初始化 SAML 策略
  private initializeSamlStrategy() {
    const samlConfig = this.config.saml;
    
    const strategy = new SamlStrategy({
      entryPoint: samlConfig.entryPoint,
      issuer: samlConfig.issuer,
      cert: samlConfig.cert,
      // TypeScript expects specific enum values for these algorithms
      // We'll cast them to any to bypass the type checking
      signatureAlgorithm: samlConfig.signatureAlgorithm as any,
      digestAlgorithm: samlConfig.digestAlgorithm as any,
      passReqToCallback: true
    }, async (req: Request, profile: any, done: any) => {
      try {
        // 從 SAML 屬性映射中提取用戶信息
        const emailAttr = samlConfig.attributeMapping.email;
        const email = profile[emailAttr];
        
        let displayName = '';
        if (samlConfig.attributeMapping.displayName && profile[samlConfig.attributeMapping.displayName]) {
          displayName = profile[samlConfig.attributeMapping.displayName];
        } else {
          const firstName = samlConfig.attributeMapping.firstName && profile[samlConfig.attributeMapping.firstName] 
            ? profile[samlConfig.attributeMapping.firstName] : '';
          const lastName = samlConfig.attributeMapping.lastName && profile[samlConfig.attributeMapping.lastName]
            ? profile[samlConfig.attributeMapping.lastName] : '';
          displayName = `${firstName} ${lastName}`.trim();
        }
        
        // 使用 email 查找用戶
        let user = await this.db.collection('users').findOne({ email });
        
        if (!user) {
          // 新用戶 - 從 SAML 屬性中獲取部門 ID
          let departmentId = null;
          if (samlConfig.attributeMapping.departmentId && profile[samlConfig.attributeMapping.departmentId]) {
            // 嘗試通過部門代碼找到相應的部門 ID
            const deptCode = profile[samlConfig.attributeMapping.departmentId];
            const department = await this.db.collection('departments').findOne({ code: deptCode });
            if (department) {
              departmentId = department._id;
            }
          }
          
          // 如果沒有找到部門，使用默認部門
          if (!departmentId) {
            const defaultDept = await this.db.collection('departments').findOne({ isDefault: true });
            departmentId = defaultDept ? defaultDept._id : null;
          }
          
          // 獲取角色，默認為普通用戶
          let role = UserRole.USER;
          if (samlConfig.attributeMapping.role && profile[samlConfig.attributeMapping.role]) {
            const roleMapping: { [key: string]: UserRole } = {
              'admin': UserRole.ADMIN,
              'administrator': UserRole.ADMIN,
              'manager': UserRole.MANAGER,
              'user': UserRole.USER
            };
            role = roleMapping[profile[samlConfig.attributeMapping.role].toLowerCase()] || UserRole.USER;
          }
          
          // 創建新用戶
          const newUser = {
            email,
            username: email.split('@')[0],
            displayName,
            departmentId: departmentId ? new ObjectId(departmentId) : null,
            role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result = await this.db.collection('users').insertOne(newUser);
          user = { _id: result.insertedId, ...newUser };
        }
        
        // 返回用戶信息
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    });
    
    passport.use('saml', strategy);
  }
  
  // 獲取 OAuth2 授權 URL
  getOAuth2AuthUrl(provider: string, state?: string): string {
    if (!this.config.oauth2.enabled || !this.config.oauth2.providers[provider]) {
      throw new Error(`OAuth2 provider ${provider} not configured`);
    }
    
    const client = this.oauthClients[provider];
    const providerConfig = this.config.oauth2.providers[provider];
    
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: providerConfig.scope || 'profile email',
      state
    });
  }
  
  // 處理 OAuth2 回調
  async handleOAuth2Callback(provider: string, code: string): Promise<{ token: string, user: any }> {
    if (!this.config.oauth2.enabled || !this.config.oauth2.providers[provider]) {
      throw new Error(`OAuth2 provider ${provider} not configured`);
    }
    
    try {
      const client = this.oauthClients[provider];
      const providerConfig = this.config.oauth2.providers[provider];
      
      // 兌換授權碼獲取訪問令牌
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      
      // 獲取用戶信息
      let userInfo;
      
      // 對於不同的提供商，可能需要不同的方式獲取用戶信息
      switch (provider) {
        case 'google':
          const oauth2 = await import('googleapis').then(g => g.google.oauth2('v2'));
          const { data } = await oauth2.userinfo.get({ auth: client });
          userInfo = data;
          break;
          
        case 'azure':
          // 使用 Microsoft Graph API
          const response = await fetch(providerConfig.userInfoUrl || 'https://graph.microsoft.com/v1.0/me', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`
            }
          });
          userInfo = await response.json();
          break;
          
        default:
          // 通用方法 - 使用配置的 userInfoUrl
          if (!providerConfig.userInfoUrl) {
            throw new Error(`No userInfoUrl configured for provider ${provider}`);
          }
          
          const genericResponse = await fetch(providerConfig.userInfoUrl, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`
            }
          });
          userInfo = await genericResponse.json();
      }
      
      // 檢查必要的用戶信息
      if (!userInfo.email) {
        throw new Error('Email not provided by OAuth2 provider');
      }
      
      // 在數據庫中查找或創建用戶
      let user = await this.db.collection('users').findOne({ email: userInfo.email });
      
      if (!user) {
        // 新用戶 - 使用默認部門
        const defaultDept = await this.db.collection('departments').findOne({ isDefault: true });
        const departmentId = defaultDept ? defaultDept._id : null;
        
        // 創建新用戶
        const newUser = {
          email: userInfo.email,
          username: userInfo.email.split('@')[0],
          displayName: userInfo.name || userInfo.displayName || userInfo.email.split('@')[0],
          departmentId,
          role: UserRole.USER, // 默認角色
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await this.db.collection('users').insertOne(newUser);
        user = { _id: result.insertedId, ...newUser };
      }
      
      // 生成 JWT 令牌
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          username: user.username,
          role: user.role,
          departmentId: user.departmentId?.toString()
        },
        this.config.jwt.secret,
        { expiresIn: this.config.jwt.expiresIn } as jwt.SignOptions
      );
      
      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          departmentId: user.departmentId
        }
      };
    } catch (error) {
      console.error(`OAuth2 callback error for provider ${provider}:`, error);
      throw error;
    }
  }
  
  // 驗證 SAML 請求 - 使用 passport 中間件處理
  getSamlAuthMiddleware() {
    if (!this.config.saml.enabled) {
      throw new Error('SAML is not enabled');
    }
    
    return passport.authenticate('saml', {
      failureRedirect: '/login',
      failureFlash: true
    });
  }
  
  // 處理 SAML 回調 - 返回用戶信息和令牌
  async handleSamlCallback(user: any): Promise<{ token: string, user: any }> {
    try {
      // 生成 JWT 令牌
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          username: user.username,
          role: user.role,
          departmentId: user.departmentId?.toString()
        },
        this.config.jwt.secret,
        { expiresIn: this.config.jwt.expiresIn } as jwt.SignOptions
      );
      
      return {
        token,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          departmentId: user.departmentId
        }
      };
    } catch (error) {
      console.error('SAML callback error:', error);
      throw error;
    }
  }
}
