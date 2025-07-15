import {UserRole} from '../types';

export const getRoleTranslationKey = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMINISTRATOR:
      return 'userManagement.roles.superAdministrator';
    case UserRole.ADMINISTRATOR:
      return 'userManagement.roles.administrator';
    case UserRole.EMPLOYEE:
      return 'userManagement.roles.employee';
    case UserRole.CUSTOMER:
      return 'userManagement.roles.customer';
    default:
      return 'userManagement.roles.employee'; // fallback
  }
};

export const translateRole = (role: UserRole, t: (key: string) => string): string => {
  return t(getRoleTranslationKey(role));
};

/**
 * Maps order status values to their corresponding translation keys
 */
export const getStatusTranslation = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Open': 'orders.statuses.open',
    'In Progress': 'orders.statuses.inProgress',
    'Ready for delivery': 'orders.statuses.readyForDelivery',
    'Delivered': 'orders.statuses.delivered',
    'Paid': 'orders.statuses.paid',
    'Returned': 'orders.statuses.returned',
    'Not paid': 'orders.statuses.notPaid',
    'Cancelled': 'orders.statuses.cancelled',
  };

  return statusMap[status] || 'orders.statuses.open'; // fallback to 'open' if status not found
}; 