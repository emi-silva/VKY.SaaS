import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitud - agregar token de autenticación
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de respuesta - manejar actualización de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// API DE AUTENTICACIÓN
// ============================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => api.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me'),

  // 2FA
  setup2FA: () => api.post('/auth/2fa/setup'),

  verify2FA: (code: string) =>
    api.post('/auth/2fa/verify', { code }),

  disable2FA: (code: string) =>
    api.post('/auth/2fa/disable', { code }),

  login2FA: (tempToken: string, code: string) =>
    api.post('/auth/2fa/login', { tempToken, code }),
};

// ============================================
// API DE USUARIOS
// ============================================
export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/users', { params }),

  getById: (id: string) => api.get(`/users/${id}`),

  updatePatient: (data: Record<string, unknown>) =>
    api.patch('/patients/profile', data),

  updateDoctor: (data: Record<string, unknown>) =>
    api.patch('/doctors/profile', data),

  listDoctors: (params?: { specialty?: string; search?: string }) =>
    api.get('/doctors', { params }),
};

export default api;
