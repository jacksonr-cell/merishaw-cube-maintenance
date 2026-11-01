import type { 
  User, Ticket, Building, BuildingTree, FaultCategory, 
  TicketStatusHistory, WorkLog, TicketComment, NotificationItem, 
  AuditLog, AdminMetrics, Priority, TicketStatus 
} from '../types.ts';

const TOKEN_KEY = 'merishaw_auth_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} Error`;
    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      }
    } catch (e) {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (identifier: string, password: string) => 
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),

  getCurrentUser: () => 
    request<{ user: User }>('/api/auth/me'),

  updateProfile: (fullName: string, phone?: string) =>
    request<{ message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: fullName, phone })
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    }),

  recoverPassword: (identifier: string) =>
    request<{ message: string; recovery_available: boolean; reset_token?: string; user_email?: string }>('/api/auth/recover-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
    }),

  resetPassword: (resetToken: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword })
    }),

  // Tickets
  getTickets: (params?: { 
    status?: string; 
    category?: string; 
    priority?: string; 
    building_id?: string; 
    staff_id?: string; 
    student_id?: string; 
    search?: string; 
    limit?: number; 
    offset?: number; 
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    return request<{ tickets: Ticket[]; total: number; user_role: string }>(`/api/tickets?${query.toString()}`);
  },

  getTicketDetails: (id: string) =>
    request<{ 
      ticket: Ticket; 
      statusHistory: TicketStatusHistory[]; 
      workLogs: WorkLog[]; 
      comments: TicketComment[]; 
    }>(`/api/tickets/${id}`),

  createTicket: (data: {
    cube_id: string;
    category_id: string;
    affected_item: string;
    severity: Priority;
    title: string;
    description: string;
  }) =>
    request<{ message: string; ticket: Partial<Ticket> }>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  assignTicket: (id: string, data: { staff_id: string; priority?: Priority; notes?: string }) =>
    request<{ message: string; status: TicketStatus; priority: Priority }>(`/api/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  updateTicketStatus: (id: string, data: {
    status: TicketStatus;
    notes?: string;
    resolution_summary?: string;
    materials_used_summary?: string;
    rejection_reason?: string;
  }) =>
    request<{ message: string; new_status: TicketStatus }>(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  addWorkLog: (id: string, data: {
    action_taken: string;
    parts_used?: string;
    time_spent_minutes: number;
    notes?: string;
  }) =>
    request<{ message: string; id: string }>(`/api/tickets/${id}/work-logs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  addComment: (id: string, data: { message: string; is_internal?: number }) =>
    request<{ message: string; commentId: string }>(`/api/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Locations
  getLocationTree: () =>
    request<{ tree: BuildingTree[] }>('/api/locations/tree'),

  getBuildings: () =>
    request<{ buildings: Building[] }>('/api/locations/buildings'),

  createBuilding: (data: { name: string; code: string; campus_zone: string; total_floors?: number }) =>
    request<{ message: string; id: string }>('/api/locations/buildings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  createCube: (data: { room_id: string; cube_number: string; label: string }) =>
    request<{ message: string; id: string }>('/api/locations/cubes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  assignStudentCube: (data: { student_id: string; cube_id: string; academic_year?: string; semester?: string }) =>
    request<{ message: string }>('/api/locations/assign-student', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Categories
  getCategories: () =>
    request<{ categories: FaultCategory[] }>('/api/categories'),

  createCategory: (data: { name: string; code: string; description?: string; default_priority?: Priority; sla_hours?: number; affected_items?: string[] }) =>
    request<{ message: string; id: string }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCategory: (id: string, data: Partial<FaultCategory>) =>
    request<{ message: string }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Admin
  getAdminStats: () =>
    request<{
      metrics: AdminMetrics;
      statusCounts: Record<string, number>;
      faultDistribution: any[];
      requestsByBuilding: any[];
      staffWorkload: any[];
      recentActivities: any[];
    }>('/api/admin/stats'),

  getUsers: (params?: { role?: string; is_active?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    return request<{ users: User[] }>(`/api/admin/users?${query.toString()}`);
  },

  createUser: (data: {
    email: string;
    identifier_code: string;
    full_name: string;
    role: string;
    password: string;
    phone?: string;
    department?: string;
    cube_id?: string;
  }) =>
    request<{ message: string; user_id: string }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateUser: (id: string, data: { full_name?: string; phone?: string; department?: string; is_active?: number; role?: string }) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAuditLogs: (params?: { limit?: number; offset?: number; action?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    return request<{ logs: AuditLog[] }>(`/api/admin/audit-logs?${query.toString()}`);
  },

  getExportCsvUrl: () => {
    const token = tokenStorage.get();
    return `/api/admin/export/tickets.csv?token=${encodeURIComponent(token || '')}`;
  },

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unread_count: number }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/api/notifications/mark-all-read', { method: 'POST' }),

  // System Health
  getHealth: () =>
    request<{
      status: string;
      system: string;
      database: string;
      engine: string;
      uptime_seconds: number;
      records: { users: number; tickets: number };
      timestamp: string;
    }>('/api/health')
};
