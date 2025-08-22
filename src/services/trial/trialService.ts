/**
 * Trial Service for "What Can I Eat" Application
 * 
 * Manages trial mode functionality where users can scan one menu
 * without creating an account, then must sign up for continued use.
 * 
 * Features:
 * - Track trial usage (scans performed)
 * - Enforce one-scan limit for trial users
 * - Prompt for account creation after trial limit
 * - Persist trial state locally
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_STORAGE_KEY = 'trial_usage';
const MAX_TRIAL_SCANS = 1;

export interface TrialUsage {
  scansPerformed: number;
  firstScanDate: string;
  trialExpired: boolean;
  deviceId: string;
}

export interface TrialCheckResult {
  canScan: boolean;
  scansRemaining: number;
  requiresSignup: boolean;
  message?: string;
}

export class TrialService {
  private static instance: TrialService;
  private trialUsage: TrialUsage | null = null;

  private constructor() {}

  static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  /**
   * Initialize trial service and load existing usage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
      if (stored) {
        this.trialUsage = JSON.parse(stored);
      } else {
        // Create new trial usage record
        this.trialUsage = {
          scansPerformed: 0,
          firstScanDate: new Date().toISOString(),
          trialExpired: false,
          deviceId: this.generateDeviceId(),
        };
        await this.saveTrialUsage();
      }
    } catch (error) {
      console.error('Failed to initialize trial service:', error);
      // Create default trial usage if loading fails
      this.trialUsage = {
        scansPerformed: 0,
        firstScanDate: new Date().toISOString(),
        trialExpired: false,
        deviceId: this.generateDeviceId(),
      };
    }
  }

  /**
   * Check if user can perform a scan
   */
  async canPerformScan(): Promise<TrialCheckResult> {
    if (!this.trialUsage) {
      await this.initialize();
    }

    const usage = this.trialUsage!;
    const scansRemaining = Math.max(0, MAX_TRIAL_SCANS - usage.scansPerformed);
    
    if (usage.trialExpired || usage.scansPerformed >= MAX_TRIAL_SCANS) {
      return {
        canScan: false,
        scansRemaining: 0,
        requiresSignup: true,
        message: 'Trial limit reached. Please create an account to continue scanning menus.',
      };
    }

    return {
      canScan: true,
      scansRemaining,
      requiresSignup: false,
      message: scansRemaining === 1 
        ? 'This is your free trial scan. Create an account for unlimited scans!'
        : undefined,
    };
  }

  /**
   * Record a scan performed by trial user
   */
  async recordScan(): Promise<void> {
    if (!this.trialUsage) {
      await this.initialize();
    }

    const usage = this.trialUsage!;
    usage.scansPerformed += 1;

    // Mark trial as expired if limit reached
    if (usage.scansPerformed >= MAX_TRIAL_SCANS) {
      usage.trialExpired = true;
    }

    await this.saveTrialUsage();
    console.log(`Trial scan recorded. Total scans: ${usage.scansPerformed}/${MAX_TRIAL_SCANS}`);
  }

  /**
   * Get current trial usage statistics
   */
  async getTrialUsage(): Promise<TrialUsage | null> {
    if (!this.trialUsage) {
      await this.initialize();
    }
    return this.trialUsage;
  }

  /**
   * Reset trial (for testing purposes)
   */
  async resetTrial(): Promise<void> {
    this.trialUsage = {
      scansPerformed: 0,
      firstScanDate: new Date().toISOString(),
      trialExpired: false,
      deviceId: this.generateDeviceId(),
    };
    await this.saveTrialUsage();
    console.log('Trial usage reset');
  }

  /**
   * Mark trial as converted (user created account)
   */
  async convertTrial(): Promise<void> {
    if (this.trialUsage) {
      // Clear trial data since user now has an account
      await AsyncStorage.removeItem(TRIAL_STORAGE_KEY);
      this.trialUsage = null;
      console.log('Trial converted to full account');
    }
  }

  /**
   * Check if user is in trial mode
   */
  isTrialMode(): boolean {
    return this.trialUsage !== null && !this.trialUsage.trialExpired;
  }

  /**
   * Check if trial has expired
   */
  isTrialExpired(): boolean {
    return this.trialUsage?.trialExpired || false;
  }

  /**
   * Save trial usage to storage
   */
  private async saveTrialUsage(): Promise<void> {
    if (this.trialUsage) {
      try {
        await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(this.trialUsage));
      } catch (error) {
        console.error('Failed to save trial usage:', error);
      }
    }
  }

  /**
   * Generate a simple device ID for trial tracking
   */
  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const trialService = TrialService.getInstance();