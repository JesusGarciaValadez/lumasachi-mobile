import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

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
    executeWithRetry: jest.fn().mockImplementation(async (fn) => {
      try {
        const result = await fn();
        return { success: true, result, error: null };
      } catch (error) {
        return { success: false, result: null, error };
      }
    }),
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
    i18n: { language: 'en' },
  }),
}));

// Import after mocks
import { useAuth, AuthProvider } from '../../src/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('useAuth minimal test - fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with loading state and resolve to null user', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Run all timers to process the async initialization
    await act(async () => {
      jest.runAllTimers();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 1000 });

    // After loading, user should still be null (no stored user)
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  }, 10000);

  it('should handle login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'auth.mockUser.firstName',
      lastName: 'auth.mockUser.lastName',
      role: 'ADMINISTRATOR',
      company: 'auth.mockUser.company',
      phoneNumber: 'auth.mockUser.phoneNumber',
      address: 'auth.mockUser.address',
      isActive: true,
      languagePreference: 'en',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      lastLoginAt: expect.any(Date),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Run all timers to process the async initialization
    await act(async () => {
      jest.runAllTimers();
    });
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Perform login
    await act(async () => {
      const loginPromise = result.current.login('test@example.com', 'password');
      jest.runAllTimers();
      await loginPromise;
    });

    // After login, user should be set
    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Verify AsyncStorage was called
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'user',
      expect.stringContaining('test@example.com')
    );
  }, 10000);
});
