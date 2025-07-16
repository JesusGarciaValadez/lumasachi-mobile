import { errorService } from './errorService';
import { networkService } from './networkService';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryService {
  private static instance: RetryService;
  
  private defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: (error) => this.isRetryableError(error),
  };

  private constructor() {}

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      attempts = attempt + 1;
      
      try {
        // For network operations, wait for connection if offline
        if (networkService.isOffline()) {
          const connected = await networkService.waitForConnection(10000);
          if (!connected) {
            throw new Error('No network connection available');
          }
        }

        const result = await operation();
        
        return {
          success: true,
          result,
          attempts,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        if (!opts.retryCondition?.(error)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === opts.maxRetries) {
          break;
        }

        // Call onRetry callback if provided
        opts.onRetry?.(error, attempt + 1);

        // Log retry attempt
        await errorService.logError(lastError, {
          retryAttempt: attempt + 1,
          maxRetries: opts.maxRetries,
          isRetrying: true,
        });

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, opts);
        await this.sleep(delay);
      }
    }

    // Log final failure
    if (lastError) {
      await errorService.logError(lastError, {
        totalAttempts: attempts,
        maxRetries: opts.maxRetries,
        finalFailure: true,
      });
    }

    return {
      success: false,
      error: lastError || new Error('Unknown error'),
      attempts,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Execute operation with exponential backoff
   */
  async executeWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    const options: RetryOptions = {
      maxRetries,
      baseDelay: initialDelay,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: (error) => this.isRetryableError(error),
    };

    const result = await this.executeWithRetry(operation, options);
    
    if (result.success && result.result !== undefined) {
      return result.result;
    }
    
    throw result.error || new Error('Operation failed after retries');
  }

  /**
   * Execute operation with linear backoff
   */
  async executeWithLinearBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    const options: RetryOptions = {
      maxRetries,
      baseDelay: delay,
      maxDelay: delay * maxRetries,
      backoffFactor: 1,
      jitter: false,
      retryCondition: (error) => this.isRetryableError(error),
    };

    const result = await this.executeWithRetry(operation, options);
    
    if (result.success && result.result !== undefined) {
      return result.result;
    }
    
    throw result.error || new Error('Operation failed after retries');
  }

  /**
   * Execute operation with immediate retry
   */
  async executeWithImmediateRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const options: RetryOptions = {
      maxRetries,
      baseDelay: 0,
      maxDelay: 0,
      backoffFactor: 1,
      jitter: false,
      retryCondition: (error) => this.isRetryableError(error),
    };

    const result = await this.executeWithRetry(operation, options);
    
    if (result.success && result.result !== undefined) {
      return result.result;
    }
    
    throw result.error || new Error('Operation failed after retries');
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are generally retryable
    if (networkService.shouldTriggerOfflineHandling(error)) {
      return true;
    }

    // Timeout errors are retryable
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return true;
    }

    // Server errors (5xx) are retryable
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }

    // Rate limit errors are retryable
    if (error.response?.status === 429) {
      return true;
    }

    // Don't retry client errors (4xx, except 429)
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      return false;
    }

    // Don't retry authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffFactor, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, options.maxDelay);
    
    // Apply jitter if enabled
    if (options.jitter) {
      const jitterValue = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterValue;
    }
    
    return Math.max(0, delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retryable version of a function
   */
  retryable<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: Partial<RetryOptions> = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      return this.executeWithRetry(
        () => fn(...args),
        options
      );
    }) as T;
  }

  /**
   * Batch retry multiple operations
   */
  async batchRetry<T>(
    operations: Array<() => Promise<T>>,
    options: Partial<RetryOptions> = {}
  ): Promise<Array<RetryResult<T>>> {
    const results = await Promise.all(
      operations.map(operation => 
        this.executeWithRetry(operation, options)
      )
    );

    return results;
  }
}

export const retryService = RetryService.getInstance(); 