/**
 * Permissions service for Lumasachi Control application
 * 
 * Defines all available permissions for each role and provides functions
 * to verify permissions in a centralized manner.
 * 
 * @author Lumasachi Control Team
 * @date 2024-01-15
 */

import { UserRole } from '../types';

// Definition of all available permissions in the application
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
} as const;

// Type for permissions
export type Permission = 
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.ORDERS[keyof typeof PERMISSIONS.ORDERS]
  | typeof PERMISSIONS.REPORTS[keyof typeof PERMISSIONS.REPORTS]
  | typeof PERMISSIONS.SYSTEM[keyof typeof PERMISSIONS.SYSTEM];

// Permission matrix by role (based on backend documentation)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMINISTRATOR]: [
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.ORDERS.READ,
    PERMISSIONS.ORDERS.UPDATE,
    PERMISSIONS.ORDERS.DELETE,
    PERMISSIONS.ORDERS.ASSIGN,
    PERMISSIONS.ORDERS.STATUS_CHANGE,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.REPORTS.EXPORT,
    PERMISSIONS.SYSTEM.SETTINGS,
    PERMISSIONS.SYSTEM.LOGS,
  ],
  [UserRole.ADMINISTRATOR]: [
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.ORDERS.READ,
    PERMISSIONS.ORDERS.UPDATE,
    PERMISSIONS.ORDERS.ASSIGN,
    PERMISSIONS.ORDERS.STATUS_CHANGE,
    PERMISSIONS.REPORTS.VIEW,
    PERMISSIONS.REPORTS.EXPORT,
  ],
  [UserRole.EMPLOYEE]: [
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.ORDERS.READ,
    PERMISSIONS.ORDERS.UPDATE,
    PERMISSIONS.ORDERS.STATUS_CHANGE,
  ],
  [UserRole.CUSTOMER]: [
    PERMISSIONS.ORDERS.READ,
  ],
};

// Permission metadata for UI display
export const PERMISSION_METADATA = {
  [PERMISSIONS.USERS.CREATE]: {
    name: 'userManagement.permissions.createUsers',
    description: 'userManagement.permissions.createUsersDesc',
    category: 'users',
  },
  [PERMISSIONS.USERS.READ]: {
    name: 'userManagement.permissions.readUsers',
    description: 'userManagement.permissions.readUsersDesc',
    category: 'users',
  },
  [PERMISSIONS.USERS.UPDATE]: {
    name: 'userManagement.permissions.updateUsers',
    description: 'userManagement.permissions.updateUsersDesc',
    category: 'users',
  },
  [PERMISSIONS.USERS.DELETE]: {
    name: 'userManagement.permissions.deleteUsers',
    description: 'userManagement.permissions.deleteUsersDesc',
    category: 'users',
  },
  [PERMISSIONS.ORDERS.CREATE]: {
    name: 'userManagement.permissions.createOrders',
    description: 'userManagement.permissions.createOrdersDesc',
    category: 'orders',
  },
  [PERMISSIONS.ORDERS.READ]: {
    name: 'userManagement.permissions.readOrders',
    description: 'userManagement.permissions.readOrdersDesc',
    category: 'orders',
  },
  [PERMISSIONS.ORDERS.UPDATE]: {
    name: 'userManagement.permissions.updateOrders',
    description: 'userManagement.permissions.updateOrdersDesc',
    category: 'orders',
  },
  [PERMISSIONS.ORDERS.DELETE]: {
    name: 'userManagement.permissions.deleteOrders',
    description: 'userManagement.permissions.deleteOrdersDesc',
    category: 'orders',
  },
  [PERMISSIONS.ORDERS.ASSIGN]: {
    name: 'userManagement.permissions.assignOrders',
    description: 'userManagement.permissions.assignOrdersDesc',
    category: 'orders',
  },
  [PERMISSIONS.ORDERS.STATUS_CHANGE]: {
    name: 'userManagement.permissions.changeOrderStatus',
    description: 'userManagement.permissions.changeOrderStatusDesc',
    category: 'orders',
  },
  [PERMISSIONS.REPORTS.VIEW]: {
    name: 'userManagement.permissions.viewReports',
    description: 'userManagement.permissions.viewReportsDesc',
    category: 'reports',
  },
  [PERMISSIONS.REPORTS.EXPORT]: {
    name: 'userManagement.permissions.exportReports',
    description: 'userManagement.permissions.exportReportsDesc',
    category: 'reports',
  },
  [PERMISSIONS.SYSTEM.SETTINGS]: {
    name: 'userManagement.permissions.systemSettings',
    description: 'userManagement.permissions.systemSettingsDesc',
    category: 'system',
  },
  [PERMISSIONS.SYSTEM.LOGS]: {
    name: 'userManagement.permissions.systemLogs',
    description: 'userManagement.permissions.systemLogsDesc',
    category: 'system',
  },
};

