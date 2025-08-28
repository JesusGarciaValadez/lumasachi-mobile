import { httpClient } from '../utils/httpClient';

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

export const orderService = {
  async fetchOrders(signal?: AbortSignal) {
    // Base URL likely already includes "/api"; use "/v1/orders" to produce "/api/v1/orders"
    const response = await httpClient.get<RawOrder[]>('/v1/orders', { signal });
    return response.data;
  },
};

export default orderService;