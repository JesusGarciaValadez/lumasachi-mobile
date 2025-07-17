import { User, Order, UserRole } from '../../src/types';

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: UserRole.ADMINISTRATOR,
    isActive: true,
    languagePreference: 'en',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    role: UserRole.EMPLOYEE,
    isActive: true,
    languagePreference: 'es',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    role: UserRole.CUSTOMER,
    isActive: true,
    languagePreference: 'en',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Mock order stats
export const mockOrderStats = {
  totalOrders: 150,
  pendingOrders: 25,
  completedOrders: 100,
  cancelledOrders: 10,
  inProgressOrders: 15,
  totalRevenue: 125000,
  averageOrderValue: 833.33,
  ordersByStatus: {
    'Open': 25,
    'In Progress': 15,
    'Ready for delivery': 10,
    'Delivered': 90,
    'Paid': 85,
    'Returned': 5,
    'Not paid': 5,
    'Cancelled': 10,
  },
};

// Mock authentication data
export const mockAuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
};

// Mock permissions by role
export const mockPermissions = {
  ADMIN: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'orders.create',
    'orders.read',
    'orders.update',
    'orders.delete',
    'products.create',
    'products.read',
    'products.update',
    'products.delete',
    'reports.read',
    'reports.create',
    'settings.read',
    'settings.update',
  ],
  EMPLOYEE: [
    'orders.create',
    'orders.read',
    'orders.update',
    'products.read',
    'reports.read',
  ],
  CUSTOMER: [
    'orders.read',
    'products.read',
  ],
};

// Mock error responses
export const mockApiErrors = {
  unauthorized: {
    message: 'Unauthorized',
    status: 401,
    code: 'UNAUTHORIZED',
  },
  serverError: {
    message: 'Internal Server Error',
    status: 500,
    code: 'SERVER_ERROR',
  },
  validation: {
    message: 'Validation Error',
    status: 422,
    code: 'VALIDATION_ERROR',
    errors: {
      email: ['Email is required', 'Email must be valid'],
      password: ['Password must be at least 8 characters'],
    },
  },
};
