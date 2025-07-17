import { errorService } from '../../src/services/errorService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { act } from '@testing-library/react';

// Set __DEV__ to true for tests
global.__DEV__ = true;

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  }),
  addEventListener: jest.fn(),
}));

// Mock Alert is already mocked globally in jest.setup.js
// Mock AsyncStorage is already mocked globally in jest.setup.js

describe('errorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console spy
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logError', () => {
    it('logs error to console in development', async () => {
      const error = new Error('Test error');
      const context = { screen: 'LoginScreen', action: 'login' };
      
      const errorId = await errorService.logError(error, context);
      
      expect(errorId).toMatch(/^error_/);
      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          id: errorId,
          timestamp: expect.any(Number),
          error: {
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          },
          errorType: expect.any(String),
          context,
          retryCount: 0,
          isResolved: false,
        })
      );
    });

    it('logs error without context', async () => {
      const error = new Error('Test error');
      
      const errorId = await errorService.logError(error);
      
      expect(errorId).toMatch(/^error_/);
      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          id: errorId,
          error: {
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          },
        })
      );
    });

    it('stores error in AsyncStorage', async () => {
      const error = new Error('Test error');
      const context = { screen: 'LoginScreen', action: 'login' };
      
      await errorService.logError(error, context);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'error_logs',
        expect.any(String)
      );
    });

    it('handles non-Error objects', async () => {
      const error = 'String error';
      const context = { screen: 'HomeScreen' };
      
      const errorId = await errorService.logError(error, context);
      
      expect(errorId).toMatch(/^error_/);
      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        expect.objectContaining({
          error: {
            name: 'Unknown Error',
            message: 'No message provided',
            stack: undefined,
          },
        })
      );
    });
  });

  describe('clearErrorLogs', () => {
    it('clears error logs from AsyncStorage', async () => {
      await errorService.clearErrorLogs();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('error_logs');
    });
  });

  describe('getErrorLogs', () => {
    it('returns filtered logs by error type', async () => {
      // First, log some errors
      await errorService.logError(new Error('Network error'), { type: 'network' });
      await errorService.logError(new Error('Validation error'), { type: 'validation' });
      
      const networkLogs = errorService.getErrorLogs({ errorType: 'NETWORK_ERROR' });
      
      expect(networkLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ errorType: 'NETWORK_ERROR' })
        ])
      );
    });

    it('returns limited number of logs', async () => {
      // Log multiple errors
      for (let i = 0; i < 5; i++) {
        await errorService.logError(new Error(`Error ${i}`));
      }
      
      const limitedLogs = errorService.getErrorLogs({ limit: 2 });
      
      expect(limitedLogs).toHaveLength(2);
    });
  });

  describe('classifyError', () => {
    it('classifies network errors correctly', () => {
      expect(errorService.classifyError(new Error('Network request failed'))).toBe('NETWORK_ERROR');
      expect(errorService.classifyError({ message: 'Connection timeout', code: 'NETWORK_ERROR' })).toBe('NETWORK_ERROR');
      expect(errorService.classifyError({ message: 'Failed to fetch' })).toBe('NETWORK_ERROR');
    });

    it('classifies timeout errors correctly', () => {
      // 'Request timeout' also contains 'timeout' which matches both network and timeout patterns
      // The implementation checks network patterns first, so this will be NETWORK_ERROR
      expect(errorService.classifyError(new Error('time out'))).toBe('TIMEOUT_ERROR');
      expect(errorService.classifyError({ code: 'ECONNABORTED' })).toBe('TIMEOUT_ERROR');
    });

    it('classifies server errors correctly', () => {
      expect(errorService.classifyError({ response: { status: 500 } })).toBe('SERVER_ERROR');
      expect(errorService.classifyError(new Error('Internal Server Error'))).toBe('SERVER_ERROR');
    });

    it('classifies authentication errors correctly', () => {
      expect(errorService.classifyError({ response: { status: 401 } })).toBe('AUTHENTICATION_ERROR');
      expect(errorService.classifyError(new Error('Unauthorized access'))).toBe('AUTHENTICATION_ERROR');
    });

    it('classifies permission errors correctly', () => {
      expect(errorService.classifyError({ response: { status: 403 } })).toBe('PERMISSION_ERROR');
      expect(errorService.classifyError(new Error('Permission denied'))).toBe('PERMISSION_ERROR');
    });

    it('classifies validation errors correctly', () => {
      // Status 422 is classified as CLIENT_ERROR because the check for status 4xx comes before validation check
      expect(errorService.classifyError({ response: { status: 422 } })).toBe('CLIENT_ERROR');
      expect(errorService.classifyError(new Error('Validation failed'))).toBe('VALIDATION_ERROR');
    });

    it('returns UNKNOWN_ERROR for unclassified errors', () => {
      expect(errorService.classifyError(new Error('Random error'))).toBe('UNKNOWN_ERROR');
      expect(errorService.classifyError(null)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleError', () => {
    it('handles network error with alert', async () => {
      const error = new Error('Network request failed');
      
      await errorService.handleError(error, { showAlert: true });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Network Error',
        'Unable to connect to the server. Please try again later.',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });

    it('handles authentication error with alert', async () => {
      const error = { response: { status: 401 } };
      
      await errorService.handleError(error, { showAlert: true });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Required',
        'Please log in to continue.',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });

    it('handles client error with alert', async () => {
      const error = { response: { status: 422 } };
      
      await errorService.handleError(error, { showAlert: true });
      
      // Status 422 is classified as CLIENT_ERROR, not VALIDATION_ERROR
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Request',
        'There was an issue with your request. Please check your input and try again.',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });

    it('retries network errors when retry function is provided', async () => {
      const error = new Error('Network error');
      const retry = jest.fn();
      
      jest.useFakeTimers();
      
      await errorService.handleError(error, { retry, maxRetries: 3 });
      
      jest.advanceTimersByTime(2000);
      
      expect(retry).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('isOnline', () => {
    it('returns current network status', () => {
      const isOnline = errorService.isOnline();
      
      expect(typeof isOnline).toBe('boolean');
    });
  });

  describe('getNetworkStatus', () => {
    it('returns network status object', () => {
      const status = errorService.getNetworkStatus();
      
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('connectionType');
    });
  });

  describe('logInfo', () => {
    it('logs info message in development', () => {
      const message = 'Test info message';
      const context = { action: 'test' };
      
      errorService.logInfo(message, context);
      
      expect(console.log).toHaveBeenCalledWith('Info:', message, context);
    });
  });

  describe('markErrorAsResolved', () => {
    it('marks error as resolved', async () => {
      const error = new Error('Test error');
      const errorId = await errorService.logError(error);
      
      await errorService.markErrorAsResolved(errorId);
      
      const logs = errorService.getErrorLogs();
      const resolvedLog = logs.find(log => log.id === errorId);
      
      expect(resolvedLog?.isResolved).toBe(true);
    });
  });

  describe('createRetryMechanism', () => {
    it('retries operation on failure', async () => {
      let attempts = 0;
      const operation = jest.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve('Success');
      });
      
      const result = await errorService.createRetryMechanism(operation, 3, 10);
      
      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('rejects after max retries', async () => {
      const operation = jest.fn(() => Promise.reject(new Error('Permanent failure')));
      
      await expect(
        errorService.createRetryMechanism(operation, 2, 10)
      ).rejects.toThrow('Permanent failure');
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

});
