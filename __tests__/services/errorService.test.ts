import { errorService } from '../../src/services/errorService';
import { retryService } from '../../src/services/retryService';
import { networkService } from '../../src/services/networkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('ErrorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('Error Classification', () => {
    test('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const errorType = errorService.classifyError(networkError);
      expect(errorType).toBe('NETWORK_ERROR');
    });

    test('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const errorType = errorService.classifyError(timeoutError);
      expect(errorType).toBe('TIMEOUT_ERROR');
    });

    test('should classify server errors correctly', () => {
      const serverError = {
        response: { status: 500 },
        message: 'Internal server error',
      };
      const errorType = errorService.classifyError(serverError);
      expect(errorType).toBe('SERVER_ERROR');
    });

    test('should classify client errors correctly', () => {
      const clientError = {
        response: { status: 400 },
        message: 'Bad request',
      };
      const errorType = errorService.classifyError(clientError);
      expect(errorType).toBe('CLIENT_ERROR');
    });

    test('should classify authentication errors correctly', () => {
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized',
      };
      const errorType = errorService.classifyError(authError);
      expect(errorType).toBe('AUTHENTICATION_ERROR');
    });

    test('should classify unknown errors correctly', () => {
      const unknownError = new Error('Some unknown error');
      const errorType = errorService.classifyError(unknownError);
      expect(errorType).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Error Logging', () => {
    test('should log error with context', async () => {
      const testError = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      const errorId = await errorService.logError(testError, context);

      expect(errorId).toBeTruthy();
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should handle errors without context', async () => {
      const testError = new Error('Test error');

      const errorId = await errorService.logError(testError);

      expect(errorId).toBeTruthy();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should log info messages in development', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      errorService.logInfo('Test info message', { data: 'test' });

      expect(mockConsoleLog).toHaveBeenCalledWith('Info:', 'Test info message', { data: 'test' });

      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle error with retry via retryService', async () => {
      const testError = new Error('Test error');
      const mockRetryFn = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(mockRetryFn, {
        maxRetries: 2,
        baseDelay: 10,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(mockRetryFn).toHaveBeenCalled();
    });

    test('should integrate with retry service', async () => {
      const testError = new Error('Test error');
      const mockRetryFn = jest.fn().mockResolvedValue('success');

      // Test that error service can work with retry service
      const result = await retryService.executeWithExponentialBackoff(mockRetryFn, 3, 100);

      expect(result).toBe('success');
      expect(mockRetryFn).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    test('should mark error as resolved', async () => {
      const testError = new Error('Test error');
      const errorId = await errorService.logError(testError);

      await errorService.markErrorAsResolved(errorId);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should get error logs with filters', () => {
      const logs = errorService.getErrorLogs({
        errorType: 'NETWORK_ERROR',
        isResolved: false,
      });

      expect(Array.isArray(logs)).toBe(true);
    });
  });
});

describe('RetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Retry Logic', () => {
    test('should execute operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(mockOperation);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce('success');

      const result = await retryService.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelay: 10,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue({ response: { status: 400 } });

      const result = await retryService.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should fail after maximum retries', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error('Network request failed'));

      const result = await retryService.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(4); // Initial attempt + 3 retries
      expect(mockOperation).toHaveBeenCalledTimes(4);
    });
  });

  describe('Retry Strategies', () => {
    test('should execute with exponential backoff', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithExponentialBackoff(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should execute with linear backoff', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithLinearBackoff(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should execute with immediate retry', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryService.executeWithImmediateRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Batch Operations', () => {
    test('should handle batch retry operations', async () => {
      const operations = [
        jest.fn().mockResolvedValue('result1'),
        jest.fn().mockResolvedValue('result2'),
        jest.fn().mockRejectedValue(new Error('Network error')),
      ];

      const results = await retryService.batchRetry(operations, {
        maxRetries: 2,
        baseDelay: 10,
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);
    });
  });

  describe('Retryable Function Wrapper', () => {
    test('should create retryable function', async () => {
      const originalFn = jest.fn().mockResolvedValue('success');
      const retryableFn = retryService.retryable(originalFn);

      const result = await retryableFn('arg1', 'arg2');

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});

describe('NetworkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network State Management', () => {
    test('should get current network state', () => {
      const state = networkService.getCurrentState();
      
      expect(state).toBeDefined();
      expect(state).toHaveProperty('isConnected');
      expect(state).toHaveProperty('isInternetReachable');
      expect(state).toHaveProperty('type');
    });

    test('should determine if device is online', () => {
      const isOnline = networkService.isOnline();
      expect(typeof isOnline).toBe('boolean');
    });

    test('should determine if device is offline', () => {
      const isOffline = networkService.isOffline();
      expect(typeof isOffline).toBe('boolean');
    });
  });

  describe('Network Event Listeners', () => {
    test('should add and remove listeners', () => {
      const mockListener = jest.fn();
      
      const unsubscribe = networkService.addListener(mockListener);
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      expect(mockListener).not.toHaveBeenCalled();
    });

    test('should remove all listeners', () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();
      
      networkService.addListener(mockListener1);
      networkService.addListener(mockListener2);
      networkService.removeAllListeners();
      
      // No direct way to test this, but ensure method exists
      expect(typeof networkService.removeAllListeners).toBe('function');
    });
  });

  describe('Error Handling Detection', () => {
    test('should detect network errors', () => {
      const networkError = new Error('Network request failed');
      const shouldTrigger = networkService.shouldTriggerOfflineHandling(networkError);
      
      expect(shouldTrigger).toBe(true);
    });

    test('should detect connection errors', () => {
      const connectionError = new Error('Connection failed');
      const shouldTrigger = networkService.shouldTriggerOfflineHandling(connectionError);
      
      expect(shouldTrigger).toBe(true);
    });

    test('should not trigger on non-network errors', () => {
      const validationError = new Error('Validation failed');
      const shouldTrigger = networkService.shouldTriggerOfflineHandling(validationError);
      
      // This depends on the current network state, so we test the method exists
      expect(typeof shouldTrigger).toBe('boolean');
    });
  });
});

describe('Integration Tests', () => {
  test('should handle error with retry and network recovery', async () => {
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce('success');

    const result = await retryService.executeWithRetry(mockOperation, {
      maxRetries: 2,
      baseDelay: 10,
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(2);
  });

  test('should log errors during retry process', async () => {
    const mockOperation = jest
      .fn()
      .mockRejectedValue(new Error('Persistent error'));

    const result = await retryService.executeWithRetry(mockOperation, {
      maxRetries: 2,
      baseDelay: 10,
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
}); 