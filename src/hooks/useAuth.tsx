import React, {useState, useEffect, useContext, createContext, useCallback} from 'react';
import {User, UserRole} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslationSafe} from './useTranslationSafe';

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
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error(t('auth.errors.storageLoad'), error);
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
      };

      setUser(mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error(t('auth.errors.invalidCredentials') as string);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem('user');
      
      // Small delay to allow React Navigation to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setUser(null);
    } catch (error) {
      console.error(t('auth.errors.logout'), error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error(t('auth.errors.storageUpdate'), error);
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