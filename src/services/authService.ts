import { httpClient } from '../utils/httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { AxiosError } from 'axios';
import { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
  device_name: string;
}

const login = async (credentials: LoginCredentials): Promise<string> => {
  const { email, password, device_name } = credentials;

  try {
    const response = await httpClient.post<string>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password, device_name },
      {
        headers: {
          'Accept': 'application/json'
        },
      }
    );
    console.log(response.data);

    const token = response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    return token;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const data = error.response.data as any;
      const { message, errors } = data || {};
      const status = error.response.status;
      let errorMessage = message || 'Invalid credentials';

      if (errors) {
        const parts: string[] = [];
        Object.keys(errors).forEach((key) => {
          const msgs = Array.isArray(errors[key]) ? errors[key] : [String(errors[key])];
          parts.push(msgs.join(', '));
        });
        if (parts.length) {
          errorMessage = parts.join('\n');
        }
      }

      const err = new Error(String(errorMessage).trim());
      (err as any).status = status;
      (err as any).errors = errors || {};
      (err as any).serverMessage = message || '';
      const lower = String(message || errorMessage).toLowerCase();
      if ((status === 401 || status === 422) && (lower.includes('credential') || lower.includes('incorrect'))) {
        (err as any).code = 'INVALID_CREDENTIALS';
      }
      throw err;
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred during login.');
    }
  }
};

const fetchUserData = async (email: string): Promise<User> => {
  try {
    const response = await httpClient.get<User>(
      `${API_ENDPOINTS.USERS.PROFILE}/${email}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const { message, errors } = error.response.data;
      let errorMessage = message;

      if (errors) {
        errorMessage += '\n';
        for (const key in errors) {
          errorMessage += `${errors[key].join(', ')}\n`;
        }
      }
      throw new Error(errorMessage.trim());
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unknown error occurred while fetching user data.');
    }
  }
};

const logout = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN, // Assuming refresh token might be used later
    STORAGE_KEYS.USER_DATA,
  ]);
  // No API call for logout as per cURL, only local state clear
};

const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const authService = {
  login,
  logout,
  getAuthToken,
  fetchUserData,
}; 
