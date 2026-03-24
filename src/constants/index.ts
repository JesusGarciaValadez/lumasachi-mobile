import { UserRole, OrderLifecycleStatus } from '@/types';
import { APP_ENV, API_BASE_URL, STAGING_API_BASE_URL, PRODUCTION_API_BASE_URL } from '@env';

// API Constants
export let API_BASE_URL_CONFIG: string|null;
switch(APP_ENV) {
  case 'local': 
    API_BASE_URL_CONFIG = API_BASE_URL;
    break;
  case 'staging': 
    API_BASE_URL_CONFIG = STAGING_API_BASE_URL;
    break;
  default: 
    API_BASE_URL_CONFIG = PRODUCTION_API_BASE_URL;
    break;
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/sanctum/token',
    REGISTER: '/auth/register',
    LOGOUT: '/v1/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/v1/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ORDERS: {
    LIST: '/v1/orders',
    CREATE: '/v1/orders',
    DETAIL: '/v1/orders', // + /{uuid}
    UPDATE: '/v1/orders', // + /{uuid}
    DELETE: '/v1/orders', // + /{uuid}
    HISTORY: '/v1/orders', // + /{uuid}/history
    BUDGET: '/v1/orders', // + /{uuid}/budget
    CUSTOMER_APPROVAL: '/v1/orders', // + /{uuid}/customer-approval
    WORK_COMPLETED: '/v1/orders', // + /{uuid}/work-completed
    READY_FOR_DELIVERY: '/v1/orders', // + /{uuid}/ready-for-delivery
    DELIVER: '/v1/orders', // + /{uuid}/deliver
    TRACK: '/v1/orders/track',
  },
  CATALOG: {
    ENGINE_OPTIONS: '/v1/catalog/engine-options',
  },
  USERS: {
    PROFILE: '/v1/user',
    UPDATE_PROFILE: '/users/profile',
    CREATE: '/users',
    LIST: '/users',
    UPDATE: '/users',
    DELETE: '/users',
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
export const USER_ROLES = {
  SUPER_ADMINISTRATOR: { key: UserRole.SUPER_ADMINISTRATOR, displayName: 'Super Administrator' },
  ADMINISTRATOR: { key: UserRole.ADMINISTRATOR, displayName: 'Administrator' },
  EMPLOYEE: { key: UserRole.EMPLOYEE, displayName: 'Employee' },
  CUSTOMER: { key: UserRole.CUSTOMER, displayName: 'Customer' },
} as const;

// Order Statuses (legacy — kept for backward compatibility)
export const ORDER_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERED: 'Delivered',
  PAID: 'Paid',
  RETURNED: 'Returned',
  NOT_PAID: 'Not paid',
  CANCELLED: 'Cancelled',
} as const;

// Order Lifecycle Statuses (matches backend OrderStatus enum)
export const ORDER_LIFECYCLE_STATUSES: Record<string, OrderLifecycleStatus> = {
  RECEIVED: 'Received',
  AWAITING_REVIEW: 'Awaiting Review',
  REVIEWED: 'Reviewed',
  AWAITING_CUSTOMER_APPROVAL: 'Awaiting Customer Approval',
  READY_FOR_WORK: 'Ready for Work',
  IN_PROGRESS: 'In Progress',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
} as const;

// Item type keys (matches backend OrderItemType enum)
export const ITEM_TYPE_KEYS = {
  CYLINDER_HEAD: 'cylinder_head',
  ENGINE_BLOCK: 'engine_block',
  CRANKSHAFT: 'crankshaft',
  CONNECTING_RODS: 'connecting_rods',
  OTHERS: 'others',
} as const;

export type ItemTypeKey = typeof ITEM_TYPE_KEYS[keyof typeof ITEM_TYPE_KEYS];

// Publishing Statuses
export const PUBLISHING_STATUSES = {
  DRAFT: 'Draft',
  READY_FOR_REVIEW: 'Ready For Review',
  NEEDS_EDITING: 'Needs Editing',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  DELETED: 'Deleted',
} as const;

// Permissions (Re-exported from permissionsService for convenience)
export const PERMISSIONS = {
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },
  ORDERS: {
    CREATE: 'orders.create',
    READ: 'orders.read',
    UPDATE: 'orders.update',
    DELETE: 'orders.delete',
    ASSIGN: 'orders.assign',
    STATUS_CHANGE: 'orders.status_change',
  },
  REPORTS: {
    VIEW: 'reports.view',
    EXPORT: 'reports.export',
  },
  SYSTEM: {
    SETTINGS: 'system.settings',
    LOGS: 'system.logs',
  },
} as const;
