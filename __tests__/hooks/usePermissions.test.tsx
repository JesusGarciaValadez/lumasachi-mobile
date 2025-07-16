/**
 * Tests para el hook usePermissions
 * 
 * Verifica que el hook funcione correctamente con diferentes roles de usuario
 * y que los permisos se actualicen reactivamente.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { renderHook } from '@testing-library/react-hooks';
import { UserRole } from '../../src/types';
import { usePermissions } from '../../src/hooks/usePermissions';
import { PERMISSIONS } from '../../src/services/permissionsService';

// Mock del hook useAuth
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = require('../../src/hooks/useAuth').useAuth;

describe('🔐 usePermissions Hook', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Super Administrator', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '1', 
          firstName: 'Admin', 
          lastName: 'User', 
          email: 'admin@example.com', 
          role: UserRole.SUPER_ADMINISTRATOR 
        },
        isLoading: false,
      });
    });

    it('debería tener todos los permisos', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateUsers).toBe(true);
      expect(result.current.canEditUsers).toBe(true);
      expect(result.current.canDeleteUsers).toBe(true);
      expect(result.current.canCreateOrders).toBe(true);
      expect(result.current.canEditOrders).toBe(true);
      expect(result.current.canDeleteOrders).toBe(true);
      expect(result.current.canAssignOrders).toBe(true);
      expect(result.current.canViewReports).toBe(true);
      expect(result.current.canExportData).toBe(true);
      expect(result.current.canAccessSystemSettings).toBe(true);
      expect(result.current.canAccessSystemLogs).toBe(true);
    });

    it('debería poder acceder a todas las pantallas', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canAccessScreen('CreateOrder')).toBe(true);
      expect(result.current.canAccessScreen('EditOrder')).toBe(true);
      expect(result.current.canAccessScreen('UserManagement')).toBe(true);
      expect(result.current.canAccessScreen('CreateUser')).toBe(true);
      expect(result.current.canAccessScreen('ManageRoles')).toBe(true);
      expect(result.current.canAccessScreen('ViewReports')).toBe(true);
      expect(result.current.canAccessScreen('ExportData')).toBe(true);
      expect(result.current.canAccessScreen('SystemSettings')).toBe(true);
    });

    it('debería tener todos los permisos en la lista', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userPermissions).toContain(PERMISSIONS.USERS.CREATE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.USERS.READ);
      expect(result.current.userPermissions).toContain(PERMISSIONS.USERS.UPDATE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.USERS.DELETE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.DELETE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(result.current.userPermissions).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(result.current.userPermissions).toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(result.current.userPermissions).toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(result.current.userPermissions).toContain(PERMISSIONS.SYSTEM.LOGS);
    });
  });

  describe('Administrator', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '2', 
          firstName: 'Admin', 
          lastName: 'User', 
          email: 'admin@example.com', 
          role: UserRole.ADMINISTRATOR 
        },
        isLoading: false,
      });
    });

    it('debería tener permisos de administrador pero no de sistema', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateUsers).toBe(true);
      expect(result.current.canEditUsers).toBe(true);
      expect(result.current.canDeleteUsers).toBe(false);
      expect(result.current.canCreateOrders).toBe(true);
      expect(result.current.canEditOrders).toBe(true);
      expect(result.current.canDeleteOrders).toBe(false);
      expect(result.current.canAssignOrders).toBe(true);
      expect(result.current.canViewReports).toBe(true);
      expect(result.current.canExportData).toBe(true);
      expect(result.current.canAccessSystemSettings).toBe(false);
      expect(result.current.canAccessSystemLogs).toBe(false);
    });

    it('debería poder acceder a pantallas de administración pero no de sistema', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canAccessScreen('CreateOrder')).toBe(true);
      expect(result.current.canAccessScreen('EditOrder')).toBe(true);
      expect(result.current.canAccessScreen('UserManagement')).toBe(true);
      expect(result.current.canAccessScreen('CreateUser')).toBe(true);
      expect(result.current.canAccessScreen('ManageRoles')).toBe(true);
      expect(result.current.canAccessScreen('ViewReports')).toBe(true);
      expect(result.current.canAccessScreen('ExportData')).toBe(true);
      expect(result.current.canAccessScreen('SystemSettings')).toBe(false);
    });
  });

  describe('Employee', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '3', 
          firstName: 'Employee', 
          lastName: 'User', 
          email: 'employee@example.com', 
          role: UserRole.EMPLOYEE 
        },
        isLoading: false,
      });
    });

    it('debería tener solo permisos de órdenes', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateUsers).toBe(false);
      expect(result.current.canEditUsers).toBe(false);
      expect(result.current.canDeleteUsers).toBe(false);
      expect(result.current.canCreateOrders).toBe(true);
      expect(result.current.canEditOrders).toBe(true);
      expect(result.current.canDeleteOrders).toBe(false);
      expect(result.current.canAssignOrders).toBe(false);
      expect(result.current.canViewReports).toBe(false);
      expect(result.current.canExportData).toBe(false);
      expect(result.current.canAccessSystemSettings).toBe(false);
      expect(result.current.canAccessSystemLogs).toBe(false);
    });

    it('debería poder acceder solo a pantallas de órdenes', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canAccessScreen('CreateOrder')).toBe(true);
      expect(result.current.canAccessScreen('EditOrder')).toBe(true);
      expect(result.current.canAccessScreen('UserManagement')).toBe(false);
      expect(result.current.canAccessScreen('CreateUser')).toBe(false);
      expect(result.current.canAccessScreen('ManageRoles')).toBe(false);
      expect(result.current.canAccessScreen('ViewReports')).toBe(false);
      expect(result.current.canAccessScreen('ExportData')).toBe(false);
      expect(result.current.canAccessScreen('SystemSettings')).toBe(false);
    });
  });

  describe('Customer', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '4', 
          firstName: 'Customer', 
          lastName: 'User', 
          email: 'customer@example.com', 
          role: UserRole.CUSTOMER 
        },
        isLoading: false,
      });
    });

    it('debería tener solo permisos de lectura de órdenes', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateUsers).toBe(false);
      expect(result.current.canEditUsers).toBe(false);
      expect(result.current.canDeleteUsers).toBe(false);
      expect(result.current.canCreateOrders).toBe(false);
      expect(result.current.canEditOrders).toBe(false);
      expect(result.current.canDeleteOrders).toBe(false);
      expect(result.current.canAssignOrders).toBe(false);
      expect(result.current.canViewReports).toBe(false);
      expect(result.current.canExportData).toBe(false);
      expect(result.current.canAccessSystemSettings).toBe(false);
      expect(result.current.canAccessSystemLogs).toBe(false);
    });

    it('debería tener acceso muy limitado a pantallas', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canAccessScreen('CreateOrder')).toBe(false);
      expect(result.current.canAccessScreen('EditOrder')).toBe(false);
      expect(result.current.canAccessScreen('UserManagement')).toBe(false);
      expect(result.current.canAccessScreen('CreateUser')).toBe(false);
      expect(result.current.canAccessScreen('ManageRoles')).toBe(false);
      expect(result.current.canAccessScreen('ViewReports')).toBe(false);
      expect(result.current.canAccessScreen('ExportData')).toBe(false);
      expect(result.current.canAccessScreen('SystemSettings')).toBe(false);
    });

    it('debería tener solo permiso de lectura de órdenes', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userPermissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.ORDERS.CREATE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.ORDERS.DELETE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.USERS.CREATE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.USERS.READ);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.USERS.UPDATE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.USERS.DELETE);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.REPORTS.VIEW);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(result.current.userPermissions).not.toContain(PERMISSIONS.SYSTEM.LOGS);
    });
  });

  describe('Sin usuario autenticado', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
      });
    });

    it('debería retornar false para todos los permisos', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canCreateUsers).toBe(false);
      expect(result.current.canEditUsers).toBe(false);
      expect(result.current.canDeleteUsers).toBe(false);
      expect(result.current.canCreateOrders).toBe(false);
      expect(result.current.canEditOrders).toBe(false);
      expect(result.current.canDeleteOrders).toBe(false);
      expect(result.current.canAssignOrders).toBe(false);
      expect(result.current.canViewReports).toBe(false);
      expect(result.current.canExportData).toBe(false);
      expect(result.current.canAccessSystemSettings).toBe(false);
      expect(result.current.canAccessSystemLogs).toBe(false);
    });

    it('debería retornar false para acceso a pantallas', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canAccessScreen('CreateOrder')).toBe(false);
      expect(result.current.canAccessScreen('EditOrder')).toBe(false);
      expect(result.current.canAccessScreen('UserManagement')).toBe(false);
      expect(result.current.canAccessScreen('CreateUser')).toBe(false);
      expect(result.current.canAccessScreen('ManageRoles')).toBe(false);
      expect(result.current.canAccessScreen('ViewReports')).toBe(false);
      expect(result.current.canAccessScreen('ExportData')).toBe(false);
      expect(result.current.canAccessScreen('SystemSettings')).toBe(false);
    });

    it('debería retornar lista vacía de permisos', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.userPermissions).toEqual([]);
      expect(result.current.userRole).toBe(null);
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '1', 
          firstName: 'Admin', 
          lastName: 'User', 
          email: 'admin@example.com', 
          role: UserRole.SUPER_ADMINISTRATOR 
        },
        isLoading: true,
      });
    });

    it('debería retornar el estado de loading', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Functions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { 
          id: '1', 
          firstName: 'Admin', 
          lastName: 'User', 
          email: 'admin@example.com', 
          role: UserRole.ADMINISTRATOR 
        },
        isLoading: false,
      });
    });

    it('debería verificar permisos individuales correctamente', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasPermission(PERMISSIONS.USERS.CREATE)).toBe(true);
      expect(result.current.hasPermission(PERMISSIONS.USERS.DELETE)).toBe(false);
      expect(result.current.hasPermission(PERMISSIONS.ORDERS.CREATE)).toBe(true);
      expect(result.current.hasPermission(PERMISSIONS.SYSTEM.SETTINGS)).toBe(false);
    });

    it('debería verificar múltiples permisos (any) correctamente', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAnyPermission([
        PERMISSIONS.USERS.CREATE,
        PERMISSIONS.SYSTEM.SETTINGS
      ])).toBe(true);
      
      expect(result.current.hasAnyPermission([
        PERMISSIONS.USERS.DELETE,
        PERMISSIONS.SYSTEM.SETTINGS
      ])).toBe(false);
    });

    it('debería verificar múltiples permisos (all) correctamente', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.hasAllPermissions([
        PERMISSIONS.USERS.CREATE,
        PERMISSIONS.USERS.READ,
        PERMISSIONS.USERS.UPDATE
      ])).toBe(true);
      
      expect(result.current.hasAllPermissions([
        PERMISSIONS.USERS.CREATE,
        PERMISSIONS.USERS.DELETE
      ])).toBe(false);
    });
  });
}); 