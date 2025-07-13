// Tipos base para la aplicación Lumasachi Control

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
  roleName: 'Super Administrator' | 'Administrator' | 'Employee' | 'Customer';
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