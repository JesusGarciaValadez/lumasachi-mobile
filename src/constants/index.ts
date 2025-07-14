// API Constants
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api' 
  : 'https://your-production-api.com/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    UPDATE: '/orders',
    DELETE: '/orders',
    TIMELINE: '/orders/timeline',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FF9800',
  INFO: '#2196F3',
  LIGHT: '#F5F5F5',
  DARK: '#212121',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
} as const;

// Sizes
export const SIZES = {
  SMALL: 8,
  MEDIUM: 16,
  LARGE: 24,
  XLARGE: 32,
} as const;

// Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
}

export const USER_ROLES = {
  SUPER_ADMIN: { key: UserRole.SUPER_ADMIN, displayName: 'Super Administrator' },
  ADMIN: { key: UserRole.ADMIN, displayName: 'Administrator' },
  EMPLOYEE: { key: UserRole.EMPLOYEE, displayName: 'Employee' },
  CUSTOMER: { key: UserRole.CUSTOMER, displayName: 'Customer' },
} as const;

// Order Statuses
export const ORDER_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERED: 'Delivered',
  PAID: 'Paid',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
} as const;

// Publishing Statuses
export const PUBLISHING_STATUSES = {
  DRAFT: 'Draft',
  READY_FOR_REVIEW: 'Ready For Review',
  NEEDS_EDITING: 'Needs Editing',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  DELETED: 'Deleted',
} as const; 