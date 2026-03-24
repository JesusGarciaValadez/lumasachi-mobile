import { httpClient } from '@utils/httpClient';
import { API_ENDPOINTS } from '@/constants';
import type {
  MotorInfo,
  OrderItem,
  OrderServiceEntry,
  EngineCatalog,
  SingleItemCatalog,
} from '@/types';

// ---------------------------------------------------------------------------
// Raw API response shapes
// ---------------------------------------------------------------------------

export interface RawOrderUser {
  id: number;
  uuid: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string;
  type: string;
  is_active: boolean;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawOrder {
  id: string;
  uuid: string;
  customer: RawOrderUser | null;
  title: string;
  description: string;
  status: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent' | string;
  category: string | null;
  category_id: number | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  notes: string | null;
  created_by: RawOrderUser;
  assigned_to: RawOrderUser | null;
  motor_info: MotorInfo | null;
  items: OrderItem[] | null;
  services: OrderServiceEntry[] | null;
  created_at: string;
  updated_at: string;
}

export interface RawOrderHistoryEntry {
  id?: string | number;
  uuid: string;
  order_id?: string;
  field_changed?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  comment?: string | null;
  description?: string | null;
  created_by?: number | null;
  creator?: RawOrderUser | null;
  created_at?: string;
  attachments?: any[];
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: any;
  meta?: any;
}

// ---------------------------------------------------------------------------
// Request payload types
// ---------------------------------------------------------------------------

export interface BudgetServicePayload {
  order_item_id: number;
  service_key: string;
  measurement?: string | null;
  notes?: string | null;
}

export interface CustomerApprovalPayload {
  authorized_service_ids: number[];
  down_payment?: number;
}

export interface WorkCompletedPayload {
  completed_service_ids: number[];
}

export interface TrackOrderPayload {
  uuid: string;
  created_date: string; // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const orderService = {
  // ---- Existing ----

  async fetchOrders(signal?: AbortSignal) {
    const response = await httpClient.get<RawOrder[]>(API_ENDPOINTS.ORDERS.LIST, { signal });
    return response.data;
  },

  async fetchOrderHistory(orderUuid: string, signal?: AbortSignal) {
    const response = await httpClient.get<PaginatedResponse<RawOrderHistoryEntry>>(
      `${API_ENDPOINTS.ORDERS.HISTORY}/${orderUuid}/history`,
      { signal },
    );
    return response.data;
  },

  // ---- Order detail ----

  async fetchOrderDetail(orderUuid: string, signal?: AbortSignal) {
    const response = await httpClient.get<RawOrder>(
      `${API_ENDPOINTS.ORDERS.DETAIL}/${orderUuid}`,
      { signal },
    );
    return response.data;
  },

  // ---- Catalog ----

  /** Fetch the full engine catalog (all item types). */
  async fetchCatalog(signal?: AbortSignal): Promise<EngineCatalog> {
    const response = await httpClient.get<EngineCatalog>(
      API_ENDPOINTS.CATALOG.ENGINE_OPTIONS,
      { signal },
    );
    return response.data;
  },

  /** Fetch catalog for a specific item type. */
  async fetchCatalogByItemType(itemType: string, signal?: AbortSignal): Promise<SingleItemCatalog> {
    const response = await httpClient.get<SingleItemCatalog>(
      API_ENDPOINTS.CATALOG.ENGINE_OPTIONS,
      { params: { item_type: itemType }, signal },
    );
    return response.data;
  },

  // ---- Lifecycle actions ----

  async submitBudget(orderUuid: string, services: BudgetServicePayload[]) {
    const response = await httpClient.post<{ message: string; order: RawOrder }>(
      `${API_ENDPOINTS.ORDERS.BUDGET}/${orderUuid}/budget`,
      { services },
    );
    return response.data;
  },

  async customerApproval(orderUuid: string, payload: CustomerApprovalPayload) {
    const response = await httpClient.post<{ message: string; order: RawOrder }>(
      `${API_ENDPOINTS.ORDERS.CUSTOMER_APPROVAL}/${orderUuid}/customer-approval`,
      payload,
    );
    return response.data;
  },

  async markWorkCompleted(orderUuid: string, payload: WorkCompletedPayload) {
    const response = await httpClient.post<{ message: string; order: RawOrder }>(
      `${API_ENDPOINTS.ORDERS.WORK_COMPLETED}/${orderUuid}/work-completed`,
      payload,
    );
    return response.data;
  },

  async markReadyForDelivery(orderUuid: string) {
    const response = await httpClient.post<{ message: string; order: RawOrder }>(
      `${API_ENDPOINTS.ORDERS.READY_FOR_DELIVERY}/${orderUuid}/ready-for-delivery`,
    );
    return response.data;
  },

  async deliverOrder(orderUuid: string) {
    const response = await httpClient.post<{ message: string; order: RawOrder }>(
      `${API_ENDPOINTS.ORDERS.DELIVER}/${orderUuid}/deliver`,
    );
    return response.data;
  },

  // ---- Public tracking ----

  async trackOrder(payload: TrackOrderPayload) {
    const response = await httpClient.post<RawOrder>(
      API_ENDPOINTS.ORDERS.TRACK,
      payload,
    );
    return response.data;
  },
};

export default orderService;
