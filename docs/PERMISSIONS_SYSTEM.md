# 🔐 Sistema de Permisos - Lumasachi Control

## Resumen

Este documento describe el sistema de permisos implementado en la aplicación Lumasachi Control React Native. El sistema proporciona un control de acceso granular basado en roles de usuario, sincronizado con el backend Laravel.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **PermissionsService** - Servicio central de gestión de permisos
2. **usePermissions** - Hook para verificación reactiva de permisos
3. **PermissionGuard** - Componente para proteger UI
4. **ApiPermissionsService** - Sincronización con backend
5. **Navegación protegida** - Rutas con validación de permisos

### Flujo de Permisos

```
Usuario autenticado → usePermissions → PermissionsService → Verificación → UI/Navegación
                                    ↓
                            ApiPermissionsService → Backend → Cache local
```

## 🔑 Definición de Permisos

### Estructura de Permisos

```typescript
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
};
```

### Matriz de Permisos por Rol

| Permiso | Super Admin | Admin | Employee | Customer |
|---------|-------------|-------|----------|----------|
| users.create | ✅ | ✅ | ❌ | ❌ |
| users.read | ✅ | ✅ | ❌ | ❌ |
| users.update | ✅ | ✅ | ❌ | ❌ |
| users.delete | ✅ | ❌ | ❌ | ❌ |
| orders.create | ✅ | ✅ | ✅ | ❌ |
| orders.read | ✅ | ✅ | ✅ | ✅ |
| orders.update | ✅ | ✅ | ✅ | ❌ |
| orders.delete | ✅ | ❌ | ❌ | ❌ |
| orders.assign | ✅ | ✅ | ❌ | ❌ |
| orders.status_change | ✅ | ✅ | ✅ | ❌ |
| reports.view | ✅ | ✅ | ❌ | ❌ |
| reports.export | ✅ | ✅ | ❌ | ❌ |
| system.settings | ✅ | ❌ | ❌ | ❌ |
| system.logs | ✅ | ❌ | ❌ | ❌ |

## 📚 Guía de Uso

### 1. Hook usePermissions

```typescript
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../services/permissionsService';

const MyComponent = () => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreateUsers,
    canEditOrders,
    userRole,
    isLoading,
  } = usePermissions();

  // Verificación de permiso individual
  const canCreate = hasPermission(PERMISSIONS.USERS.CREATE);
  
  // Verificación de múltiples permisos (cualquiera)
  const canManageUsers = hasAnyPermission([
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
  ]);
  
  // Verificación de múltiples permisos (todos)
  const canFullyManageUsers = hasAllPermissions([
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
  ]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <View>
      {canCreateUsers && <CreateUserButton />}
      {canEditOrders && <EditOrderButton />}
    </View>
  );
};
```

### 2. Componente PermissionGuard

#### Uso Básico

```typescript
import { RequirePermission, RequireAdmin } from '../components/PermissionGuard';
import { PERMISSIONS } from '../services/permissionsService';

const MyScreen = () => {
  return (
    <ScrollView>
      {/* Mostrar solo si tiene permiso */}
      <RequirePermission permission={PERMISSIONS.USERS.CREATE}>
        <CreateUserButton />
      </RequirePermission>

      {/* Mostrar solo para administradores */}
      <RequireAdmin>
        <AdminPanel />
      </RequireAdmin>

      {/* Ocultar completamente si no tiene permiso */}
      <RequirePermission 
        permission={PERMISSIONS.ORDERS.DELETE} 
        hideIfUnauthorized
      >
        <DeleteOrderButton />
      </RequirePermission>
    </ScrollView>
  );
};
```

#### Opciones Avanzadas

```typescript
import { PermissionGuard } from '../components/PermissionGuard';

const AdvancedExample = () => {
  return (
    <PermissionGuard
      permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.UPDATE]}
      checkType="any"
      fallback={<Text>No tienes permisos suficientes</Text>}
      showUnauthorizedMessage={false}
      onUnauthorized={() => console.log('Usuario sin permisos')}
    >
      <UserManagementPanel />
    </PermissionGuard>
  );
};
```

### 3. Componentes Especializados

