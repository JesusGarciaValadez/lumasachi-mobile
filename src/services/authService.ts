import { httpClient } from '../utils/httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { AxiosError } from 'axios';
import { User, UserRole } from '../types';

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

// API response for GET /v1/user/{email}
interface BackendUserResponse {
  user_id: number;
  user_found: boolean;
  user_data?: {
    id: number;
    company_id?: string | null;
    first_name: string;
    last_name: string;
    email: string;
    role: string; // e.g. "Employee", "Super Administrator"
    phone_number?: string | null;
    is_active: boolean;
    notes?: string | null;
    type?: string | null;
    preferences?: unknown | null;
    created_at?: string;
    updated_at?: string;
  };
  user_exists?: boolean;
  all_attributes?: Record<string, unknown>;
}

const toUserRole = (role: string): User['role'] => {
  // Match enum string values defined in UserRole
  switch ((role || '').toLowerCase()) {
    case 'super administrator':
    case 'super_administrator':
    case 'super-administrator':
      return UserRole.SUPER_ADMINISTRATOR;
    case 'administrator':
      return UserRole.ADMINISTRATOR;
    case 'employee':
      return UserRole.EMPLOYEE;
    case 'customer':
      return UserRole.CUSTOMER;
    default:
      return UserRole.EMPLOYEE;
  }
};

const mapBackendToUser = (payload: BackendUserResponse): User => {
  const data = payload.user_data;
  if (!payload.user_found || !data) {
    throw new Error('User not found');
  }

  return {
    id: String(data.id),
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    role: toUserRole(String(data.role || '')),
    company: data.company_id || undefined,
    phoneNumber: data.phone_number || undefined,
    address: undefined,
    isActive: Boolean(data.is_active),
    lastLoginAt: undefined,
    languagePreference: 'es',
    customerNotes: undefined,
    customerType: undefined,
    customerPreferences: undefined,
    isCustomer: undefined,
    isEmployee: undefined,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
  };
};

const fetchUserData = async (email: string): Promise<User> => {
  try {
    const response = await httpClient.get<BackendUserResponse>(
      `${API_ENDPOINTS.USERS.PROFILE}/${encodeURIComponent(email)}`
    );
    return mapBackendToUser(response.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const data = error.response.data as any;
      const message = data?.message || 'Failed to fetch user data';
      const errors = data?.errors || undefined;
      let errorMessage = message;
      if (errors) {
        const parts: string[] = [];
        Object.keys(errors).forEach((key) => {
          const msgs = Array.isArray(errors[key]) ? errors[key] : [String(errors[key])];
          parts.push(msgs.join(', '));
        });
        if (parts.length) {
          errorMessage = `${message}\n${parts.join('\n')}`;
        }
      }
      throw new Error(String(errorMessage).trim());
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
