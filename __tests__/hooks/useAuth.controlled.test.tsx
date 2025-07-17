import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// Unmock useAuth to test the real implementation
jest.unmock('../../src/hooks/useAuth');

// Create controlled mocks
let mockLogError: jest.Mock;
let mockExecuteWithRetry: jest.Mock;
let mockGetItem: jest.Mock;

// Mock services
jest.mock('../../src/services/errorService', () => ({
  errorService: {
    get logError() {
      return mockLogError;
    },
  },
}));

jest.mock('../../src/services/retryService', () => ({
  retryService: {
    get executeWithRetry() {
      return mockExecuteWithRetry;
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    get getItem() {
      return mockGetItem;
    },
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock translation hook
jest.mock('../../src/hooks/useTranslationSafe', () => ({
  useTranslationSafe: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
    },
  }),
}));

// Import after mocks
import { useAuth, AuthProvider } from '../../src/hooks/useAuth';

describe('useAuth controlled test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    
    // Setup default mocks
    mockLogError = jest.fn().mockResolvedValue(undefined);
    mockGetItem = jest.fn().mockResolvedValue(null);
    
    // Create a controlled executeWithRetry that we can manually resolve
    mockExecuteWithRetry = jest.fn();
  });

  it('should update loading state when retryService resolves', async () => {
    let resolveRetry: (value: any) => void;
    const retryPromise = new Promise((resolve) => {
      resolveRetry = resolve;
    });
    
    mockExecuteWithRetry.mockReturnValue(retryPromise);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    expect(mockExecuteWithRetry).toHaveBeenCalled();
    
    // Manually resolve the retry service
    await act(async () => {
      resolveRetry!({
        success: true,
        result: null,
        error: null,
      });
      // Wait for React to process the update
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Now loading should be false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle error case', async () => {
    let resolveRetry: (value: any) => void;
    const retryPromise = new Promise((resolve) => {
      resolveRetry = resolve;
    });
    
    mockExecuteWithRetry.mockReturnValue(retryPromise);
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Manually resolve with error
    await act(async () => {
      resolveRetry!({
        success: false,
        result: null,
        error: new Error('Test error'),
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Loading should still be false even with error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockLogError).not.toHaveBeenCalled(); // Error is caught in try-catch
  });
});
