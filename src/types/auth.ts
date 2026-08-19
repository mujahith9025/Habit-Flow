export type AuthProviderType = 'password' | 'google';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  createdAt: string;
  lastLoginAt: string;
  authProvider: AuthProviderType;
  themePreference?: 'light' | 'dark' | 'system';
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
