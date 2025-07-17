import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import HomeScreen from '../../src/screens/HomeScreen';
import { mockAuthService } from '../mocks';
import { mockUsers } from '../utils/mockData';
import i18n from '../../src/i18n';

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  reset: mockReset,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
}));

// Mock hooks
const mockLogin = jest.fn();
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    logout: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

jest.mock('../../src/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOffline: false,
    isConnected: true,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockResolvedValue(undefined);
});

describe('Integration: Auth Flow', () => {
  it('should handle login correctly', async () => {
    const { getByTestId } = render(
      <LoginScreen />
    );

    // Fill in login form
    fireEvent.changeText(getByTestId('login-email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('login-password-input'), 'password123');
    
    // Submit form
    fireEvent.press(getByTestId('login-submit-button'));

    // Verify login was called with correct credentials
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
