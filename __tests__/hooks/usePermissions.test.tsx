/**
 * Tests para el hook usePermissions
 * 
 * Verifica que el hook funcione correctamente con diferentes roles de usuario
 * y que los permisos se actualicen reactivamente.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { usePermissions } from '../../src/hooks/usePermissions';
import { mockUsers, mockPermissions } from '../utils/mockData';
import { PermissionsService, PERMISSIONS } from '../../src/services/permissionsService';
import { QueryTestProvider } from '../utils/testProviders';

// Mock auth hook
const mockUseAuth = jest.fn();
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock permissions service
jest.mock('../../src/services/permissionsService', () => ({
  PermissionsService: {
    checkPermission: jest.fn(),
    hasPermission: jest.fn(),
    getUserPermissions: jest.fn(),
    canAccess: jest.fn(),
    getPermissionsForRole: jest.fn(),
    canAccessScreen: jest.fn(),
    canAccessTab: jest.fn(),
    hasAllPermissions: jest.fn(),
    hasAnyPermission: jest.fn(),
  },
  PERMISSIONS: {
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
  },
}));


const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryTestProvider>{children}</QueryTestProvider>
);

const mockPermissionsService = jest.mocked(PermissionsService);

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementation
    mockPermissionsService.getPermissionsForRole.mockImplementation((role) => {
      switch (role) {
        case 'ADMINISTRATOR':
          return mockPermissions.ADMIN;
        case 'EMPLOYEE':
          return mockPermissions.EMPLOYEE;
        case 'CUSTOMER':
          return mockPermissions.CUSTOMER;
        default:
          return [];
      }
    });
    mockPermissionsService.hasPermission.mockImplementation((role, permission) => {
      const permissions = mockPermissionsService.getPermissionsForRole(role);
      return permissions.includes(permission);
    });
    mockPermissionsService.canAccessScreen.mockImplementation((role, screen) => {
      const permissions = mockPermissionsService.getPermissionsForRole(role);
      const screenPermissions = {
        'UserManagement': ['users.read'],
        'CreateUser': ['users.create'],
        'Orders': ['orders.read'],
        'CreateOrder': ['orders.create'],
        'Reports': ['reports.read'],
      };
      const requiredPermissions = screenPermissions[screen] || [];
      return requiredPermissions.every(perm => permissions.includes(perm));
    });
    mockPermissionsService.hasAllPermissions.mockImplementation((role, permissions) => {
      const userPermissions = mockPermissionsService.getPermissionsForRole(role);
      return permissions.every(perm => userPermissions.includes(perm));
    });
  });

  it('returns no permissions for unauthenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.userPermissions).toEqual([]);
    expect(result.current.hasPermission(PERMISSIONS.USERS.READ)).toBe(false);
    expect(result.current.canAccessScreen('UserManagement')).toBe(false);
  });

  it('returns admin permissions for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'ADMINISTRATOR' },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.userPermissions).toEqual(mockPermissions.ADMIN);
    expect(result.current.hasPermission('users.create')).toBe(true);
    expect(result.current.hasPermission('users.read')).toBe(true);
    expect(result.current.hasPermission('users.update')).toBe(true);
    expect(result.current.hasPermission('users.delete')).toBe(true);
  });

  it('returns employee permissions for employee user', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.userPermissions).toEqual(mockPermissions.EMPLOYEE);
    expect(result.current.hasPermission('orders.create')).toBe(true);
    expect(result.current.hasPermission('orders.read')).toBe(true);
    expect(result.current.hasPermission('orders.update')).toBe(true);
    expect(result.current.hasPermission('users.create')).toBe(false);
  });

  it('returns customer permissions for customer user', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'CUSTOMER' },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.userPermissions).toEqual(mockPermissions.CUSTOMER);
    expect(result.current.hasPermission('orders.read')).toBe(true);
    expect(result.current.hasPermission('orders.create')).toBe(false);
    expect(result.current.hasPermission('users.read')).toBe(false);
  });

  it('checks specific permissions correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.hasPermission('orders.read')).toBe(true);
    expect(result.current.hasPermission('orders.create')).toBe(true);
    expect(result.current.hasPermission('users.delete')).toBe(false);
    expect(result.current.hasPermission('settings.update')).toBe(false);
  });

  it('checks screen access correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'ADMINISTRATOR' },
      isAuthenticated: true,
    });

    mockPermissionsService.getPermissionsForRole.mockReturnValue(mockPermissions.ADMIN);
    mockPermissionsService.canAccess.mockImplementation((permissions: string[], screen: string) => {
      const screenPermissions = {
        'UserManagement': ['users.read'],
        'CreateUser': ['users.create'],
        'Orders': ['orders.read'],
        'CreateOrder': ['orders.create'],
        'Reports': ['reports.read'],
      };
      
      const requiredPermissions = screenPermissions[screen] || [];
      return requiredPermissions.every(perm => permissions.includes(perm));
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.canAccessScreen('UserManagement')).toBe(true);
    expect(result.current.canAccessScreen('CreateUser')).toBe(true);
    expect(result.current.canAccessScreen('Orders')).toBe(true);
    expect(result.current.canAccessScreen('CreateOrder')).toBe(true);
    expect(result.current.canAccessScreen('Reports')).toBe(true);
  });

  it('denies screen access for insufficient permissions', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'CUSTOMER' },
      isAuthenticated: true,
    });

    mockPermissionsService.getPermissionsForRole.mockReturnValue(mockPermissions.CUSTOMER);
    mockPermissionsService.canAccess.mockImplementation((permissions: string[], screen: string) => {
      const screenPermissions = {
        'UserManagement': ['users.read'],
        'CreateUser': ['users.create'],
        'Orders': ['orders.read'],
        'CreateOrder': ['orders.create'],
        'Reports': ['reports.read'],
      };
      
      const requiredPermissions = screenPermissions[screen] || [];
      return requiredPermissions.every(perm => permissions.includes(perm));
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.canAccessScreen('UserManagement')).toBe(false);
    expect(result.current.canAccessScreen('CreateUser')).toBe(false);
    expect(result.current.canAccessScreen('Orders')).toBe(true);
    expect(result.current.canAccessScreen('CreateOrder')).toBe(false);
    expect(result.current.canAccessScreen('Reports')).toBe(false);
  });

  it('checks multiple permissions with checkPermissions', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    mockPermissionsService.getPermissionsForRole.mockReturnValue(mockPermissions.EMPLOYEE);
    mockPermissionsService.checkPermission.mockImplementation((permissions: string[], requiredPermissions: string[]) => {
      return requiredPermissions.every(perm => permissions.includes(perm));
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.hasAllPermissions(['orders.read', 'orders.create'])).toBe(true);
    expect(result.current.hasAllPermissions(['orders.read', 'users.create'])).toBe(false);
    expect(result.current.hasAllPermissions(['users.delete', 'settings.update'])).toBe(false);
  });

  it('updates permissions when user role changes', () => {
    // Start with EMPLOYEE role
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    const { result, rerender } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.userPermissions).toEqual(mockPermissions.EMPLOYEE);

    // Change user role to admin
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'ADMINISTRATOR' },
      isAuthenticated: true,
    });

    rerender();

    expect(result.current.userPermissions).toEqual(mockPermissions.ADMIN);
  });

  it('handles role-based permission inheritance', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'SUPER_ADMINISTRATOR' },
      isAuthenticated: true,
    });

    const superAdminPermissions = [
      ...mockPermissions.ADMIN,
      'system.admin',
      'system.maintenance',
    ];

    mockPermissionsService.getPermissionsForRole.mockReturnValue(superAdminPermissions);

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.userPermissions).toEqual(superAdminPermissions);
    expect(result.current.hasPermission('system.admin')).toBe(true);
    expect(result.current.hasPermission('users.create')).toBe(true);
    expect(result.current.hasPermission('orders.create')).toBe(true);
  });

  it('handles permission validation errors gracefully', () => {
    // Set a specific mock for this test that throws an error
    const originalMock = mockPermissionsService.getPermissionsForRole.getMockImplementation();
    mockPermissionsService.getPermissionsForRole.mockImplementation(() => {
      throw new Error('Permission service error');
    });
    
    // Mock hasPermission to always return false when permissions are empty
    mockPermissionsService.hasPermission.mockReturnValue(false);
    
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePermissions(), { wrapper });

    // Should fallback to empty permissions on error
    expect(result.current.userPermissions).toEqual([]);
    expect(result.current.hasPermission('orders.read')).toBe(false);
    
    // Restore original mock
    mockPermissionsService.getPermissionsForRole.mockImplementation(originalMock);
  });

  it('memoizes permissions to prevent unnecessary recalculations', () => {
    // Clear all previous calls
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'EMPLOYEE' },
      isAuthenticated: true,
    });

    const { result, rerender } = renderHook(() => usePermissions(), { wrapper });

    const firstPermissions = result.current.userPermissions;
    const callCountAfterFirstRender = mockPermissionsService.getPermissionsForRole.mock.calls.length;

    // Rerender without changing user
    rerender();

    const secondPermissions = result.current.userPermissions;
    const callCountAfterSecondRender = mockPermissionsService.getPermissionsForRole.mock.calls.length;

    // Should return the same reference (memoized)
    expect(firstPermissions).toBe(secondPermissions);
    // Should not have called getPermissionsForRole again
    expect(callCountAfterSecondRender).toBe(callCountAfterFirstRender);
  });

  it('provides permission checking utilities', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'ADMINISTRATOR' },
      isAuthenticated: true,
    });

    mockPermissionsService.getPermissionsForRole.mockReturnValue(mockPermissions.ADMIN);

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.userRole).toBe('ADMINISTRATOR');
    expect(result.current.canCreateUsers).toBe(true);
    expect(result.current.canDeleteUsers).toBe(true);
  });

  it('handles unknown roles gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUsers[0], role: 'UNKNOWN_ROLE' },
      isAuthenticated: true,
    });

    mockPermissionsService.getPermissionsForRole.mockReturnValue([]);

    const { result } = renderHook(() => usePermissions(), { wrapper });

expect(result.current.userPermissions).toEqual([]);
    expect(result.current.hasPermission('orders.read')).toBe(false);
expect(result.current.canAccessScreen('Orders')).toBe(false);
  });
}); 