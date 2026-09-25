import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── Tickets ───────────────────────────────────────────────────────────────────

export const ticketApi = {
  list: (params?: TicketListParams) => api.get('/tickets', { params }),
  get: (id: string) => api.get(`/tickets/${id}`),
  create: (data: FormData) =>
    api.post('/tickets', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }),
  assign: (id: string, agentId: string | null) =>
    api.patch(`/tickets/${id}/assign`, { agentId }),
  addComment: (id: string, body: string, isInternal = false) =>
    api.post(`/tickets/${id}/comments`, { body, isInternal }),
  getActivity: (id: string) => api.get(`/tickets/${id}/activity`),
  acceptAiSuggestion: (id: string, data: { category?: string; priority?: string }) =>
    api.post(`/tickets/${id}/ai-suggestion/accept`, data),
  generateAiReply: (id: string, tone: string) =>
    api.post(`/tickets/${id}/ai-reply`, { tone }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userApi = {
  getAgents: () => api.get('/users/agents'),
  getAll: () => api.get('/users'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TicketListParams {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface SimilarTicket {
  ticketId: string;
  title: string;
  score: number;
}

export interface AiSuggestion {
  category: string;
  priority: string;
  summary: string;
  draftReply: string;
  sentiment?: string;
  similarTickets?: SimilarTicket[];
  fallback: boolean;
  generatedAt: string;
}

export interface Comment {
  _id: string;
  author: User;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  action: string;
  performedBy: User;
  details: string;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdBy: User;
  assignedTo: User | null;
  attachment: {
    originalName: string;
    storedName: string;
    path: string;
    mimeType: string;
    size: number;
  } | null;
  aiSuggestion: AiSuggestion | null;
  comments: Comment[];
  activityLog: ActivityEntry[];
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
