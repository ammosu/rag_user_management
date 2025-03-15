export const ssoConfig = {
  oauth2: {
    enabled: true,
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/oauth2/google/callback',
        scope: 'profile email'
      },
      azure: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        clientSecret: process.env.AZURE_CLIENT_SECRET || '',
        redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/api/auth/oauth2/azure/callback',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid profile email User.Read'
      }
      // 可以添加更多 OAuth2 提供商
    }
  },
  saml: {
    enabled: true,
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || 'rag-system',
    cert: process.env.SAML_CERT || '',
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      displayName: 'http://schemas.microsoft.com/identity/claims/displayname',
      departmentId: 'http://schemas.microsoft.com/identity/claims/department',
      role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  }
};
