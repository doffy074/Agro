import { User, Prediction, SystemMetrics, Notification, AuditLog, UserRole, ApiResponse, Treatment } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Helper function to get full image URL from relative path
export const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // If it's a data URL, return as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  // Prepend the backend URL for relative paths
  return `${BACKEND_URL}${imageUrl}`;
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Something went wrong. Please try again.');
  }

  return data;
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiCall<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiCall<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getCurrentUser: () => apiCall<User>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    apiCall<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiCall<void>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: () =>
    apiCall<void>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    apiCall<{ resetToken: string; expiresAt: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiCall<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  sendVerificationEmail: () =>
    apiCall<{ verificationToken: string }>('/auth/send-verification', {
      method: 'POST',
    }),

  verifyEmail: (token: string) =>
    apiCall<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return response.json();
  },
};

// Prediction API
export const predictionApi = {
  uploadImage: async (file: File, cropType?: string): Promise<ApiResponse<Prediction>> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    if (cropType) formData.append('cropType', cropType);

    const response = await fetch(`${API_BASE_URL}/predictions/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    return response.json();
  },

  getPredictions: (page = 1, limit = 10, filters?: {
    crop?: string; disease?: string; status?: string;
    dateFrom?: string; dateTo?: string; search?: string;
  }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.crop) params.append('crop', filters.crop);
    if (filters?.disease) params.append('disease', filters.disease);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters?.dateTo) params.append('date_to', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    return apiCall<{ predictions: Prediction[]; total: number }>(`/predictions?${params.toString()}`);
  },

  getPrediction: (id: string) => apiCall<Prediction>(`/predictions/${id}`),

  getStats: () =>
    apiCall<{ total: number; healthy: number; diseased: number; verified: number }>('/farmer/stats'),

  deletePrediction: (id: string) =>
    apiCall<void>(`/predictions/${id}`, { method: 'DELETE' }),

  submitFeedback: (id: string, correct: boolean) =>
    apiCall<void>(`/predictions/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ correct }),
    }),

  getFeedback: (id: string) =>
    apiCall<{ correct: boolean; createdAt: string } | null>(`/predictions/${id}/feedback`),

  downloadPDF: async (id: string): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/predictions/${id}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.blob();
  },
};

// Officer API
export const officerApi = {
  getPendingReviews: (page = 1, limit = 10) =>
    apiCall<{ predictions: Prediction[]; total: number }>(`/officer/reviews?page=${page}&limit=${limit}`),

  getReviewedPredictions: (page = 1, limit = 10) =>
    apiCall<{ predictions: Prediction[]; total: number }>(`/officer/reviewed?page=${page}&limit=${limit}`),

  verifyPrediction: (id: string, isCorrect: boolean, comments: string, correctedDisease?: string) =>
    apiCall<Prediction>(`/officer/verify/${id}`, {
      method: 'POST',
      body: JSON.stringify({ isCorrect, comments, correctedDisease }),
    }),

  addTreatmentSuggestion: (id: string, treatments: Partial<Treatment>) =>
    apiCall<Prediction>(`/officer/treatments/${id}`, {
      method: 'POST',
      body: JSON.stringify(treatments),
    }),

  flagPrediction: (id: string, reason: string) =>
    apiCall<Prediction>(`/officer/flag/${id}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getStatistics: () =>
    apiCall<{
      totalReviewed: number;
      accuracyRate: number;
      byCrop: { crop: string; count: number; accuracy: number }[];
    }>('/officer/statistics'),
};

// Admin API
export const adminApi = {
  getMetrics: () => apiCall<SystemMetrics>('/admin/metrics'),

  getUsers: (page = 1, limit = 10, role?: UserRole) =>
    apiCall<{ users: User[]; total: number }>(
      `/admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}`
    ),

  getUser: (id: string) => apiCall<User>(`/admin/users/${id}`),

  updateUserRole: (id: string, role: UserRole) =>
    apiCall<User>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  toggleUserStatus: (id: string, isActive: boolean) =>
    apiCall<User>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteUser: (id: string) =>
    apiCall<void>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAuditLogs: (page = 1, limit = 20) =>
    apiCall<{ logs: AuditLog[]; total: number }>(`/admin/audit-logs?page=${page}&limit=${limit}`),

  getModelInfo: () =>
    apiCall<{
      name: string;
      version: string;
      accuracy: number;
      lastTrained: string;
      isActive: boolean;
    }>('/admin/model'),

  toggleModel: (isActive: boolean) =>
    apiCall<void>('/admin/model/toggle', {
      method: 'POST',
      body: JSON.stringify({ isActive }),
    }),
};

// Notification API
export const notificationApi = {
  getNotifications: (page = 1, limit = 10) =>
    apiCall<{ notifications: Notification[]; total: number; unreadCount: number }>(
      `/notifications?page=${page}&limit=${limit}`
    ),

  markAsRead: (id: string) =>
    apiCall<void>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    apiCall<void>('/notifications/read-all', { method: 'PUT' }),

  deleteNotification: (id: string) =>
    apiCall<void>(`/notifications/${id}`, { method: 'DELETE' }),
};

// Crops API
export const cropsApi = {
  getCrops: () =>
    apiCall<{ crops: { id: string; name: string }[] }>('/crops'),

  getCrop: (id: string) =>
    apiCall<{ id: string; name: string; diseases: { id: string; name: string }[] }>(`/crops/${id}`),
};

// Chatbot API
export const chatbotApi = {
  sendMessage: (messages: { role: string; content: string }[]) =>
    apiCall<{ reply: string }>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};

// Health API
export const healthApi = {
  check: () =>
    fetch(`${API_BASE_URL}/health`).then(r => r.json()),
};

export default {
  auth: authApi,
  predictions: predictionApi,
  officer: officerApi,
  admin: adminApi,
  notifications: notificationApi,
  crops: cropsApi,
  chatbot: chatbotApi,
  health: healthApi,
};
