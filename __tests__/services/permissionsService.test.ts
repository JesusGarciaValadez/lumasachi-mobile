/**
 * Tests for permissions service
 * 
 * Verifies that permissions are correctly assigned to each role
 * and that verification functions work correctly.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { UserRole } from '../../src/types';
import { PermissionsService, PERMISSIONS, Permission } from '../../src/services/permissionsService';

describe('🔐 PermissionsService', () => {
  
  describe('getPermissionsForRole', () => {
    it('should return all permissions for Super Administrator', () => {
      const permissions = PermissionsService.getPermissionsForRole(UserRole.SUPER_ADMINISTRATOR);
      
      expect(permissions).toContain(PERMISSIONS.USERS.CREATE);
      expect(permissions).toContain(PERMISSIONS.USERS.READ);
      expect(permissions).toContain(PERMISSIONS.USERS.UPDATE);
      expect(permissions).toContain(PERMISSIONS.USERS.DELETE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(permissions).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.DELETE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(permissions).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(permissions).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(permissions).toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(permissions).toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(permissions).toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(permissions.length).toBe(14);
    });

    it('should return correct permissions for Administrator', () => {
      const permissions = PermissionsService.getPermissionsForRole(UserRole.ADMINISTRATOR);
      
      expect(permissions).toContain(PERMISSIONS.USERS.CREATE);
      expect(permissions).toContain(PERMISSIONS.USERS.READ);
      expect(permissions).toContain(PERMISSIONS.USERS.UPDATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(permissions).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(permissions).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(permissions).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(permissions).toContain(PERMISSIONS.REPORTS.EXPORT);
      
      // Should not have system permissions
      expect(permissions).not.toContain(PERMISSIONS.USERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(permissions.length).toBe(10);
    });

    it('debería retornar permisos limitados para Employee', () => {
      const permissions = PermissionsService.getPermissionsForRole(UserRole.EMPLOYEE);
      
      expect(permissions).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(permissions).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(permissions).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      
      // No debe tener permisos de usuario, reportes o sistema
      expect(permissions).not.toContain(PERMISSIONS.USERS.CREATE);
      expect(permissions).not.toContain(PERMISSIONS.USERS.READ);
      expect(permissions).not.toContain(PERMISSIONS.USERS.UPDATE);
      expect(permissions).not.toContain(PERMISSIONS.USERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(permissions).not.toContain(PERMISSIONS.REPORTS.VIEW);
      expect(permissions).not.toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(permissions.length).toBe(4);
    });

    it('debería retornar permisos mínimos para Customer', () => {
      const permissions = PermissionsService.getPermissionsForRole(UserRole.CUSTOMER);
      
      expect(permissions).toContain(PERMISSIONS.ORDERS.READ);
      
      // No debe tener otros permisos
      expect(permissions).not.toContain(PERMISSIONS.USERS.CREATE);
      expect(permissions).not.toContain(PERMISSIONS.USERS.READ);
      expect(permissions).not.toContain(PERMISSIONS.USERS.UPDATE);
      expect(permissions).not.toContain(PERMISSIONS.USERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.CREATE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.DELETE);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(permissions).not.toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(permissions).not.toContain(PERMISSIONS.REPORTS.VIEW);
      expect(permissions).not.toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(permissions).not.toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(permissions.length).toBe(1);
    });
  });

  describe('hasPermission', () => {
    it('debería retornar true cuando el usuario tiene el permiso', () => {
      const hasPermission = PermissionsService.hasPermission(
        UserRole.ADMINISTRATOR,
        PERMISSIONS.USERS.CREATE
      );
      expect(hasPermission).toBe(true);
    });

    it('debería retornar false cuando el usuario no tiene el permiso', () => {
      const hasPermission = PermissionsService.hasPermission(
        UserRole.CUSTOMER,
        PERMISSIONS.USERS.CREATE
      );
      expect(hasPermission).toBe(false);
    });

    it('debería retornar false cuando el usuario no tiene el permiso de eliminación', () => {
      const hasPermission = PermissionsService.hasPermission(
        UserRole.ADMINISTRATOR,
        PERMISSIONS.USERS.DELETE
      );
      expect(hasPermission).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('debería retornar true cuando el usuario tiene al menos uno de los permisos', () => {
      const hasAnyPermission = PermissionsService.hasAnyPermission(
        UserRole.ADMINISTRATOR,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.SYSTEM.SETTINGS]
      );
      expect(hasAnyPermission).toBe(true);
    });

    it('debería retornar false cuando el usuario no tiene ninguno de los permisos', () => {
      const hasAnyPermission = PermissionsService.hasAnyPermission(
        UserRole.CUSTOMER,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.SYSTEM.SETTINGS]
      );
      expect(hasAnyPermission).toBe(false);
    });

    it('debería retornar true cuando el usuario tiene todos los permisos', () => {
      const hasAnyPermission = PermissionsService.hasAnyPermission(
        UserRole.SUPER_ADMINISTRATOR,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.SYSTEM.SETTINGS]
      );
      expect(hasAnyPermission).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('debería retornar true cuando el usuario tiene todos los permisos', () => {
      const hasAllPermissions = PermissionsService.hasAllPermissions(
        UserRole.SUPER_ADMINISTRATOR,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ, PERMISSIONS.USERS.UPDATE]
      );
      expect(hasAllPermissions).toBe(true);
    });

    it('debería retornar false cuando el usuario no tiene todos los permisos', () => {
      const hasAllPermissions = PermissionsService.hasAllPermissions(
        UserRole.ADMINISTRATOR,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.DELETE]
      );
      expect(hasAllPermissions).toBe(false);
    });

    it('debería retornar false cuando el usuario no tiene ninguno de los permisos', () => {
      const hasAllPermissions = PermissionsService.hasAllPermissions(
        UserRole.CUSTOMER,
        [PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]
      );
      expect(hasAllPermissions).toBe(false);
    });
  });

  describe('canAccessScreen', () => {
    it('debería permitir acceso a CreateOrder para usuarios con permisos', () => {
      expect(PermissionsService.canAccessScreen(UserRole.ADMINISTRATOR, 'CreateOrder')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.EMPLOYEE, 'CreateOrder')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.CUSTOMER, 'CreateOrder')).toBe(false);
    });

    it('debería permitir acceso a UserManagement solo para administradores', () => {
      expect(PermissionsService.canAccessScreen(UserRole.SUPER_ADMINISTRATOR, 'UserManagement')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.ADMINISTRATOR, 'UserManagement')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.EMPLOYEE, 'UserManagement')).toBe(false);
      expect(PermissionsService.canAccessScreen(UserRole.CUSTOMER, 'UserManagement')).toBe(false);
    });

    it('debería permitir acceso a Settings para todos los usuarios', () => {
      expect(PermissionsService.canAccessScreen(UserRole.SUPER_ADMINISTRATOR, 'Settings')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.ADMINISTRATOR, 'Settings')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.EMPLOYEE, 'Settings')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.CUSTOMER, 'Settings')).toBe(true);
    });

    it('debería permitir acceso a SystemSettings solo para Super Administrator', () => {
      expect(PermissionsService.canAccessScreen(UserRole.SUPER_ADMINISTRATOR, 'SystemSettings')).toBe(true);
      expect(PermissionsService.canAccessScreen(UserRole.ADMINISTRATOR, 'SystemSettings')).toBe(false);
      expect(PermissionsService.canAccessScreen(UserRole.EMPLOYEE, 'SystemSettings')).toBe(false);
      expect(PermissionsService.canAccessScreen(UserRole.CUSTOMER, 'SystemSettings')).toBe(false);
    });
  });

  describe('canAccessTab', () => {
    it('debería permitir acceso a tab Users solo para usuarios con permisos de lectura', () => {
      expect(PermissionsService.canAccessTab(UserRole.SUPER_ADMINISTRATOR, 'Users')).toBe(true);
      expect(PermissionsService.canAccessTab(UserRole.ADMINISTRATOR, 'Users')).toBe(true);
      expect(PermissionsService.canAccessTab(UserRole.EMPLOYEE, 'Users')).toBe(false);
      expect(PermissionsService.canAccessTab(UserRole.CUSTOMER, 'Users')).toBe(false);
    });

    it('debería permitir acceso a tabs básicos para todos los usuarios', () => {
      const basicTabs = ['Home', 'Orders', 'Profile', 'Settings'];
      
      basicTabs.forEach(tab => {
        expect(PermissionsService.canAccessTab(UserRole.SUPER_ADMINISTRATOR, tab)).toBe(true);
        expect(PermissionsService.canAccessTab(UserRole.ADMINISTRATOR, tab)).toBe(true);
        expect(PermissionsService.canAccessTab(UserRole.EMPLOYEE, tab)).toBe(true);
        expect(PermissionsService.canAccessTab(UserRole.CUSTOMER, tab)).toBe(true);
      });
    });
  });

  describe('compareRolePermissions', () => {
    it('debería comparar permisos entre roles correctamente', () => {
      const comparison = PermissionsService.compareRolePermissions(
        UserRole.ADMINISTRATOR,
        UserRole.EMPLOYEE
      );
      
      expect(comparison.common).toEqual([
        PERMISSIONS.ORDERS.CREATE,
        PERMISSIONS.ORDERS.READ,
        PERMISSIONS.ORDERS.UPDATE,
        PERMISSIONS.ORDERS.STATUS_CHANGE,
      ]);
      
      expect(comparison.unique1).toContain(PERMISSIONS.USERS.CREATE);
      expect(comparison.unique1).toContain(PERMISSIONS.USERS.READ);
      expect(comparison.unique1).toContain(PERMISSIONS.USERS.UPDATE);
      expect(comparison.unique1).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(comparison.unique1).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(comparison.unique1).toContain(PERMISSIONS.REPORTS.EXPORT);
      
      expect(comparison.unique2).toEqual([]);
    });

    it('debería mostrar diferencias entre Super Administrator y Administrator', () => {
      const comparison = PermissionsService.compareRolePermissions(
        UserRole.SUPER_ADMINISTRATOR,
        UserRole.ADMINISTRATOR
      );
      
      expect(comparison.unique1).toContain(PERMISSIONS.USERS.DELETE);
      expect(comparison.unique1).toContain(PERMISSIONS.ORDERS.DELETE);
      expect(comparison.unique1).toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(comparison.unique1).toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(comparison.unique2).toEqual([]);
    });
  });

  describe('getAllPermissions', () => {
    it('debería retornar todos los permisos disponibles', () => {
      const allPermissions = PermissionsService.getAllPermissions();
      
      expect(allPermissions).toContain(PERMISSIONS.USERS.CREATE);
      expect(allPermissions).toContain(PERMISSIONS.USERS.READ);
      expect(allPermissions).toContain(PERMISSIONS.USERS.UPDATE);
      expect(allPermissions).toContain(PERMISSIONS.USERS.DELETE);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.READ);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.DELETE);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(allPermissions).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(allPermissions).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(allPermissions).toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(allPermissions).toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(allPermissions).toContain(PERMISSIONS.SYSTEM.LOGS);
      
      expect(allPermissions.length).toBe(14);
    });
  });

  describe('getPermissionsByCategory', () => {
    it('debería agrupar permisos por categoría correctamente', () => {
      const categories = PermissionsService.getPermissionsByCategory();
      
      expect(categories.users).toContain(PERMISSIONS.USERS.CREATE);
      expect(categories.users).toContain(PERMISSIONS.USERS.READ);
      expect(categories.users).toContain(PERMISSIONS.USERS.UPDATE);
      expect(categories.users).toContain(PERMISSIONS.USERS.DELETE);
      expect(categories.users.length).toBe(4);
      
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.CREATE);
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.READ);
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.UPDATE);
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.DELETE);
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.ASSIGN);
      expect(categories.orders).toContain(PERMISSIONS.ORDERS.STATUS_CHANGE);
      expect(categories.orders.length).toBe(6);
      
      expect(categories.reports).toContain(PERMISSIONS.REPORTS.VIEW);
      expect(categories.reports).toContain(PERMISSIONS.REPORTS.EXPORT);
      expect(categories.reports.length).toBe(2);
      
      expect(categories.system).toContain(PERMISSIONS.SYSTEM.SETTINGS);
      expect(categories.system).toContain(PERMISSIONS.SYSTEM.LOGS);
      expect(categories.system.length).toBe(2);
    });
  });
}); 