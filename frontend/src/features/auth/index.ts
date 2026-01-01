/**
 * Auth Feature Module
 *
 * Public API for the authentication feature.
 * Only export what should be accessible from outside this feature.
 */

// Components
// export { LoginForm } from './components/LoginForm';

// Hooks
export { useAuth, authKeys } from './hooks/useAuth';

// Services
export { authService } from './services/auth.service';

// Stores
export { useAuthStore, useHasHydrated } from './stores/auth.store';

// Types
export type {
  User,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthError,
} from './types/auth.types';