```typescript
// Verificar permiso específico
<RequirePermission permission={PERMISSIONS.USERS.CREATE}>
  <CreateButton />
</RequirePermission>

// Verificar múltiples permisos (cualquiera)
<RequireAnyPermission permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.UPDATE]}>
  <UserActions />
</RequireAnyPermission>

// Verificar múltiples permisos (todos)
<RequireAllPermissions permissions={[PERMISSIONS.USERS.CREATE, PERMISSIONS.USERS.READ]}>
  <FullUserPanel />
</RequireAllPermissions>

// Verificar roles específicos
<RequireRole roles={[UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR]}>
  <AdminOnlyContent />
</RequireRole>

// Solo administradores (Administrator y Super Administrator)
<RequireAdmin>
  <AdminPanel />
</RequireAdmin>

// Solo super administradores
<RequireSuperAdmin>
  <SystemSettings />
</RequireSuperAdmin>
```

### 4. Navegación Protegida

La navegación está automáticamente protegida por permisos:

```typescript
// RootNavigator.tsx
const withPermissionCheck = <P extends object>(
  Component: React.ComponentType<P>,
  checkPermission: (permissions: ReturnType<typeof usePermissions>) => boolean
) => {
  return (props: P) => {
    const permissions = usePermissions();
    
    if (!checkPermission(permissions)) {
      return <UnauthorizedScreen />;
    }
    
    return <Component {...props} />;
  };
};

// Aplicar protección a pantallas
const ProtectedCreateUserScreen = withPermissionCheck(
  CreateUserScreen, 
  (permissions) => permissions.canCreateUsers
);
```

## 🔄 Sincronización con Backend

### Configuración de API

```typescript
// ApiPermissionsService maneja la sincronización
const permissions = await ApiPermissionsService.syncPermissions(userId);

// Cache automático con TTL de 5 minutos
const cachedPermissions = await ApiPermissionsService.getPermissionsFromCache();

// Actualizar permisos de rol
await ApiPermissionsService.updateRolePermissions(UserRole.ADMINISTRATOR, newPermissions);
```

### Estados de Sincronización

- **Cache Hit**: Permisos servidos desde cache local
- **Cache Miss**: Solicitud al backend y actualización de cache
- **Offline**: Uso de permisos en cache hasta reconexión
- **Error**: Fallback a permisos por defecto del rol

## 🧪 Testing

### Tests de Servicio

```typescript
import { PermissionsService, PERMISSIONS } from '../services/permissionsService';

describe('PermissionsService', () => {
  it('debería verificar permisos correctamente', () => {
    const hasPermission = PermissionsService.hasPermission(
      UserRole.ADMINISTRATOR,
      PERMISSIONS.USERS.CREATE
    );
    expect(hasPermission).toBe(true);
  });
});
```

### Tests de Componentes

```typescript
import { render } from '@testing-library/react-native';
import { RequirePermission } from '../components/PermissionGuard';

// Mock del hook usePermissions
jest.mock('../hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({
    hasPermission: jest.fn().mockReturnValue(true),
    userRole: UserRole.ADMINISTRATOR,
    isLoading: false,
  })),
}));

it('debería mostrar contenido cuando tiene permisos', () => {
  const { getByText } = render(
    <RequirePermission permission={PERMISSIONS.USERS.CREATE}>
      <Text>Crear Usuario</Text>
    </RequirePermission>
  );
  
  expect(getByText('Crear Usuario')).toBeTruthy();
});
```

## 📋 Mejores Prácticas

### 1. Verificación de Permisos

```typescript
// ✅ Bueno: Usar hook usePermissions
const { canCreateUsers } = usePermissions();

// ❌ Malo: Verificar roles directamente
const canCreate = user.role === UserRole.ADMINISTRATOR;
```

### 2. Componentes Protegidos

```typescript
// ✅ Bueno: Usar PermissionGuard
<RequirePermission permission={PERMISSIONS.USERS.CREATE}>
  <CreateUserButton />
</RequirePermission>

// ❌ Malo: Lógica condicional manual
{user.role === UserRole.ADMINISTRATOR && <CreateUserButton />}
```

### 3. Navegación

