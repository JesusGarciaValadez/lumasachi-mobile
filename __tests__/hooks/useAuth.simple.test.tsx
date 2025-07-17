import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

// Unmock useAuth to test the real implementation
jest.unmock('../../src/hooks/useAuth');

// Mock services
jest.mock('../../src/services/errorService', () => ({
  errorService: {
    logError: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../src/services/retryService', () => ({
  retryService: {
    executeWithRetry: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
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
import { retryService } from '../../src/services/retryService';

const mockRetryService = retryService as jest.Mocked<typeof retryService>;

// Simple wrapper without extra providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should initialize with null user when no stored data', async () => {
    // Set up controlled promise resolution
    let resolveRetry: (value: any) => void;
    const retryPromise = new Promise((resolve) => {
      resolveRetry = resolve;
    });
    
    mockRetryService.executeWithRetry.mockReturnValue(retryPromise);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Initial state should have loading true
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    
    // Resolve the retry service promise
    await act(async () => {
      resolveRetry!({
        success: true,
        result: null,
        error: null,
      });
      // Wait for React to process the update
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle login correctly', async () => {
    // Set up controlled promise resolution for initial load
    let resolveInitialRetry: (value: any) => void;
    const initialRetryPromise = new Promise((resolve) => {
      resolveInitialRetry = resolve;
    });
    
    mockRetryService.executeWithRetry.mockReturnValueOnce(initialRetryPromise);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Resolve initial loading
    await act(async () => {
      resolveInitialRetry!({
        success: true,
        result: null,
        error: null,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Now mock login behavior
    mockRetryService.executeWithRetry.mockImplementation(async (fn) => {
      const result = await fn();
      return {
        success: true,
        result,
        error: null,
      };
    });
    
    // Perform login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    // Verify login worked
    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle logout correctly', async () => {
    // Set up controlled promise resolution for initial load with user
    let resolveInitialRetry: (value: any) => void;
    const initialRetryPromise = new Promise((resolve) => {
      resolveInitialRetry = resolve;
    });
    
    mockRetryService.executeWithRetry.mockReturnValueOnce(initialRetryPromise);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Resolve initial loading with a user
    await act(async () => {
      resolveInitialRetry!({
        success: true,
        result: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        error: null,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // User should be loaded
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
    
    // Now mock logout behavior
    mockRetryService.executeWithRetry.mockImplementation(async (fn) => {
      const result = await fn();
      return {
        success: true,
        result,
        error: null,
      };
    });
    
    // Perform logout
    await act(async () => {
      await result.current.logout();
    });
    
    // Verify logout worked
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
