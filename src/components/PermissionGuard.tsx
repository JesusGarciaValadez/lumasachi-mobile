/**
 * PermissionGuard Component
 * 
 * Protects UI elements by verifying user permissions before displaying content.
 * Supports multiple types of permission verification and fallback components.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import { Permission } from '../services/permissionsService';
import { UserRole } from '../types';
import { useTranslationSafe } from '../hooks/useTranslationSafe';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * Types of permission verification
 */
type PermissionCheckType = 'any' | 'all' | 'exact';

/**
 * Props for the PermissionGuard component
 */
interface PermissionGuardProps {
  // Required permissions
  permissions?: Permission[];
  
  // Allowed roles (alternative to permissions)
  roles?: UserRole[];
  
  // Type of verification when multiple permissions are passed
  checkType?: PermissionCheckType;
  
  // Content to display if user has permissions
  children: ReactNode;
  
  // Fallback component if no permissions
  fallback?: ReactNode;
  
  // Show unauthorized message by default
  showUnauthorizedMessage?: boolean;
  
  // Custom unauthorized message
  unauthorizedMessage?: string;
  
  // Hide component completely if no permissions (don't show fallback)
  hideIfUnauthorized?: boolean;
  
  // Additional style class
  style?: any;
  
  // Callback function when user doesn't have permissions
  onUnauthorized?: () => void;
}

/**
 * Default unauthorized message component
 */
const DefaultUnauthorizedMessage: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslationSafe();
  
  return (
    <View style={styles.unauthorizedContainer}>
      <Icon name="block" size={24} color="#ccc" />
      <Text style={styles.unauthorizedText}>
        {message || (t('common.noPermission') as string)}
      </Text>
    </View>
  );
};

/**
 * Main PermissionGuard component
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions = [],
  roles = [],
  checkType = 'any',
  children,
  fallback,
  showUnauthorizedMessage = false,
  unauthorizedMessage,
  hideIfUnauthorized = false,
  style,
  onUnauthorized,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    isLoading,
  } = usePermissions();
  
  const { t } = useTranslationSafe();
  
  // Show loading while permissions are being loaded
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>{t('common.loadingPermissions') as string}</Text>
      </View>
    );
  }
  
  // Verify permissions if specified
  let hasRequiredPermissions = true;
  
  if (permissions.length > 0) {
    switch (checkType) {
      case 'any':
        hasRequiredPermissions = hasAnyPermission(permissions);
        break;
      case 'all':
        hasRequiredPermissions = hasAllPermissions(permissions);
        break;
      case 'exact':
        hasRequiredPermissions = permissions.length === 1 && hasPermission(permissions[0]);
        break;
    }
  }
  
  // Verify roles if specified
  let hasRequiredRole = true;
  
  if (roles.length > 0) {
    hasRequiredRole = userRole ? roles.includes(userRole) : false;
  }
  
  // User must have both the permissions and the required role
  const isAuthorized = hasRequiredPermissions && hasRequiredRole;
  
  // Call callback if not authorized
  if (!isAuthorized && onUnauthorized) {
    onUnauthorized();
  }
  
  // If authorized, show content
  if (isAuthorized) {
    return <View style={style}>{children}</View>;
  }
  
  // If not authorized and should be hidden completely
  if (hideIfUnauthorized) {
    return null;
  }
  
  // Show custom fallback
  if (fallback) {
    return <View style={style}>{fallback}</View>;
  }
  
  // Show default unauthorized message
  if (showUnauthorizedMessage) {
    return (
      <View style={style}>
        <DefaultUnauthorizedMessage message={unauthorizedMessage} />
      </View>
    );
  }
  
  // By default, show nothing
  return null;
};

/**
 * Specialized component to verify a specific permission
 */
export const RequirePermission: React.FC<{
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ permission, children, fallback, hideIfUnauthorized = false }) => {
  return (
    <PermissionGuard
      permissions={[permission]}
      checkType="exact"
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Specialized component to verify multiple permissions (any)
 */
export const RequireAnyPermission: React.FC<{
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ permissions, children, fallback, hideIfUnauthorized = false }) => {
  return (
    <PermissionGuard
      permissions={permissions}
      checkType="any"
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Specialized component to verify multiple permissions (all)
 */
export const RequireAllPermissions: React.FC<{
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ permissions, children, fallback, hideIfUnauthorized = false }) => {
  return (
    <PermissionGuard
      permissions={permissions}
      checkType="all"
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Specialized component to verify specific roles
 */
export const RequireRole: React.FC<{
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ roles, children, fallback, hideIfUnauthorized = false }) => {
  return (
    <PermissionGuard
      roles={roles}
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Specialized component for administrators
 */
export const RequireAdmin: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ children, fallback, hideIfUnauthorized = false }) => {
  return (
    <RequireRole
      roles={[UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR]}
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </RequireRole>
  );
};

/**
 * Specialized component for super administrators
 */
export const RequireSuperAdmin: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  hideIfUnauthorized?: boolean;
}> = ({ children, fallback, hideIfUnauthorized = false }) => {
  return (
    <RequireRole
      roles={[UserRole.SUPER_ADMINISTRATOR]}
      fallback={fallback}
      hideIfUnauthorized={hideIfUnauthorized}
    >
      {children}
    </RequireRole>
  );
};

/**
 * Component styles
 */
const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  unauthorizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    fontStyle: 'italic',
  },
});

export default PermissionGuard; 