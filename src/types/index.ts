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
  company: string;
  phoneNumber: string;
  address: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  email: string;
  company?: string;
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
  status: Status['statusName'];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface OrderHistory {
  orderId: string;
  publishingStatusId: string;
  statusId: string;
  description: string;
  documentsAttached: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
} 