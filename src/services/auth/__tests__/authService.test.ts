/**
 * Authentication Service Tests
 * 
 * Comprehensive test suite for the AuthService class covering:
 * - Anonymous authentication
 * - Account upgrades
 * - Session management
 * - Error handling
 * - State management
 */

import { AuthService, AuthResult, AuthState } from '../authService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Supabase client methods
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
        signInAnonymously: jest.fn(),
        updateUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabaseClient);

    // Create fresh service instance
    authService = new AuthService();
  });

  describe('initializeAuth (trial mode)', () => {
    it('should create a trial anonymous session', async () => {
      const result = await authService.initializeAuth();

      expect(result.success).toBe(true);
      expect(result.session).toBeTruthy();
      expect(result.user).toBeTruthy();
      expect(result.user!.is_anonymous).toBe(true);
    });

    it('should update internal auth state and notify listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = authService.onAuthStateChange(listener);

      await authService.initializeAuth();

      expect(listener).toHaveBeenCalled();
      const lastCallArg = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCallArg.isAuthenticated).toBe(true);
      expect(lastCallArg.user?.is_anonymous).toBe(true);

      unsubscribe();
    });
  });

  describe('signInAnonymously', () => {
    it('should create anonymous session successfully', async () => {
      const mockSession = {
        user: { id: 'user-789', is_anonymous: true },
        access_token: 'token-789',
      };

      mockSupabaseClient.auth.signInAnonymously.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const result = await authService.signInAnonymously();

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockSession.user);
    });

    it('should handle anonymous sign-in errors', async () => {
      const mockError = new Error('Anonymous sign-in failed');

      mockSupabaseClient.auth.signInAnonymously.mockResolvedValue({
        data: { session: null, user: null },
        error: mockError,
      });

      const result = await authService.signInAnonymously();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Anonymous sign-in failed');
    });
  });

  describe('upgradeAccount', () => {
    it('should upgrade anonymous account successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', is_anonymous: false },
        access_token: 'token-upgraded',
      };

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const upgradeData = {
        email: 'test@example.com',
        password: 'securepassword123',
      };

      const result = await authService.upgradeAccount(upgradeData);

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockSession.user);
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        email: upgradeData.email,
        password: upgradeData.password,
      });
    });

    it('should handle account upgrade errors', async () => {
      const mockError = new Error('Email already exists');

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const upgradeData = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const result = await authService.upgradeAccount(upgradeData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in with email and password successfully', async () => {
      const mockSession = {
        user: { id: 'user-email', email: 'user@example.com', is_anonymous: false },
        access_token: 'token-email',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const result = await authService.signInWithEmail('user@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockSession.user);
    });

    it('should handle email sign-in errors', async () => {
      const mockError = new Error('Invalid credentials');

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: mockError,
      });

      const result = await authService.signInWithEmail('wrong@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('signInWithOAuth', () => {
    it('should initiate OAuth sign-in successfully', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-url.com' },
        error: null,
      });

      const result = await authService.signInWithOAuth('google');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'whatcanieat://auth-callback',
        },
      });
    });

    it('should handle OAuth errors', async () => {
      const mockError = new Error('OAuth provider not available');

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await authService.signInWithOAuth('apple');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth provider not available');
    });
  });

  describe('signOut', () => {
    it('should sign out and create new anonymous session', async () => {
      const mockAnonymousSession = {
        user: { id: 'user-new-anon', is_anonymous: true },
        access_token: 'token-new-anon',
      };

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      mockSupabaseClient.auth.signInAnonymously.mockResolvedValue({
        data: { session: mockAnonymousSession, user: mockAnonymousSession.user },
        error: null,
      });

      const result = await authService.signOut();

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockAnonymousSession);
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockSupabaseClient.auth.signInAnonymously).toHaveBeenCalled();
    });

    it('should handle sign-out errors', async () => {
      const mockError = new Error('Sign out failed');

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: mockError,
      });

      const result = await authService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        user: { id: 'user-current' },
        access_token: 'token-current',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await authService.getCurrentSession();

      expect(session).toEqual(mockSession);
    });

    it('should return null if no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await authService.getCurrentSession();

      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'user-current', email: 'current@example.com' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null if no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('isAnonymousUser', () => {
    it('should return true for anonymous user', () => {
      // Mock the current state to have an anonymous user
      const mockState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        session: null,
        user: { id: 'user-123', is_anonymous: true } as any,
        error: null,
      };

      // Access private method through type assertion
      (authService as any).currentState = mockState;

      const isAnonymous = authService.isAnonymousUser();

      expect(isAnonymous).toBe(true);
    });

    it('should return false for non-anonymous user', () => {
      const mockState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        session: null,
        user: { id: 'user-123', is_anonymous: false } as any,
        error: null,
      };

      (authService as any).currentState = mockState;

      const isAnonymous = authService.isAnonymousUser();

      expect(isAnonymous).toBe(false);
    });

    it('should return false if no user', () => {
      const mockState: AuthState = {
        isAuthenticated: false,
        isLoading: false,
        session: null,
        user: null,
        error: null,
      };

      (authService as any).currentState = mockState;

      const isAnonymous = authService.isAnonymousUser();

      expect(isAnonymous).toBe(false);
    });
  });

  describe('onAuthStateChange', () => {
    it('should register and call state change listeners', () => {
      const mockListener = jest.fn();
      const mockState: AuthState = {
        isAuthenticated: true,
        isLoading: false,
        session: null,
        user: { id: 'user-123' } as any,
        error: null,
      };

      // Set initial state
      (authService as any).currentState = mockState;

      // Register listener
      const unsubscribe = authService.onAuthStateChange(mockListener);

      // Should be called immediately with current state
      expect(mockListener).toHaveBeenCalledWith(mockState);

      // Test unsubscribe
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();

      // Clear mock and trigger state change
      mockListener.mockClear();
      (authService as any).updateAuthState({ isLoading: true });

      // Should not be called after unsubscribe
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('getSupabaseClient', () => {
    it('should return Supabase client instance', () => {
      const client = authService.getSupabaseClient();

      expect(client).toBe(mockSupabaseClient);
    });
  });
});
