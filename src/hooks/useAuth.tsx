import React, {useState, useEffect, useContext, createContext, useCallback} from 'react';
import {User, UserRole} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslationSafe} from './useTranslationSafe';
import {errorService} from '../services/errorService';
import {retryService} from '../services/retryService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback to English since translations might not be available outside AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {t} = useTranslationSafe();

  const loadUserFromStorage = useCallback(async () => {
    try {
      const result = await retryService.executeWithRetry(
        async () => {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            return JSON.parse(storedUser);
          }
          return null;
        },
        {
          maxRetries: 3,
          baseDelay: 500,
        }
      );

      if (result.success && result.result) {
        setUser(result.result);
      }
    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'loadUserFromStorage',
        action: 'load-user-from-storage',
      });
      // console.error(t('auth.errors.storageLoad'), error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      const result = await retryService.executeWithRetry(
        async () => {
          // Login simulation - in production this would be an API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock user for testing
          const mockUser: User = {
            id: '1',
            firstName: t('auth.mockUser.firstName') as string,
            lastName: t('auth.mockUser.lastName') as string,
            email: email,
            role: UserRole.ADMINISTRATOR,
            company: t('auth.mockUser.company') as string,
            phoneNumber: t('auth.mockUser.phoneNumber') as string,
            address: t('auth.mockUser.address') as string,
            isActive: true,
            languagePreference: 'en',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
          };

          // Save user to storage
          await AsyncStorage.setItem('user', JSON.stringify(mockUser));
          return mockUser;
        },
        {
          maxRetries: 2,
          baseDelay: 1000,
        }
      );

      if (result.success && result.result) {
        setUser(result.result);
      } else {
        throw result.error || new Error(t('auth.errors.invalidCredentials') as string);
      }
    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'login',
        action: 'user-login',
        email,
      });
      throw new Error(t('auth.errors.invalidCredentials') as string);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      const result = await retryService.executeWithRetry(
        async () => {
          await AsyncStorage.removeItem('user');
          // Small delay to allow React Navigation to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));
          return true;
        },
        {
          maxRetries: 3,
          baseDelay: 500,
        }
      );

      if (result.success) {
        setUser(null);
      } else {
        throw result.error || new Error('Logout failed');
      }
    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'logout',
        action: 'user-logout',
        userId: user?.id,
      });
      // console.error(t('auth.errors.logout'), error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      const result = await retryService.executeWithRetry(
        async () => {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          return true;
        },
        {
          maxRetries: 3,
          baseDelay: 500,
        }
      );

      if (!result.success) {
        throw result.error || new Error('Failed to update user in storage');
      }
    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'updateUser',
        action: 'update-user-storage',
        userId: updatedUser.id,
      });
      // console.error(t('auth.errors.storageUpdate'), error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 