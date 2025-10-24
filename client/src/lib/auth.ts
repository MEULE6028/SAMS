import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
}

// Helper function to get the appropriate dashboard route based on user role
export function getDashboardRoute(user: User | null): string {
  if (!user) return '/login';

  const adminRoles = ['admin', 'supervisor', 'treasurer', 'vc'];
  if (adminRoles.includes(user.role)) {
    return '/admin/chapa360/accounts';
  }

  return '/dashboard';
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error('Logout API call failed:', error);
          }
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'sams-auth',
    }
  )
);
