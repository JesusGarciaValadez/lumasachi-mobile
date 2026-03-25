import {UserRole} from '@/types';

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
    'Completed': 'orders.statuses.completed',
    'Delivered': 'orders.statuses.delivered',
    'Paid': 'orders.statuses.paid',
    'Returned': 'orders.statuses.returned',
    'Not paid': 'orders.statuses.notPaid',
    'On hold': 'orders.statuses.onHold',
    'Cancelled': 'orders.statuses.cancelled',
    // Lifecycle statuses
    'Received': 'orders.statuses.received',
    'Awaiting Review': 'orders.statuses.awaitingReview',
    'Reviewed': 'orders.statuses.reviewed',
    'Awaiting Customer Approval': 'orders.statuses.awaitingCustomerApproval',
    'Ready for Work': 'orders.statuses.readyForWork',
    'Ready for Delivery': 'orders.statuses.readyForDelivery',
  };

  return statusMap[status] || 'orders.statuses.open';
};
