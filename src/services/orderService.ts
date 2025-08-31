import { httpClient } from '../utils/httpClient';
import { Attachment } from '../types';

export interface RawOrderUser {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface RawOrderHistoryEntry {
  id?: string | number;
  order_id?: string;
  field_changed?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  comment?: string | null;
  description?: string | null;
  created_by?: number | null;
  creator?: RawOrderUser | null;
  created_at?: string;
  attachments?: Attachment[];
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: any;
  meta?: any;
}

export const orderService = {
  async fetchOrders(signal?: AbortSignal) {
    // Base URL likely already includes "/api"; use "/v1/orders" to produce "/api/v1/orders"
    const response = await httpClient.get<RawOrder[]>('/v1/orders', { signal });
    return response.data;
  },

  async fetchOrderHistory(orderId: string, signal?: AbortSignal) {
    const response = await httpClient.get<PaginatedResponse<RawOrderHistoryEntry>>(`/v1/orders/${orderId}/history`, { signal });
    return response.data; // returns { data: [...], links, meta }
  },
};

export default orderService;