/**
 * Main permissions service
 */
export class PermissionsService {
  /**
   * Gets all permissions for a specific role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Verifies if a role has a specific permission
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return rolePermissions.includes(permission);
  }

  /**
   * Verifies if a role has any of the specified permissions
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Verifies if a role has all the specified permissions
   */
  static hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Gets the metadata of a permission
   */
  static getPermissionMetadata(permission: Permission) {
    return PERMISSION_METADATA[permission];
  }

  /**
   * Gets all permissions grouped by category
   */
  static getPermissionsByCategory(): Record<string, Permission[]> {
    const categories: Record<string, Permission[]> = {};
    
    Object.entries(PERMISSION_METADATA).forEach(([permission, metadata]) => {
      if (!categories[metadata.category]) {
        categories[metadata.category] = [];
      }
      categories[metadata.category].push(permission as Permission);
    });
    
    return categories;
  }

  /**
   * Gets all permissions for display in the role management UI
   */
  static getAllPermissions(): Permission[] {
    return Object.values(PERMISSIONS).flatMap(category => Object.values(category));
  }

  /**
   * Compares permissions between two roles
   */
  static compareRolePermissions(role1: UserRole, role2: UserRole): {
    common: Permission[];
    unique1: Permission[];
    unique2: Permission[];
  } {
    const permissions1 = this.getPermissionsForRole(role1);
    const permissions2 = this.getPermissionsForRole(role2);
    
    const common = permissions1.filter(p => permissions2.includes(p));
    const unique1 = permissions1.filter(p => !permissions2.includes(p));
    const unique2 = permissions2.filter(p => !permissions1.includes(p));
    
    return { common, unique1, unique2 };
  }

  /**
   * Utility function to verify navigation permissions
   */
  static canAccessScreen(role: UserRole, screenName: string): boolean {
    switch (screenName) {
      case 'CreateOrder':
        return this.hasPermission(role, PERMISSIONS.ORDERS.CREATE);
      case 'EditOrder':
        return this.hasPermission(role, PERMISSIONS.ORDERS.UPDATE);
      case 'UserManagement':
      case 'CreateUser':
      case 'ManageRoles':
        return this.hasAnyPermission(role, [
          PERMISSIONS.USERS.CREATE,
          PERMISSIONS.USERS.READ,
          PERMISSIONS.USERS.UPDATE,
        ]);
      case 'ViewReports':
        return this.hasPermission(role, PERMISSIONS.REPORTS.VIEW);
      case 'ExportData':
        return this.hasPermission(role, PERMISSIONS.REPORTS.EXPORT);
      case 'Settings':
        return true; // Everyone can access basic settings
      case 'SystemSettings':
        return this.hasPermission(role, PERMISSIONS.SYSTEM.SETTINGS);
      default:
        return true; // By default, allow access to unspecified screens
    }
  }

  /**
   * Utility function to verify tab navigation permissions
   */
  static canAccessTab(role: UserRole, tabName: string): boolean {
    switch (tabName) {
      case 'Users':
        return this.hasPermission(role, PERMISSIONS.USERS.READ);
      case 'Home':
      case 'Orders':
      case 'Profile':
      case 'Settings':
        return true; // Everyone can access these tabs
      default:
        return false;
    }
  }
}

// Export default instance
export default PermissionsService; 