import React from 'react';
import { renderHook, RenderHookOptions } from '@testing-library/react-native';
// import { QueryTestProvider, createTestQueryClient } from './testProviders';

// Custom renderHook function that includes providers
export const renderHookWithProviders = (
  callback: (props: any) => any,
  options?: RenderHookOptions<any>
) => {
  // Temporarily disabled until QueryTestProvider is available
  return renderHook(callback, options);
};

// Utility to wait for hook updates
export const waitForHookToUpdate = (callback: () => void, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Hook update timed out'));
    }, timeout);

    const interval = setInterval(() => {
      try {
        callback();
        clearInterval(interval);
        clearTimeout(timer);
        resolve();
      } catch (error) {
        // Keep waiting
      }
    }, 10);
  });
};

// Mock async storage utilities
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
};

// Mock network info utilities
export const mockNetworkInfo = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
  details: {
    isConnectionExpensive: false,
    cellularGeneration: null,
    carrier: null,
  },
};

// Mock axios instance for testing
export const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Helper to create mock promises
export const createMockPromise = <T>(
  data: T,
  shouldReject = false,
  delay = 0
): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldReject) {
        reject(new Error('Mock error'));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

// Helper to create mock API responses
export const createMockApiResponse = <T>(
  data: T,
  status = 200,
  statusText = 'OK'
) => ({
  data,
  status,
  statusText,
  headers: {},
  config: {},
});

// Helper to create mock API errors
export const createMockApiError = (
  message = 'API Error',
  status = 500,
  code = 'UNKNOWN_ERROR'
) => ({
  message,
  response: {
    status,
    data: {
      message,
      code,
    },
  },
  isAxiosError: true,
});

// Helper to test hook loading states
export const testHookLoadingStates = async (
  hook: any,
  expectedStates: Array<'loading' | 'error' | 'success'>
) => {
  for (const state of expectedStates) {
    if (state === 'loading') {
      expect(hook.result.current.isLoading).toBe(true);
    } else if (state === 'error') {
      expect(hook.result.current.isError).toBe(true);
    } else if (state === 'success') {
      expect(hook.result.current.isSuccess).toBe(true);
    }
    
    await hook.waitForNextUpdate();
  }
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  Object.values(mockAsyncStorage).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
  Object.values(mockAxios).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}; 