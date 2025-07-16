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
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { UserRole } from '../../src/types';
import { 
  PermissionGuard, 
  RequirePermission, 
  RequireAnyPermission, 
  RequireAllPermissions,
  RequireRole,
  RequireAdmin,
  RequireSuperAdmin 
} from '../../src/components/PermissionGuard';
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

      expect(getByText('Loading...')).toBeTruthy();
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
}); 