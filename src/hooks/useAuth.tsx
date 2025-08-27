import React, {useState, useEffect, useContext, createContext, useCallback} from 'react';
import {User} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslationSafe} from './useTranslationSafe';
import {errorService} from '../services/errorService';
import {retryService} from '../services/retryService';
import {authService} from '../services/authService';
import {Platform} from 'react-native';
import 'react-native-get-random-values'; // Important for uuid on React Native
import { v4 as uuidv4 } from 'uuid';
import {STORAGE_KEYS} from '../constants';

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
          const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const device_name = `${Platform.OS}_${uuidv4()}`;
      await authService.login({ email, password, device_name });
      
      // Fetch user data after successful login
      const fetchedUser = await authService.fetchUserData(email);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(fetchedUser));
      setUser(fetchedUser);

      // Navigate to the main screen after successful login and data fetch

    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'login',
        action: 'user-login',
        email,
      });
      // Re-throw original error to surface backend message to UI
      throw (error instanceof Error ? error : new Error(t('auth.errors.invalidCredentials') as string));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      await errorService.logError(error as Error, {
        context: 'logout',
        action: 'user-logout',
        userId: user?.id,
      });
      throw new Error(t('auth.errors.logout') as string);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      const result = await retryService.executeWithRetry(
        async () => {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
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