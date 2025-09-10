import { httpClient } from '../utils/httpClient';

// Raw shape returned by backend for employees
export interface RawEmployee {
  id: number;
  uuid?: string;
  company_uuid?: string | null;
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  email_verified_at?: string | null;
  role?: string | null;
  type?: string | null;
  is_active?: boolean | null;
  preferences?: string | null;
  phone_number?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EmployeeListItem {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  role: string; // e.g. "Employee"
  type: string; // e.g. "Individual" | "Corporate"
  isActive: boolean;
  phone?: string;
  notes?: string;
  createdAt?: string;
}

/**
 * Fetch employees for the current company.
 * Accepts arrays directly or objects with a `data` array.
 */
export async function fetchCompanyEmployees(signal?: AbortSignal): Promise<EmployeeListItem[]> {
  const resp = await httpClient.get<RawEmployee[] | { data: RawEmployee[] }>(
    '/v1/users/employees',
    { signal }
  );

  const list: RawEmployee[] = Array.isArray(resp.data)
    ? (resp.data as RawEmployee[])
    : (Array.isArray((resp.data as any)?.data) ? (resp.data as any).data : []);

  return list.map((u) => {
    const full = (u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`).trim();
    return {
      id: String(u.id),
      fullName: full,
      email: String(u.email || ''),
      isEmailVerified: !!u.email_verified_at,
      role: String(u.role || 'Employee'),
      type: String(u.type || ''),
      isActive: Boolean(u.is_active ?? true),
      phone: u.phone_number || undefined,
      notes: u.notes || undefined,
      createdAt: u.created_at || undefined,
    };
  });
}

// Keep placeholders for legacy usage (tests can mock the module if needed)
export async function fetchUsers(): Promise<never> {
  throw new Error('userService.fetchUsers is not implemented');
}

export async function createUser(): Promise<never> {
  throw new Error('userService.createUser is not implemented');
}

export default { fetchCompanyEmployees, fetchUsers, createUser };
