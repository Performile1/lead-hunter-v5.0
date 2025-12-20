/**
 * Session Timeout Service
 * 
 * Handles automatic logout after 30 minutes of user inactivity.
 * Does NOT interrupt:
 * - Batch searches
 * - Deep analyses
 * - Cron jobs
 * - Background API calls
 */

export class SessionTimeoutService {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private onLogout: (() => void) | null = null;
  private onWarning: ((remainingSeconds: number) => void) | null = null;
  
  // 30 minutes in milliseconds
  private readonly TIMEOUT_DURATION = 30 * 60 * 1000;
  
  // Show warning 2 minutes before timeout
  private readonly WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000;
  
  // Track if background processes are running
  private backgroundProcesses = new Set<string>();
  
  // Events that count as user activity
  private readonly ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ];

  constructor() {
    this.lastActivityTime = Date.now();
  }

  /**
   * Initialize the session timeout service
   */
  public init(
    onLogout: () => void,
    onWarning?: (remainingSeconds: number) => void
  ): void {
    this.onLogout = onLogout;
    this.onWarning = onWarning || null;
    
    // Set up activity listeners
    this.setupActivityListeners();
    
    // Start the timeout
    this.resetTimeout();
    
    console.log('🕐 Session timeout service initialized (30 min inactivity)');
  }

  /**
   * Set up event listeners for user activity
   */
  private setupActivityListeners(): void {
    this.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    // Throttle activity updates to once per second
    const now = Date.now();
    if (now - this.lastActivityTime < 1000) {
      return;
    }
    
    this.lastActivityTime = now;
    this.resetTimeout();
  };

  /**
   * Reset the inactivity timeout
   */
  private resetTimeout(): void {
    // Clear existing timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Don't start timeout if background processes are running
    if (this.backgroundProcesses.size > 0) {
      console.log('⏸️ Session timeout paused - background processes running:', 
        Array.from(this.backgroundProcesses));
      return;
    }

    // Set warning timeout (28 minutes)
    const warningTime = this.TIMEOUT_DURATION - this.WARNING_BEFORE_TIMEOUT;
    this.warningTimeoutId = setTimeout(() => {
      if (this.onWarning) {
        this.onWarning(120); // 2 minutes remaining
      }
    }, warningTime);

    // Set logout timeout (30 minutes)
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    // Double-check no background processes are running
    if (this.backgroundProcesses.size > 0) {
      console.log('⏸️ Timeout prevented - background processes still running');
      this.resetTimeout();
      return;
    }

    console.log('⏰ Session timeout - logging out due to inactivity');
    
    if (this.onLogout) {
      this.onLogout();
    }
  }

  /**
   * Register a background process (prevents logout)
   */
  public registerBackgroundProcess(processId: string, processType: string): void {
    this.backgroundProcesses.add(processId);
    console.log(`🔄 Background process registered: ${processType} (${processId})`);
    console.log(`   Active processes: ${this.backgroundProcesses.size}`);
  }

  /**
   * Unregister a background process
   */
  public unregisterBackgroundProcess(processId: string): void {
    this.backgroundProcesses.delete(processId);
    console.log(`✅ Background process completed: ${processId}`);
    console.log(`   Active processes: ${this.backgroundProcesses.size}`);
    
    // If no more background processes, reset timeout
    if (this.backgroundProcesses.size === 0) {
      console.log('🔄 All background processes complete - resuming session timeout');
      this.resetTimeout();
    }
  }

  /**
   * Check if any background processes are running
   */
  public hasActiveBackgroundProcesses(): boolean {
    return this.backgroundProcesses.size > 0;
  }

  /**
   * Get remaining time until timeout (in seconds)
   */
  public getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    const remaining = this.TIMEOUT_DURATION - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Manually extend the session (e.g., user clicks "Stay logged in")
   */
  public extendSession(): void {
    console.log('⏰ Session extended by user');
    this.lastActivityTime = Date.now();
    this.resetTimeout();
  }

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    // Remove event listeners
    this.ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });

    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    this.backgroundProcesses.clear();
    console.log('🛑 Session timeout service destroyed');
  }

  /**
   * Get current activity status
   */
  public getStatus(): {
    lastActivity: Date;
    remainingSeconds: number;
    backgroundProcesses: number;
    isActive: boolean;
  } {
    return {
      lastActivity: new Date(this.lastActivityTime),
      remainingSeconds: this.getRemainingTime(),
      backgroundProcesses: this.backgroundProcesses.size,
      isActive: this.backgroundProcesses.size === 0
    };
  }
}

// Singleton instance
let sessionTimeoutInstance: SessionTimeoutService | null = null;

export const getSessionTimeoutService = (): SessionTimeoutService => {
  if (!sessionTimeoutInstance) {
    sessionTimeoutInstance = new SessionTimeoutService();
  }
  return sessionTimeoutInstance;
};

export const destroySessionTimeoutService = (): void => {
  if (sessionTimeoutInstance) {
    sessionTimeoutInstance.destroy();
    sessionTimeoutInstance = null;
  }
};