```typescript
// ✅ Bueno: Usar funciones de PermissionsService
const canAccess = PermissionsService.canAccessScreen(user.role, 'CreateUser');

// ❌ Malo: Lógica hardcodeada
const canAccess = user.role === UserRole.ADMINISTRATOR || user.role === UserRole.SUPER_ADMINISTRATOR;
```

### 4. Manejo de Estados

```typescript
// ✅ Bueno: Manejar estado de loading
const { isLoading, hasPermission } = usePermissions();

if (isLoading) return <LoadingSpinner />;

// ❌ Malo: No manejar loading
const { hasPermission } = usePermissions();
```

## 🔧 Configuración Avanzada

### Personalizar Permisos

```typescript
// Agregar nuevos permisos
export const CUSTOM_PERMISSIONS = {
  ...PERMISSIONS,
  CUSTOM: {
    FEATURE_X: 'custom.feature_x',
    FEATURE_Y: 'custom.feature_y',
  },
};

// Extender matriz de permisos
const EXTENDED_ROLE_PERMISSIONS = {
  ...ROLE_PERMISSIONS,
  [UserRole.CUSTOM_ROLE]: [
    PERMISSIONS.ORDERS.READ,
    CUSTOM_PERMISSIONS.CUSTOM.FEATURE_X,
  ],
};
```

### Cache Personalizado

```typescript
// Configurar TTL personalizado
ApiPermissionsService.CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Implementar AsyncStorage para persistencia
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reemplazar localStorage con AsyncStorage en ApiPermissionsService
```

## 🚨 Consideraciones de Seguridad

### Principios

1. **Nunca confiar solo en el frontend**: Los permisos del cliente son solo para UX
2. **Validación del backend**: Cada endpoint debe validar permisos
3. **Principio de menor privilegio**: Dar el mínimo permiso necesario
4. **Auditabilidad**: Registrar acciones sensibles

### Implementación

```typescript
// ✅ Bueno: UI + Backend validation
const { canDeleteUser } = usePermissions();

const handleDelete = async () => {
  if (!canDeleteUser) return; // UI check
  
  try {
    await api.deleteUser(userId); // Backend will validate again
  } catch (error) {
    if (error.status === 403) {
      // Handle permission denied
    }
  }
};
```

## 🔄 Migración y Actualizaciones

### Actualizar Permisos

1. Actualizar `PERMISSIONS` en `permissionsService.ts`
2. Actualizar `ROLE_PERMISSIONS` matrix
3. Actualizar `PERMISSION_METADATA` para UI
4. Actualizar backend correspondiente
5. Ejecutar tests
6. Limpiar cache: `ApiPermissionsService.clearPermissionsCache()`

### Versionado

```typescript
// Mantener compatibilidad hacia atrás
const PERMISSIONS_V1 = { /* old permissions */ };
const PERMISSIONS_V2 = { /* new permissions */ };

// Migración automática
const migratePermissions = (oldPermissions: string[]) => {
  return oldPermissions.map(permission => {
    return PERMISSION_MIGRATION_MAP[permission] || permission;
  });
};
```

## 📊 Métricas y Monitoreo

### Logging

```typescript
// Registrar uso de permisos
const logPermissionCheck = (permission: string, granted: boolean) => {
  analytics.track('permission_check', {
    permission,
    granted,
    userRole: user.role,
    timestamp: new Date().toISOString(),
  });
};
```

### Métricas Útiles

- Permisos más verificados
- Intentos de acceso denegados
- Tiempo de respuesta de verificación
- Uso de cache vs API

## 🎯 Conclusión

El sistema de permisos de Lumasachi Control proporciona:

- ✅ **Control granular** de acceso por rol
- ✅ **Sincronización automática** con backend
- ✅ **Componentes reutilizables** para protección de UI
- ✅ **Cache inteligente** para mejor performance
- ✅ **Testing comprehensivo** para confiabilidad
- ✅ **Documentación completa** para mantenimiento

Este sistema asegura que solo usuarios autorizados puedan acceder a funcionalidades específicas, mejorando la seguridad y experiencia de usuario de la aplicación.

---

*Documento actualizado: 2024-01-15*  
*Versión: 1.0.0*  
*Autor: Lumasachi Control Team* 