/**
 * Authentication Service for "What Can I Eat" Application
 * 
 * Handles user authentication using Supabase Auth with anonymous authentication
 * for MVP, with future support for account upgrades and social login.
 * 
 * Features:
 * - Anonymous authentication for immediate app usage
 * - Session management and persistence
 * - Account upgrade capabilities
 * - Social login preparation (Google, Apple)
 * - Secure session handling
 */

import { createClient, Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables for Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  session?: Session | null;
  user?: User | null;
  error?: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
}

/**
 * Account upgrade data interface
 */
export interface AccountUpgradeData {
  email: string;
  password: string;
}

/**
 * Social login provider types
 */
export type SocialProvider = 'google' | 'apple';

/**
 * Authentication Service Class
 * 
 * Provides comprehensive authentication functionality using Supabase Auth.
 * Starts with anonymous authentication for immediate app usage and supports
 * future account upgrades and social login.
 */
export class AuthService {
  private supabase;
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    session: null,
    user: null,
    error: null,
  };

  constructor() {
    // Initialize Supabase client with AsyncStorage for session persistence
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    // Set up auth state change listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.updateAuthState({
        isAuthenticated: !!session,
        isLoading: false,
        session,
        user: session?.user || null,
        error: null,
      });
    });
  }

  /**
   * Initialize authentication on app startup
   * 
   * Checks for existing session and creates anonymous session if needed.
   * This ensures users can immediately start using the app.
   * 
   * @returns Promise<AuthResult> - Authentication result
   */
  async initializeAuth(): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      // Check for existing session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (session) {
        // User already has a valid session
        return {
          success: true,
          session,
          user: session.user,
        };
      }

      // No existing session, create anonymous session
      const { data, error } = await this.supabase.auth.signInAnonymously();
      
      if (error) {
        throw error;
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication initialization failed';
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign in anonymously
   * 
   * Creates an anonymous user session for immediate app usage.
   * Anonymous users can later upgrade to permanent accounts.
   * 
   * @returns Promise<AuthResult> - Authentication result
   */
  async signInAnonymously(): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      const { data, error } = await this.supabase.auth.signInAnonymously();
      
      if (error) {
        throw error;
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Anonymous sign-in failed';
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upgrade anonymous account to permanent account
   * 
   * Allows anonymous users to create permanent accounts with email/password.
   * This preserves their usage history and preferences.
   * 
   * @param upgradeData - Email and password for the new account
   * @returns Promise<AuthResult> - Upgrade result
   */
  async upgradeAccount(upgradeData: AccountUpgradeData): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      const { data, error } = await this.supabase.auth.updateUser({
        email: upgradeData.email,
        password: upgradeData.password,
      });

      if (error) {
        throw error;
      }

      // Get the updated session after user update
      const { data: { session } } = await this.supabase.auth.getSession();

      return {
        success: true,
        session: session,
        user: data.user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account upgrade failed';
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign in with email and password
   * 
   * For users with permanent accounts.
   * 
   * @param email - User email
   * @param password - User password
   * @returns Promise<AuthResult> - Authentication result
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email sign-in failed';
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign in with social OAuth provider
   * 
   * Supports Google and Apple sign-in for future implementation.
   * 
   * @param provider - Social login provider
   * @returns Promise<AuthResult> - Authentication result
   */
  async signInWithOAuth(provider: SocialProvider): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'whatcanieat://auth-callback',
        },
      });

      if (error) {
        throw error;
      }

      // Note: OAuth flow completion happens in the redirect handler
      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `${provider} sign-in failed`;
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign out current user
   * 
   * Clears session and returns to anonymous state.
   * 
   * @returns Promise<AuthResult> - Sign out result
   */
  async signOut(): Promise<AuthResult> {
    try {
      this.updateAuthState({ ...this.currentState, isLoading: true });

      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // After sign out, automatically create new anonymous session
      return await this.signInAnonymously();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      
      this.updateAuthState({
        ...this.currentState,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current session
   * 
   * @returns Promise<Session | null> - Current session or null
   */
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user
   * 
   * @returns Promise<User | null> - Current user or null
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  /**
   * Check if current user is anonymous
   * 
   * @returns boolean - True if user is anonymous
   */
  isAnonymousUser(): boolean {
    return this.currentState.user?.is_anonymous || false;
  }

  /**
   * Get current authentication state
   * 
   * @returns AuthState - Current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to authentication state changes
   * 
   * @param listener - Callback function for state changes
   * @returns Function to unsubscribe
   */
  onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Update authentication state and notify listeners
   * 
   * @param newState - New authentication state
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    
    // Notify all listeners
    this.authStateListeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Get Supabase client instance
   * 
   * For use by other services that need direct Supabase access.
   * 
   * @returns Supabase client
   */
  getSupabaseClient() {
    return this.supabase;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export default
export default authService;