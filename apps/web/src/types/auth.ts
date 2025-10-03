// ========================================
// AUTHENTICATION TYPES
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
