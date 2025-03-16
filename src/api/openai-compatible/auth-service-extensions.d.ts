import { AuthService } from '../../auth/services/auth.service';
import { ApiKey } from '../../models/model-types';

declare module '../../auth/services/auth.service' {
  interface AuthService {
    getUserApiKeys(userId: string): Promise<ApiKey[]>;
    generateApiKey(userId: string, name?: string): Promise<ApiKey>;
    revokeApiKey(apiKeyId: string, userId: string): Promise<boolean>;
    getUserByApiKey(apiKey: string): Promise<any>;
  }
}
