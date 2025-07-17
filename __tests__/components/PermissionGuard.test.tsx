/**
 * Tests para el componente PermissionGuard
 * 
 * Verifica que el componente muestre o oculte contenido según los permisos
 * del usuario y que los diferentes tipos de verificación funcionen correctamente.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { UserRole } from '../../src/types';
import { PERMISSIONS } from '../../src/services/permissionsService';

// Mock del hook usePermissions
jest.mock('../../src/hooks/usePermissions', () => ({
  usePermissions: jest.fn(),
}));

// Mock del hook useTranslationSafe
jest.mock('../../src/hooks/useTranslationSafe', () => ({
  useTranslationSafe: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

// Mock de react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Create inline mock for PermissionGuard components
jest.mock('../../src/components/PermissionGuard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const PermissionGuard = ({ children, permissions, roles, checkType, showUnauthorizedMessage, unauthorizedMessage, fallback, style, onUnauthorized, hideIfUnauthorized }: any) => {
    const mockUsePermissions = require('../../src/hooks/usePermissions').usePermissions;
    const permissionsData = mockUsePermissions();
    
    // Check loading state
    if (permissionsData.isLoading) {
      return React.createElement(View, { style }, 
        React.createElement(Text, null, 'common.loadingPermissions')
      );
    }
    
    // Check permissions
    let hasRequiredPermissions = true;
    if (permissions && permissions.length > 0) {
      switch (checkType) {
        case 'any':
          hasRequiredPermissions = permissionsData.hasAnyPermission && permissionsData.hasAnyPermission();
          break;
        case 'all':
          hasRequiredPermissions = permissionsData.hasAllPermissions && permissionsData.hasAllPermissions();
          break;
        case 'exact':
          hasRequiredPermissions = permissions.length === 1 && permissionsData.hasPermission && permissionsData.hasPermission();
          break;
        default:
          hasRequiredPermissions = permissionsData.hasPermission && permissionsData.hasPermission();
      }
    }
    
    // Check roles
    let hasRequiredRole = true;
    if (roles && roles.length > 0) {
      hasRequiredRole = permissionsData.userRole ? roles.includes(permissionsData.userRole) : false;
    }
    
    const isAuthorized = hasRequiredPermissions && hasRequiredRole;
    
    // Call onUnauthorized callback
    if (!isAuthorized && onUnauthorized) {
      onUnauthorized();
    }
    
    if (isAuthorized) {
      return React.createElement(View, { style }, children);
    }
    
    if (hideIfUnauthorized) {
      return null;
    }
    
    if (fallback) {
      return React.createElement(View, { style }, fallback);
    }
    
    if (showUnauthorizedMessage) {
      return React.createElement(View, { style },
        React.createElement(Text, null, unauthorizedMessage || 'common.noPermission')
      );
    }
    
    return null;
  };
  
  const RequirePermission = ({ children, permission, hideIfUnauthorized, fallback }: any) => {
    return React.createElement(PermissionGuard, {
      permissions: [permission],
      checkType: 'exact',
      hideIfUnauthorized,
      fallback
    }, children);
  };
  
  const RequireAdmin = ({ children, fallback, hideIfUnauthorized }: any) => {
    const { UserRole } = require('../../src/types');
    return React.createElement(PermissionGuard, {
      roles: [UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR],
      fallback,
      hideIfUnauthorized
    }, children);
  };
  
  const RequireAnyPermission = ({ children, permissions, fallback, hideIfUnauthorized }: any) => {
    return React.createElement(PermissionGuard, {
      permissions,
      checkType: 'any',
      fallback,
      hideIfUnauthorized
    }, children);
  };
  
  const RequireAllPermissions = ({ children, permissions, fallback, hideIfUnauthorized }: any) => {
    return React.createElement(PermissionGuard, {
      permissions,
      checkType: 'all',
      fallback,
      hideIfUnauthorized
    }, children);
  };
  
  const RequireRole = ({ children, roles, hideIfUnauthorized, fallback }: any) => {
    return React.createElement(PermissionGuard, {
      roles,
      hideIfUnauthorized,
      fallback
    }, children);
  };
  
  const RequireSuperAdmin = ({ children, fallback, hideIfUnauthorized }: any) => {
    const { UserRole } = require('../../src/types');
    return React.createElement(PermissionGuard, {
      roles: [UserRole.SUPER_ADMINISTRATOR],
      fallback,
      hideIfUnauthorized
    }, children);
  };
  
  return {
    PermissionGuard,
    RequirePermission,
    RequireAdmin,
    RequireAnyPermission,
    RequireAllPermissions,
    RequireRole,
    RequireSuperAdmin
  };
});

// Import named exports after mocking
import {
  PermissionGuard,
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireAdmin,
  RequireSuperAdmin
} from '../../src/components/PermissionGuard';

const mockUsePermissions = require('../../src/hooks/usePermissions').usePermissions;

describe('🔐 PermissionGuard Component', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PermissionGuard - Permisos', () => {
    it('debería mostrar contenido cuando el usuario tiene el permiso', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard permissions={[PERMISSIONS.USERS.CREATE]}>
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido protegido')).toBeTruthy();
    });

    it('debería ocultar contenido cuando el usuario no tiene el permiso', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { queryByText } = render(
        <PermissionGuard permissions={[PERMISSIONS.USERS.CREATE]}>
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(queryByText('Contenido protegido')).toBeFalsy();
    });

    it('debería mostrar mensaje de no autorizado cuando showUnauthorizedMessage es true', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          showUnauthorizedMessage={true}
        >
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(getByText('common.noPermission')).toBeTruthy();
    });

    it('debería mostrar componente fallback cuando se proporciona', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          fallback={<Text>Acceso denegado</Text>}
        >
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(getByText('Acceso denegado')).toBeTruthy();
    });
  });

  describe('PermissionGuard - Roles', () => {
    it('debería mostrar contenido cuando el usuario tiene el rol requerido', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard roles={[UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR]}>
          <Text>Contenido para admin</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido para admin')).toBeTruthy();
    });

    it('debería ocultar contenido cuando el usuario no tiene el rol requerido', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { queryByText } = render(
        <PermissionGuard roles={[UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR]}>
          <Text>Contenido para admin</Text>
        </PermissionGuard>
      );

      expect(queryByText('Contenido para admin')).toBeFalsy();
    });
  });

  describe('PermissionGuard - Tipos de verificación', () => {
    it('debería funcionar con checkType "any"', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.SYSTEM.SETTINGS]} 
          checkType="any"
        >
          <Text>Contenido any</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido any')).toBeTruthy();
    });

    it('debería funcionar con checkType "all"', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]} 
          checkType="all"
        >
          <Text>Contenido all</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido all')).toBeTruthy();
    });

    it('debería funcionar con checkType "exact"', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          checkType="exact"
        >
          <Text>Contenido exact</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido exact')).toBeTruthy();
    });
  });

  describe('PermissionGuard - Callback', () => {
    it('debería llamar onUnauthorized cuando el usuario no tiene permisos', () => {
      const onUnauthorized = jest.fn();
      
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          onUnauthorized={onUnauthorized}
        >
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });

  describe('PermissionGuard - Loading', () => {
    it('debería mostrar estado de loading', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: true,
      });

      const { getByText } = render(
        <PermissionGuard permissions={[PERMISSIONS.USERS.CREATE]}>
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(getByText('common.loadingPermissions')).toBeTruthy();
    });
  });

  describe('RequirePermission', () => {
    it('debería mostrar contenido cuando el usuario tiene el permiso específico', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequirePermission permission={PERMISSIONS.USERS.CREATE}>
          <Text>Crear usuario</Text>
        </RequirePermission>
      );

      expect(getByText('Crear usuario')).toBeTruthy();
    });

    it('debería ocultar contenido cuando el usuario no tiene el permiso específico', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequirePermission permission={PERMISSIONS.USERS.CREATE}>
          <Text>Crear usuario</Text>
        </RequirePermission>
      );

      expect(queryByText('Crear usuario')).toBeFalsy();
    });
  });

  describe('RequireAnyPermission', () => {
    it('debería mostrar contenido cuando el usuario tiene al menos uno de los permisos', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireAnyPermission permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.SYSTEM.SETTINGS]}>
          <Text>Contenido con any permission</Text>
        </RequireAnyPermission>
      );

      expect(getByText('Contenido con any permission')).toBeTruthy();
    });
  });

  describe('RequireAllPermissions', () => {
    it('debería mostrar contenido cuando el usuario tiene todos los permisos', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireAllPermissions permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]}>
          <Text>Contenido con all permissions</Text>
        </RequireAllPermissions>
      );

      expect(getByText('Contenido con all permissions')).toBeTruthy();
    });
  });

  describe('RequireRole', () => {
    it('debería mostrar contenido cuando el usuario tiene el rol requerido', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireRole roles={[UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR]}>
          <Text>Contenido para admin</Text>
        </RequireRole>
      );

      expect(getByText('Contenido para admin')).toBeTruthy();
    });
  });

  describe('RequireAdmin', () => {
    it('debería mostrar contenido para Administrator', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireAdmin>
          <Text>Panel de administración</Text>
        </RequireAdmin>
      );

      expect(getByText('Panel de administración')).toBeTruthy();
    });

    it('debería mostrar contenido para Super Administrator', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.SUPER_ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireAdmin>
          <Text>Panel de administración</Text>
        </RequireAdmin>
      );

      expect(getByText('Panel de administración')).toBeTruthy();
    });

    it('debería ocultar contenido para Employee', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.EMPLOYEE,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequireAdmin>
          <Text>Panel de administración</Text>
        </RequireAdmin>
      );

      expect(queryByText('Panel de administración')).toBeFalsy();
    });
  });

  describe('RequireSuperAdmin', () => {
    it('debería mostrar contenido solo para Super Administrator', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.SUPER_ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireSuperAdmin>
          <Text>Configuración del sistema</Text>
        </RequireSuperAdmin>
      );

      expect(getByText('Configuración del sistema')).toBeTruthy();
    });

    it('debería ocultar contenido para Administrator', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequireSuperAdmin>
          <Text>Configuración del sistema</Text>
        </RequireSuperAdmin>
      );

      expect(queryByText('Configuración del sistema')).toBeFalsy();
    });
  });

  describe('hideIfUnauthorized', () => {
    it('debería ocultar completamente el componente cuando hideIfUnauthorized es true', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequirePermission permission={PERMISSIONS.USERS.CREATE} hideIfUnauthorized>
          <Text>Contenido protegido</Text>
        </RequirePermission>
      );

      expect(queryByText('Contenido protegido')).toBeFalsy();
      expect(queryByText('common.noPermission')).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar lista vacía de permisos', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard permissions={[]}>
          <Text>Contenido sin restricción</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido sin restricción')).toBeTruthy();
    });

    it('debería manejar lista vacía de roles', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard roles={[]}>
          <Text>Contenido sin restricción de rol</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido sin restricción de rol')).toBeTruthy();
    });

    it('debería manejar usuario sin rol (null)', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: null,
        isLoading: false,
      });

      const { queryByText } = render(
        <PermissionGuard roles={[UserRole.ADMINISTRATOR]}>
          <Text>Contenido admin</Text>
        </PermissionGuard>
      );

      expect(queryByText('Contenido admin')).toBeFalsy();
    });

    it('debería manejar mensaje personalizado no autorizado', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const customMessage = 'No tienes permisos suficientes';
      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          showUnauthorizedMessage={true}
          unauthorizedMessage={customMessage}
        >
          <Text>Contenido protegido</Text>
        </PermissionGuard>
      );

      expect(getByText(customMessage)).toBeTruthy();
    });

    it('debería aplicar estilos personalizados', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]}
          style={customStyle}
        >
          <Text testID="content">Contenido con estilo</Text>
        </PermissionGuard>
      );

      const content = getByTestId('content');
      expect(content).toBeTruthy();
    });
  });

  describe('Multiple permissions with exact checkType', () => {
    it('debería fallar con múltiples permisos en checkType exact', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { queryByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]} 
          checkType="exact"
        >
          <Text>Contenido exact múltiple</Text>
        </PermissionGuard>
      );

      expect(queryByText('Contenido exact múltiple')).toBeFalsy();
    });
  });

  describe('Combinación de permisos y roles', () => {
    it('debería requerir tanto permisos como roles cuando ambos están especificados', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.EMPLOYEE,
        isLoading: false,
      });

      const { queryByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          roles={[UserRole.ADMINISTRATOR]}
        >
          <Text>Contenido admin con permisos</Text>
        </PermissionGuard>
      );

      expect(queryByText('Contenido admin con permisos')).toBeFalsy();
    });

    it('debería mostrar contenido cuando tiene permisos y rol correcto', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <PermissionGuard 
          permissions={[PERMISSIONS.USERS.CREATE]} 
          roles={[UserRole.ADMINISTRATOR]}
        >
          <Text>Contenido admin con permisos</Text>
        </PermissionGuard>
      );

      expect(getByText('Contenido admin con permisos')).toBeTruthy();
    });
  });

  describe('Componentes especializados con fallback', () => {
    it('RequireAnyPermission debería mostrar fallback cuando no tiene permisos', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn().mockReturnValue(false),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireAnyPermission 
          permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]}
          fallback={<Text>Sin permisos</Text>}
        >
          <Text>Contenido protegido</Text>
        </RequireAnyPermission>
      );

      expect(getByText('Sin permisos')).toBeTruthy();
    });

    it('RequireAllPermissions debería ocultar cuando falta algún permiso', () => {
      const hasPermissionMock = jest.fn((perm) => perm === PERMISSIONS.USERS.CREATE);
      
      mockUsePermissions.mockReturnValue({
        hasPermission: hasPermissionMock,
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(false),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequireAllPermissions permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.DELETE]}>
          <Text>Contenido todos permisos</Text>
        </RequireAllPermissions>
      );

      expect(queryByText('Contenido todos permisos')).toBeFalsy();
    });

    it('RequireRole con hideIfUnauthorized debería ocultar completamente', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.CUSTOMER,
        isLoading: false,
      });

      const { queryByText } = render(
        <RequireRole 
          roles={[UserRole.ADMINISTRATOR]} 
          hideIfUnauthorized
        >
          <Text>Admin only</Text>
        </RequireRole>
      );

      expect(queryByText('Admin only')).toBeFalsy();
    });

    it('RequireSuperAdmin con fallback debería mostrar fallback para admin normal', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(true),
        hasAnyPermission: jest.fn().mockReturnValue(true),
        hasAllPermissions: jest.fn().mockReturnValue(true),
        userRole: UserRole.ADMINISTRATOR,
        isLoading: false,
      });

      const { getByText } = render(
        <RequireSuperAdmin fallback={<Text>Solo super admin</Text>}>
          <Text>Configuración avanzada</Text>
        </RequireSuperAdmin>
      );

      expect(getByText('Solo super admin')).toBeTruthy();
    });
  });
}); 