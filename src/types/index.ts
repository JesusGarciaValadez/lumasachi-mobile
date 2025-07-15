// Tipos base para la aplicación Lumasachi Control

export enum UserRole {
  SUPER_ADMINISTRATOR = 'Super Administrator',
  ADMINISTRATOR = 'Administrator',
  EMPLOYEE = 'Employee',
  CUSTOMER = 'Customer',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  company?: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  languagePreference: 'en' | 'es';
  
  // Specific fields for users with the Customer role
  customerNotes?: string;
  customerType?: 'individual' | 'corporate';
  customerPreferences?: string;
  
  // Helper flags for easier usage
  isCustomer?: boolean;
  isEmployee?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  email: string;
  company: string;
  roleId: string;
}

export interface Role {
  id: string;
  roleName: UserRole;
  permissions: string[];
}

export interface PublishingStatus {
  id: string;
  statusName: 'Draft' | 'Ready For Review' | 'Needs Editing' | 'Published' | 'Closed' | 'Deleted';
}

export interface Status {
  id: string;
  statusName: 'Open' | 'In Progress' | 'Ready for delivery' | 'Delivered' | 'Paid' | 'Returned' | 'Not paid' | 'Cancelled';
}

export interface Order {
  id: string;
  customerId: string;
  customer?: User; // Reference to the customer user
  title: string;
  description: string;
  status: Status['statusName'];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  category?: string;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  notes?: string;
  assignedTo?: string;
  assignedUser?: User; // Reference to the assigned user
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface OrderHistory {
  orderId: string;
  publishingStatusId?: string;
  statusId?: string;
  statusFrom?: string;
  statusTo?: string;
  priorityFrom?: string;
  priorityTo?: string;
  description: string;
  notes?: string;
  documentsAttached: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Types for authentication
export interface AuthUser extends User {
  permissions: string[];
  roleLabel: string;
}

// Types for navigation
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Orders: undefined;
  CreateOrder: undefined;
  EditOrder: { orderId: string };
  OrderDetail: { orderId: string };
  Users: undefined;
  CreateUser: undefined;
  EditUser: { userId: string };
  Profile: undefined;
  Settings: undefined;
  Export: undefined;
};

// Types for filters
export interface OrderFilters {
  status?: Status['statusName'];
  priority?: Order['priority'];
  assignedTo?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  customersOnly?: boolean;
} 