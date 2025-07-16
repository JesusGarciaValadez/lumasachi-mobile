/**
 * Custom hook for permissions management
 * 
 * Provides reactive functions to verify authenticated user permissions
 * and synchronize permissions from the API when available.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { PermissionsService, Permission, PERMISSIONS } from '../services/permissionsService';
import { UserRole } from '../types';

/**
 * Interface for the usePermissions hook result
 */
interface UsePermissionsResult {
  // Permission verification
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  
  // Current user permissions
  userPermissions: Permission[];
  userRole: UserRole | null;
  
  // Screen access verification
  canAccessScreen: (screenName: string) => boolean;
  canAccessTab: (tabName: string) => boolean;
  
  // Common specific permissions verification
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateOrders: boolean;
  canEditOrders: boolean;
  canDeleteOrders: boolean;
  canAssignOrders: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canAccessSystemSettings: boolean;
  canAccessSystemLogs: boolean;
  
  // Loading state
  isLoading: boolean;
  
  // Function to refresh permissions from API (when available)
  refreshPermissions: () => Promise<void>;
}

/**
 * Custom hook for permissions management
 */
export const usePermissions = (): UsePermissionsResult => {
  const { user, isLoading } = useAuth();
  
  // Memoize user permissions to avoid recalculating on each render
  const userPermissions = useMemo(() => {
    if (!user) return [];
    return PermissionsService.getPermissionsForRole(user.role);
  }, [user]);
  
  // Function to verify a specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return PermissionsService.hasPermission(user.role, permission);
  };
  
  // Function to verify if the user has any of the specified permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return PermissionsService.hasAnyPermission(user.role, permissions);
  };
  
  // Function to verify if the user has all the specified permissions
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return PermissionsService.hasAllPermissions(user.role, permissions);
  };
  
  // Function to verify screen access
  const canAccessScreen = (screenName: string): boolean => {
    if (!user) return false;
    return PermissionsService.canAccessScreen(user.role, screenName);
  };
  
  // Function to verify tab access
  const canAccessTab = (tabName: string): boolean => {
    if (!user) return false;
    return PermissionsService.canAccessTab(user.role, tabName);
  };
  
  // Common specific permissions (memoized for better performance)
  const canCreateUsers = useMemo(() => hasPermission(PERMISSIONS.USERS.CREATE), [user]);
  const canEditUsers = useMemo(() => hasPermission(PERMISSIONS.USERS.UPDATE), [user]);
  const canDeleteUsers = useMemo(() => hasPermission(PERMISSIONS.USERS.DELETE), [user]);
  const canCreateOrders = useMemo(() => hasPermission(PERMISSIONS.ORDERS.CREATE), [user]);
  const canEditOrders = useMemo(() => hasPermission(PERMISSIONS.ORDERS.UPDATE), [user]);
  const canDeleteOrders = useMemo(() => hasPermission(PERMISSIONS.ORDERS.DELETE), [user]);
  const canAssignOrders = useMemo(() => hasPermission(PERMISSIONS.ORDERS.ASSIGN), [user]);
  const canViewReports = useMemo(() => hasPermission(PERMISSIONS.REPORTS.VIEW), [user]);
  const canExportData = useMemo(() => hasPermission(PERMISSIONS.REPORTS.EXPORT), [user]);
  const canAccessSystemSettings = useMemo(() => hasPermission(PERMISSIONS.SYSTEM.SETTINGS), [user]);
  const canAccessSystemLogs = useMemo(() => hasPermission(PERMISSIONS.SYSTEM.LOGS), [user]);
  
  // Function to refresh permissions from API (implement when backend is available)
  const refreshPermissions = async (): Promise<void> => {
    // TODO: Implement when backend is available
    // try {
    //   const response = await httpClient.get('/api/user/permissions');
    //   // Synchronize permissions from backend
    //   console.log('Permissions refreshed from API:', response.data);
    // } catch (error) {
    //   console.error('Error refreshing permissions:', error);
    // }
    
    // For now, just log
    console.log('Permissions refresh requested (backend not available)');
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions,
    userRole: user?.role || null,
    canAccessScreen,
    canAccessTab,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canCreateOrders,
    canEditOrders,
    canDeleteOrders,
    canAssignOrders,
    canViewReports,
    canExportData,
    canAccessSystemSettings,
    canAccessSystemLogs,
    isLoading,
    refreshPermissions,
  };
};

/**
 * Specialized hook for verifying navigation permissions
 */
export const useNavigationPermissions = () => {
  const { user } = useAuth();
  const permissions = usePermissions();
  
  return useMemo(() => ({
    // Main navigation
    canAccessHome: true,
    canAccessOrders: true,
    canAccessProfile: true,
    canAccessSettings: true,
    canAccessUsers: permissions.hasPermission(PERMISSIONS.USERS.READ),
    
    // Specific screens
    canAccessCreateOrder: permissions.canCreateOrders,
    canAccessEditOrder: permissions.canEditOrders,
    canAccessUserManagement: permissions.hasAnyPermission([
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.READ,
      PERMISSIONS.USERS.UPDATE,
    ]),
    canAccessCreateUser: permissions.canCreateUsers,
    canAccessManageRoles: permissions.hasAnyPermission([
      PERMISSIONS.USERS.CREATE,
      PERMISSIONS.USERS.UPDATE,
    ]),
    canAccessViewReports: permissions.canViewReports,
    canAccessExportData: permissions.canExportData,
    
    // User configuration
    userRole: user?.role || null,
    isAdmin: user?.role === UserRole.ADMINISTRATOR || user?.role === UserRole.SUPER_ADMINISTRATOR,
    isSuperAdmin: user?.role === UserRole.SUPER_ADMINISTRATOR,
    isEmployee: user?.role === UserRole.EMPLOYEE,
    isCustomer: user?.role === UserRole.CUSTOMER,
  }), [permissions, user]);
};

export default usePermissions; 