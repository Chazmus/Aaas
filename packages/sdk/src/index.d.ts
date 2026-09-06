export interface UserPayload {
  id: string;
  email?: string;
  name?: string;
  role: string;
  avatarUrl?: string;
  [key: string]: any;
}

export interface AaaSVerifierOptions {
  issuer?: string;
  audience?: string;
  jwksUri?: string;
  publicKey?: any;
}

export interface RequireAuthOptions extends AaaSVerifierOptions {
  role?: string | string[];
  verify?: (token: string) => Promise<{ user: UserPayload; payload: any }>;
}

export interface AaaSVerifier {
  verify(token: string): Promise<{
    payload: any;
    protectedHeader: any;
    user: UserPayload;
  }>;
  getKey: any;
}

export function createAaaSVerifier(options: AaaSVerifierOptions): AaaSVerifier;
export function requireAuth(options: RequireAuthOptions): (req: any, res: any, next: any) => Promise<any>;
