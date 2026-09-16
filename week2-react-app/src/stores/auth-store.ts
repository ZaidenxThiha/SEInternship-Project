import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
      isAuthenticated: () => Boolean(get().accessToken && get().user),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'week2-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
