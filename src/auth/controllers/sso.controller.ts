import { Request, Response } from 'express';
import { SSOService } from '../services/sso.service';
import passport from 'passport';

export class SSOController {
  private ssoService: SSOService;
  
  constructor(ssoService: SSOService) {
    this.ssoService = ssoService;
  }
  
  // 重定向至 OAuth2 授權頁面
  async redirectToOAuth2(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const redirectUri = req.query.redirectUri as string;
      
      // 使用原始 URL 作為狀態，以便在回調中重定向
      const state = redirectUri ? Buffer.from(redirectUri).toString('base64') : undefined;
      
      // 獲取授權 URL 並重定向
      const authUrl = this.ssoService.getOAuth2AuthUrl(provider, state);
      return res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth2 redirect error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 處理 OAuth2 回調
  async handleOAuth2Callback(req: Request, res: Response) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: '缺少授權碼' });
      }
      
      // 處理授權碼
      const result = await this.ssoService.handleOAuth2Callback(
        provider,
        code as string
      );
      
      // 如果有狀態參數（包含重定向 URL），解碼並重定向
      if (state) {
        const redirectUri = Buffer.from(state as string, 'base64').toString();
        // 將令牌和用戶信息作為查詢參數附加到重定向 URL
        const url = new URL(redirectUri);
        url.searchParams.append('token', result.token);
        url.searchParams.append('user', JSON.stringify(result.user));
        
        return res.redirect(url.toString());
      }
      
      // 否則直接返回結果
      return res.json(result);
    } catch (error) {
      console.error('OAuth2 callback error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 重定向至 SAML 身份提供商
  async redirectToSaml(req: Request, res: Response, next: Function) {
    try {
      // 使用 passport 中間件處理 SAML 重定向
      this.ssoService.getSamlAuthMiddleware()(req, res, next);
    } catch (error) {
      console.error('SAML redirect error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
  
  // 處理 SAML 回調
  async handleSamlCallback(req: Request, res: Response) {
    try {
      // 使用 passport 驗證
      passport.authenticate('saml', { session: false }, async (err: any, user: any) => {
        if (err) {
          console.error('SAML authentication error:', err);
          return res.status(500).json({ message: '驗證失敗' });
        }
        
        if (!user) {
          return res.status(401).json({ message: '未授權' });
        }
        
        try {
          // 處理 SAML 回調
          const result = await this.ssoService.handleSamlCallback(user);
          
          // 重定向到前端應用，並附加令牌和用戶信息
          const redirectUri = req.query.redirectUri as string || '/';
          const url = new URL(redirectUri, `${req.protocol}://${req.get('host')}`);
          url.searchParams.append('token', result.token);
          url.searchParams.append('user', JSON.stringify(result.user));
          
          return res.redirect(url.toString());
        } catch (error) {
          console.error('SAML callback processing error:', error);
          return res.status(500).json({ message: '處理 SAML 回調時出錯' });
        }
      })(req, res);
    } catch (error) {
      console.error('SAML callback error:', error);
      return res.status(500).json({ message: '伺服器錯誤' });
    }
  }
}
