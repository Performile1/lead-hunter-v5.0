/**
 * Request Queue Manager
 * Prevents API quota exhaustion by queuing and rate-limiting requests
 */

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  service: string;
  retries: number;
  maxRetries: number;
}

interface ServiceLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  concurrentRequests: number;
  minDelay: number; // Minimum delay between requests in ms
}

class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private serviceCounters: Map<string, { minute: number; hour: number; lastReset: number }> = new Map();
  private activeRequests: Map<string, number> = new Map();
  
  // Service-specific limits
  private serviceLimits: Map<string, ServiceLimits> = new Map([
    ['gemini', {
      requestsPerMinute: 15,
      requestsPerHour: 1500,
      concurrentRequests: 3,
      minDelay: 2000 // 2 seconds between requests
    }],
    ['groq', {
      requestsPerMinute: 30,
      requestsPerHour: 14400,
      concurrentRequests: 5,
      minDelay: 1000
    }],
    ['deepseek', {
      requestsPerMinute: 20,
      requestsPerHour: 3000,
      concurrentRequests: 3,
      minDelay: 1500
    }],
    ['firecrawl', {
      requestsPerMinute: 10,
      requestsPerHour: 500,
      concurrentRequests: 2,
      minDelay: 3000
    }],
    ['octoparse', {
      requestsPerMinute: 5,
      requestsPerHour: 100,
      concurrentRequests: 1,
      minDelay: 5000
    }],
    ['allabolag', {
      requestsPerMinute: 10,
      requestsPerHour: 200,
      concurrentRequests: 2,
      minDelay: 3000
    }],
    ['ratsit', {
      requestsPerMinute: 20,
      requestsPerHour: 1000,
      concurrentRequests: 3,
      minDelay: 2000
    }],
    ['hunter', {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      concurrentRequests: 2,
      minDelay: 3000
    }],
    ['newsapi', {
      requestsPerMinute: 5,
      requestsPerHour: 100,
      concurrentRequests: 1,
      minDelay: 5000
    }]
  ]);

  /**
   * Add request to queue
   */
  async enqueue<T>(
    fn: () => Promise<T>,
    service: string,
    priority: number = 5,
    maxRetries: number = 3
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${service}-${Date.now()}-${Math.random()}`,
        fn,
        resolve,
        reject,
        priority,
        service,
        retries: 0,
        maxRetries
      };

      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

      console.log(`📥 Queued ${service} request (Queue size: ${this.queue.length})`);

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      
      // Check if we can process this request
      if (!this.canProcessRequest(request.service)) {
        console.log(`⏸️ Rate limit reached for ${request.service}, waiting...`);
        await this.delay(5000); // Wait 5 seconds before checking again
        continue;
      }

      // Remove from queue
      this.queue.shift();

      // Process request
      await this.executeRequest(request);

      // Get service limits
      const limits = this.serviceLimits.get(request.service);
      const minDelay = limits?.minDelay || 1000;

      // Wait minimum delay before next request
      await this.delay(minDelay);
    }

    this.processing = false;
  }

  /**
   * Check if we can process a request for this service
   */
  private canProcessRequest(service: string): boolean {
    const limits = this.serviceLimits.get(service);
    if (!limits) return true; // No limits defined, allow

    // Initialize counters if not exists
    if (!this.serviceCounters.has(service)) {
      this.serviceCounters.set(service, {
        minute: 0,
        hour: 0,
        lastReset: Date.now()
      });
    }

    const counters = this.serviceCounters.get(service)!;
    const now = Date.now();

    // Reset counters if needed
    if (now - counters.lastReset > 60000) { // 1 minute
      counters.minute = 0;
      counters.lastReset = now;
    }
    if (now - counters.lastReset > 3600000) { // 1 hour
      counters.hour = 0;
    }

    // Check concurrent requests
    const activeCount = this.activeRequests.get(service) || 0;
    if (activeCount >= limits.concurrentRequests) {
      return false;
    }

    // Check rate limits
    if (counters.minute >= limits.requestsPerMinute) {
      return false;
    }
    if (counters.hour >= limits.requestsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Execute a request with retry logic
   */
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const limits = this.serviceLimits.get(request.service);
    
    // Increment active requests
    const activeCount = this.activeRequests.get(request.service) || 0;
    this.activeRequests.set(request.service, activeCount + 1);

    // Increment counters
    const counters = this.serviceCounters.get(request.service);
    if (counters) {
      counters.minute++;
      counters.hour++;
    }

    try {
      console.log(`🚀 Executing ${request.service} request (${request.retries}/${request.maxRetries})`);
      
      const result = await request.fn();
      request.resolve(result);
      
      console.log(`✅ ${request.service} request completed`);
    } catch (error: any) {
      console.error(`❌ ${request.service} request failed:`, error.message);

      // Check if it's a quota/rate limit error
      const isQuotaError = 
        error.message?.includes('QUOTA') ||
        error.message?.includes('429') ||
        error.message?.includes('rate_limit') ||
        error.message?.includes('exhausted');

      if (isQuotaError) {
        console.warn(`🚨 Quota error for ${request.service}`);
        
        // If we have retries left, re-queue with exponential backoff
        if (request.retries < request.maxRetries) {
          request.retries++;
          const backoffDelay = Math.min(30000, 5000 * Math.pow(2, request.retries)); // Max 30s
          
          console.log(`🔄 Re-queuing ${request.service} after ${backoffDelay}ms (retry ${request.retries}/${request.maxRetries})`);
          
          await this.delay(backoffDelay);
          this.queue.unshift(request); // Add to front of queue with lower priority
        } else {
          request.reject(new Error(`${request.service} quota exhausted after ${request.maxRetries} retries`));
        }
      } else {
        // Non-quota error, reject immediately
        request.reject(error);
      }
    } finally {
      // Decrement active requests
      const activeCount = this.activeRequests.get(request.service) || 0;
      this.activeRequests.set(request.service, Math.max(0, activeCount - 1));
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    processing: boolean;
    serviceStats: Array<{
      service: string;
      active: number;
      minuteCount: number;
      hourCount: number;
    }>;
  } {
    const serviceStats = Array.from(this.serviceCounters.entries()).map(([service, counters]) => ({
      service,
      active: this.activeRequests.get(service) || 0,
      minuteCount: counters.minute,
      hourCount: counters.hour
    }));

    return {
      queueSize: this.queue.length,
      processing: this.processing,
      serviceStats
    };
  }

  /**
   * Clear queue (emergency stop)
   */
  clearQueue(): void {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    console.log('🧹 Queue cleared');
  }

  /**
   * Update service limits dynamically
   */
  updateServiceLimits(service: string, limits: Partial<ServiceLimits>): void {
    const current = this.serviceLimits.get(service) || {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      concurrentRequests: 1,
      minDelay: 1000
    };

    this.serviceLimits.set(service, { ...current, ...limits });
    console.log(`⚙️ Updated limits for ${service}:`, { ...current, ...limits });
  }
}

// Singleton instance
export const requestQueue = new RequestQueueManager();

/**
 * Wrapper function to queue API requests
 */
export async function queueRequest<T>(
  fn: () => Promise<T>,
  service: string,
  priority: number = 5,
  maxRetries: number = 3
): Promise<T> {
  return requestQueue.enqueue(fn, service, priority, maxRetries);
}

/**
 * Get queue status
 */
export function getQueueStatus() {
  return requestQueue.getStatus();
}

/**
 * Clear all queued requests
 */
export function clearQueue() {
  requestQueue.clearQueue();
}

/**
 * Update service rate limits
 */
export function updateServiceLimits(service: string, limits: Partial<ServiceLimits>) {
  requestQueue.updateServiceLimits(service, limits);
}
