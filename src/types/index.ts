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

// --- Order Lifecycle Status (matches backend OrderStatus enum) ---

export type OrderLifecycleStatus =
  | 'Received'
  | 'Awaiting Review'
  | 'Reviewed'
  | 'Awaiting Customer Approval'
  | 'Ready for Work'
  | 'In Progress'
  | 'Ready for Delivery'
  | 'Delivered';

// --- Motor / Items / Services ---

export interface MotorInfo {
  id: number;
  uuid: string;
  brand: string | null;
  liters: string | null;
  year: string | null;
  model: string | null;
  cylinder_count: string | null;
  down_payment: number;
  total_cost: number;
  is_fully_paid: boolean;
  center_torque: string | null;
  rod_torque: string | null;
  first_gap: string | null;
  second_gap: string | null;
  third_gap: string | null;
  center_clearance: string | null;
  rod_clearance: string | null;
}

export interface OrderItemComponent {
  id: number;
  uuid: string;
  component_name: string;
  is_received: boolean;
}

export interface OrderItem {
  id: number;
  uuid: string;
  item_type: string;
  is_received: boolean;
  components: OrderItemComponent[];
}

export interface OrderServiceEntry {
  id: number;
  uuid: string;
  order_item_id: number;
  service_key: string;
  service_name: string | null;
  measurement: string | null;
  is_budgeted: boolean;
  is_authorized: boolean;
  is_completed: boolean;
  notes: string | null;
  base_price: string | null;
  net_price: string | null;
}

// --- Catalog types (from GET /v1/catalog/engine-options) ---

export interface CatalogComponent {
  key: string;
  label: string;
}

export interface CatalogService {
  service_key: string;
  service_name: string;
  base_price: string;
  net_price: string;
  requires_measurement: boolean;
  display_order: number;
  item_type: string;
}

export interface CatalogItemType {
  key: string;
  label: string;
}

/** Full catalog response (no item_type filter). */
export interface EngineCatalog {
  item_types: CatalogItemType[];
  components_by_type: Record<string, CatalogComponent[]>;
  services_by_type: Record<string, CatalogService[]>;
}

/** Single-type catalog response (with item_type filter). */
export interface SingleItemCatalog {
  item_type: string;
  item_type_label: string;
  components: CatalogComponent[];
  services: CatalogService[];
}

export interface Order {
  id: string;
  customerId: string;
  customer?: User; // Reference to the customer user
  title: string;
  description: string;
  status: Status['statusName'] | OrderLifecycleStatus;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  category?: string;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  notes?: string;
  assignedTo?: string;
  assignedUser?: User; // Reference to the assigned user
  attachments?: Attachment[]; // Array of attachments
  motorInfo?: MotorInfo;
  items?: OrderItem[];
  services?: OrderServiceEntry[];
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