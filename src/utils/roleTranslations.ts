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