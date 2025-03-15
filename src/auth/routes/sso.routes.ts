import express from 'express';
import { SSOController } from '../controllers/sso.controller';

export function setupSSORoutes(ssoController: SSOController) {
  const router = express.Router();
  
  // OAuth2 路由
  router.get('/oauth2/:provider', async (req, res) => {
    await ssoController.redirectToOAuth2(req, res);
  });
  
  router.get('/oauth2/:provider/callback', async (req, res) => {
    await ssoController.handleOAuth2Callback(req, res);
  });
  
  // SAML 路由
  router.get('/saml', async (req, res, next) => {
    await ssoController.redirectToSaml(req, res, next);
  });
  
  router.post('/saml/callback', async (req, res) => {
    await ssoController.handleSamlCallback(req, res);
  });
  
  return router;
}
