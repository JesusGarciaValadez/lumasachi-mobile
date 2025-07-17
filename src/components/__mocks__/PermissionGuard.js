const React = require('react');
const { View, Text } = require('react-native');

// Get the UserRole enum values
const { UserRole } = require('../../../src/types');

// Mock implementation of PermissionGuard and related components
const PermissionGuard = ({ children, permissions, roles, checkType, showUnauthorizedMessage, unauthorizedMessage, fallback, style, onUnauthorized, hideIfUnauthorized }) => {
  const mockUsePermissions = require('../../../src/hooks/usePermissions').usePermissions;
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

const RequirePermission = ({ children, permission, hideIfUnauthorized, fallback }) => {
  return React.createElement(PermissionGuard, {
    permissions: [permission],
    checkType: 'exact',
    hideIfUnauthorized,
    fallback
  }, children);
};

const RequireAdmin = ({ children, fallback, hideIfUnauthorized }) => {
  return React.createElement(PermissionGuard, {
    roles: [UserRole.ADMINISTRATOR, UserRole.SUPER_ADMINISTRATOR],
    fallback,
    hideIfUnauthorized
  }, children);
};

const RequireAnyPermission = ({ children, permissions, fallback, hideIfUnauthorized }) => {
  return React.createElement(PermissionGuard, {
    permissions,
    checkType: 'any',
    fallback,
    hideIfUnauthorized
  }, children);
};

const RequireAllPermissions = ({ children, permissions, fallback, hideIfUnauthorized }) => {
  return React.createElement(PermissionGuard, {
    permissions,
    checkType: 'all',
    fallback,
    hideIfUnauthorized
  }, children);
};

const RequireRole = ({ children, roles, hideIfUnauthorized, fallback }) => {
  return React.createElement(PermissionGuard, {
    roles,
    hideIfUnauthorized,
    fallback
  }, children);
};

const RequireSuperAdmin = ({ children, fallback, hideIfUnauthorized }) => {
  return React.createElement(PermissionGuard, {
    roles: [UserRole.SUPER_ADMINISTRATOR],
    fallback,
    hideIfUnauthorized
  }, children);
};

// Export all components
module.exports = {
  PermissionGuard,
  RequirePermission,
  RequireAdmin,
  RequireAnyPermission,
  RequireAllPermissions,
  RequireRole,
  RequireSuperAdmin
};
