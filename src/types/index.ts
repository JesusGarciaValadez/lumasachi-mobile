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
  attachments?: Attachment[]; // Array of attachments
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: User;
  downloadUrl: string;
  previewUrl?: string;
  isImage: boolean;
  isDocument: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  attachments: Attachment[];
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

// Re-export navigation types
export type { RootStackParamList } from './navigation';

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

// Types for file handling
export interface FileUploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadResult {
  attachment: Attachment;
  success: boolean;
  error?: string;
}

export interface MultipleFileUploadResult {
  attachments: Attachment[];
  failedFiles: {
    name: string;
    error: string;
  }[];
  totalFiles: number;
  successfulFiles: number;
  failedCount: number;
}

// Types for file selection
export interface FileSelection {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// Types for file preview
export interface FilePreview {
  id: string;
  uri: string;
  type: string;
  name: string;
  size: number;
  isImage: boolean;
  isDocument: boolean;
} 