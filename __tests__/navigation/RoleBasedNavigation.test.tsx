/**
 * Tests para navegación basada en roles
 * 
 * Verifica que la navegación funcione correctamente según el rol del usuario
 * después de la refactorización de la inconsistencia del Model Customer.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { UserRole } from '../../src/types';
import { getNavigationConfig } from '../../src/types/navigation';

describe('🔐 Navegación basada en roles', () => {
  
  describe('getNavigationConfig', () => {
    it('debería retornar configuración correcta para Super Administrator', () => {
      const config = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      
      expect(config).toEqual({
        showUsersTab: true,
        showCreateOrder: true,
        showUserManagement: true,
        canEditAllOrders: true,
        canDeleteOrders: true,
      });
    });

    it('debería retornar configuración correcta para Administrator', () => {
      const config = getNavigationConfig(UserRole.ADMINISTRATOR);
      
      expect(config).toEqual({
        showUsersTab: true,
        showCreateOrder: true,
        showUserManagement: true,
        canEditAllOrders: true,
        canDeleteOrders: false,
      });
    });

    it('debería retornar configuración correcta para Employee', () => {
      const config = getNavigationConfig(UserRole.EMPLOYEE);
      
      expect(config).toEqual({
        showUsersTab: false,
        showCreateOrder: true,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      });
    });

    it('debería retornar configuración correcta para Customer', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      
      expect(config).toEqual({
        showUsersTab: false,
        showCreateOrder: false,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      });
    });
  });
});

describe('🔒 Validación de permisos', () => {
  
  describe('Permisos de creación de órdenes', () => {
    it('Super Administrator debería poder crear órdenes', () => {
      const config = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      expect(config.showCreateOrder).toBe(true);
    });

    it('Administrator debería poder crear órdenes', () => {
      const config = getNavigationConfig(UserRole.ADMINISTRATOR);
      expect(config.showCreateOrder).toBe(true);
    });

    it('Employee debería poder crear órdenes', () => {
      const config = getNavigationConfig(UserRole.EMPLOYEE);
      expect(config.showCreateOrder).toBe(true);
    });

    it('Customer NO debería poder crear órdenes', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      expect(config.showCreateOrder).toBe(false);
    });
  });

  describe('Permisos de gestión de usuarios', () => {
    it('Super Administrator debería poder gestionar usuarios', () => {
      const config = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      expect(config.showUserManagement).toBe(true);
    });

    it('Administrator debería poder gestionar usuarios', () => {
      const config = getNavigationConfig(UserRole.ADMINISTRATOR);
      expect(config.showUserManagement).toBe(true);
    });

    it('Employee NO debería poder gestionar usuarios', () => {
      const config = getNavigationConfig(UserRole.EMPLOYEE);
      expect(config.showUserManagement).toBe(false);
    });

    it('Customer NO debería poder gestionar usuarios', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      expect(config.showUserManagement).toBe(false);
    });
  });

  describe('Permisos de edición de órdenes', () => {
    it('Super Administrator debería poder editar todas las órdenes', () => {
      const config = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      expect(config.canEditAllOrders).toBe(true);
    });

    it('Administrator debería poder editar todas las órdenes', () => {
      const config = getNavigationConfig(UserRole.ADMINISTRATOR);
      expect(config.canEditAllOrders).toBe(true);
    });

    it('Employee NO debería poder editar todas las órdenes', () => {
      const config = getNavigationConfig(UserRole.EMPLOYEE);
      expect(config.canEditAllOrders).toBe(false);
    });

    it('Customer NO debería poder editar todas las órdenes', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      expect(config.canEditAllOrders).toBe(false);
    });
  });

  describe('Permisos de eliminación de órdenes', () => {
    it('Solo Super Administrator debería poder eliminar órdenes', () => {
      const config = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      expect(config.canDeleteOrders).toBe(true);
    });

    it('Administrator NO debería poder eliminar órdenes', () => {
      const config = getNavigationConfig(UserRole.ADMINISTRATOR);
      expect(config.canDeleteOrders).toBe(false);
    });

    it('Employee NO debería poder eliminar órdenes', () => {
      const config = getNavigationConfig(UserRole.EMPLOYEE);
      expect(config.canDeleteOrders).toBe(false);
    });

    it('Customer NO debería poder eliminar órdenes', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      expect(config.canDeleteOrders).toBe(false);
    });
  });
});

describe('🧪 Integración Customer-User', () => {
  
  describe('Refactorización de Customer a User', () => {
    it('debería manejar usuarios con rol Customer correctamente', () => {
      const config = getNavigationConfig(UserRole.CUSTOMER);
      
      // Verificar que los customers tengan acceso limitado
      expect(config.showUsersTab).toBe(false);
      expect(config.showCreateOrder).toBe(false);
      expect(config.showUserManagement).toBe(false);
      expect(config.canEditAllOrders).toBe(false);
      expect(config.canDeleteOrders).toBe(false);
    });

    it('debería mantener compatibilidad con roles existentes', () => {
      const roles = [
        UserRole.SUPER_ADMINISTRATOR,
        UserRole.ADMINISTRATOR,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
      ];

      roles.forEach(role => {
        const config = getNavigationConfig(role);
        
        // Verificar que la configuración sea válida
        expect(config).toBeDefined();
        expect(typeof config.showUsersTab).toBe('boolean');
        expect(typeof config.showCreateOrder).toBe('boolean');
        expect(typeof config.showUserManagement).toBe('boolean');
        expect(typeof config.canEditAllOrders).toBe('boolean');
        expect(typeof config.canDeleteOrders).toBe('boolean');
      });
    });

    it('debería asignar permisos correctos según jerarquía de roles', () => {
      const superAdmin = getNavigationConfig(UserRole.SUPER_ADMINISTRATOR);
      const admin = getNavigationConfig(UserRole.ADMINISTRATOR);
      const employee = getNavigationConfig(UserRole.EMPLOYEE);
      const customer = getNavigationConfig(UserRole.CUSTOMER);

      // Verificar jerarquía de permisos
      expect(superAdmin.canDeleteOrders).toBe(true);
      expect(admin.canDeleteOrders).toBe(false);
      expect(employee.canDeleteOrders).toBe(false);
      expect(customer.canDeleteOrders).toBe(false);

      // Verificar que super admin tenga más permisos que admin
      expect(superAdmin.canDeleteOrders).toBe(true);
      expect(admin.canDeleteOrders).toBe(false);

      // Verificar que admin y super admin puedan gestionar usuarios
      expect(superAdmin.showUserManagement).toBe(true);
      expect(admin.showUserManagement).toBe(true);
      expect(employee.showUserManagement).toBe(false);
      expect(customer.showUserManagement).toBe(false);
    });

    it('debería mantener consistencia con la refactorización Customer-User', () => {
      // Verificar que el rol CUSTOMER esté correctamente integrado
      const customerConfig = getNavigationConfig(UserRole.CUSTOMER);
      
      // Los customers deberían tener acceso muy limitado
      expect(customerConfig.showUsersTab).toBe(false);
      expect(customerConfig.showCreateOrder).toBe(false);
      expect(customerConfig.showUserManagement).toBe(false);
      expect(customerConfig.canEditAllOrders).toBe(false);
      expect(customerConfig.canDeleteOrders).toBe(false);
    });
  });
});

describe('🎯 Validación de arquitectura unificada', () => {
  
  describe('Consistencia de roles después de refactorización', () => {
    it('debería mantener todos los roles definidos', () => {
      const expectedRoles = [
        UserRole.SUPER_ADMINISTRATOR,
        UserRole.ADMINISTRATOR,
        UserRole.EMPLOYEE,
        UserRole.CUSTOMER,
      ];

      expectedRoles.forEach(role => {
        expect(() => getNavigationConfig(role)).not.toThrow();
        const config = getNavigationConfig(role);
        expect(config).toBeDefined();
      });
    });

    it('debería tener configuración por defecto para roles no definidos', () => {
      // Esto no debería pasar en producción, pero es una prueba de robustez
      const config = getNavigationConfig('INVALID_ROLE' as UserRole);
      
      expect(config).toEqual({
        showUsersTab: false,
        showCreateOrder: false,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      });
    });
  });
}); 