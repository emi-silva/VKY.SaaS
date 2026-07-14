import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  patient?: any;
  doctor?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  tempToken: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean }>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  login2FA: (tempToken: string, code: string) => Promise<void>;
  clearTwoFactor: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      requiresTwoFactor: false,
      tempToken: null,

      login: async (email: string, password: string) => {
        const { data } = await authApi.login(email, password);
        const response = data.data;

        if (response.requiresTwoFactor) {
          set({
            requiresTwoFactor: true,
            tempToken: response.tempToken,
            isLoading: false,
          });
          return { requiresTwoFactor: true };
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);

        set({
          user: response.user,
          token: response.token,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          requiresTwoFactor: false,
          tempToken: null,
        });

        return {};
      },

      register: async (data) => {
        const { data: response } = await authApi.register(data);
        const { user, token, refreshToken } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
          } catch {
            // Ignorar errores al cerrar sesión
          }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          requiresTwoFactor: false,
          tempToken: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token || !refreshToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const { data } = await authApi.me();
          set({
            user: data.data,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login2FA: async (tempToken: string, code: string) => {
        const { data } = await authApi.login2FA(tempToken, code);
        const { user, token, refreshToken } = data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          requiresTwoFactor: false,
          tempToken: null,
        });
      },

      clearTwoFactor: () => {
        set({
          requiresTwoFactor: false,
          tempToken: null,
        });
      },
    }),
    {
      name: 'vky-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
