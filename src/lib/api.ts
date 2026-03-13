const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }

  // Parse JSON safely — response body may be empty
  let json: Record<string, unknown> = {};
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Server returned invalid response (HTTP ${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error((json.message as string) || `HTTP ${res.status}`);
  }

  return (json.data ?? json) as T;
}

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; expiresAt: string; user: AppUser }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, isAdmin?: boolean) =>
    request<AppUser>('/users/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, isAdmin }),
    }),
  logout: () => request<void>('/users/logout', { method: 'POST' }),
  me: () => request<AppUser>('/users/me'),
};

// ── Servers ───────────────────────────────────────────────────────
export const serversApi = {
  list: () => request<ServerData[]>('/servers'),
  get: (id: string) => request<ServerData>(`/servers/${id}`),
  create: (data: CreateServerPayload) =>
    request<ServerData>('/servers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateServerPayload> & { status?: string }) =>
    request<ServerData>(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/servers/${id}`, { method: 'DELETE' }),
};

// ── Bookings ──────────────────────────────────────────────────────
export const bookingsApi = {
  all: () => request<BookingData[]>('/bookings'),
  byUser: (userId: string) => request<BookingData[]>(`/bookings/user/${userId}`),
  create: (data: CreateBookingPayload) =>
    request<BookingData>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  extend: (id: string, newEndDate: string) =>
    request<BookingData>(`/bookings/${id}/extend`, { method: 'PUT', body: JSON.stringify({ newEndDate }) }),
  cancel: (id: string) =>
    request<BookingData>(`/bookings/${id}/cancel`, { method: 'PUT' }),
};

// ── Types ─────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export interface ServerData {
  id: string;
  name: string;
  teamAssigned?: string | null;
  assignedUser?: string | null;
  serverFamily?: string | null;
  serverSku?: string | null;
  status: 'ready' | 'not_ready';
  dateAllocated?: string | null;
  duration?: string | null;
  rmIp?: string | null;
  slotId?: string | null;
  homePool?: string | null;
  firmwareVersion?: string | null;
  currentBooking?: BookingData | null;
}

export interface BookingData {
  id: string;
  serverId: string;
  serverName?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending_renewal';
  createdAt: string;
  renewalNotificationSent?: boolean;
  daysBooked: number;
  server?: { name: string; teamAssigned?: string | null; serverFamily?: string | null; serverSku?: string | null; rmIp?: string | null; slotId?: string | null; homePool?: string | null; firmwareVersion?: string | null };
  user?: { email: string; name: string };
}

export interface CreateServerPayload {
  name: string;
  teamAssigned?: string;
  assignedUser?: string;
  serverFamily?: string;
  serverSku?: string;
  status?: 'ready' | 'not_ready';
  dateAllocated?: string;
  duration?: string;
  rmIp?: string;
  slotId?: string;
  homePool?: string;
  firmwareVersion?: string;
}

export interface CreateBookingPayload {
  serverId: string;
  userId: string;
  startDate: string;
  endDate: string;
  purpose: string;
}

// ── Users (admin) ─────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  _count?: { bookings: number };
}

export const usersApi = {
  list: () => request<AdminUser[]>('/users'),
  remove: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  toggleAdmin: (id: string) => request<AdminUser>(`/users/${id}/toggle-admin`, { method: 'PATCH' }),
  register: (name: string, email: string, password: string, isAdmin?: boolean) =>
    request<AdminUser>('/users/register', { method: 'POST', body: JSON.stringify({ name, email, password, isAdmin }) }),
};

// ── Admin (email / digest) ────────────────────────────────────────
export interface EmailStatus {
  configured: boolean;
  smtpHost: string | null;
  smtpUser: string | null;
  smtpPort: string;
  schedule: string;
}

export const adminApi = {
  emailStatus: () => request<EmailStatus>('/admin/email-status'),
  sendWeeklyDigest: () => request<{ sent: number; skipped: number; errors: number }>('/admin/send-weekly-digest', { method: 'POST' }),
  sendTestEmail: () => request<{ message: string }>('/admin/send-test-email', { method: 'POST' }),
};

// ── Admin Excel Upload/Export ─────────────────────────────────────
export interface UploadResult {
  serversCreated: number;
  serversUpdated: number;
  rowsSkipped: number;
  totalRows: number;
  errors?: string[];
}

export const uploadApi = {
  uploadExcel: async (file: File): Promise<UploadResult> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/admin/upload-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return (json.data ?? json) as UploadResult;
  },

  exportExcelUrl: (): string => `${API_BASE}/admin/export-excel`,

  downloadExcel: async (): Promise<void> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/admin/export-excel`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to download');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'server-allocations.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
};
