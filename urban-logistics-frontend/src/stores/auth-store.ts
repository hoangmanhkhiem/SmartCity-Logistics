import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'regulator' | 'carrier_ops' | 'shipper' | 'consumer';

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    memberships?: {
        organization: { id: number; name: string; type: string };
        role: { id: number; name: string };
    }[];
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    currentRole: UserRole | null;

    setAuth: (user: User, token: string) => void;
    setRole: (role: UserRole) => void;
    logout: () => void;
}

const ROLE_NAME_MAP: Record<string, UserRole> = {
    platform_admin: 'admin',
    regulator: 'regulator',
    carrier_ops: 'carrier_ops',
    shipper: 'shipper',
    consumer: 'consumer',
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            currentRole: null,

            setAuth: (user, token) => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', token);
                }
                // Determine role from memberships
                const rawRole = user.memberships?.[0]?.role?.name;
                const primaryRole = (rawRole && ROLE_NAME_MAP[rawRole]) || 'consumer';
                set({ user, accessToken: token, isAuthenticated: true, currentRole: primaryRole });
            },

            setRole: (role) => set({ currentRole: role }),

            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                }
                set({ user: null, accessToken: null, isAuthenticated: false, currentRole: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
                currentRole: state.currentRole,
            }),
        }
    )
);

// Helper function to get dashboard path by role
export const getDashboardPath = (role: UserRole | null): string => {
    switch (role) {
        case 'admin':
            return '/logistics/dashboard';
        case 'carrier_ops':
            return '/delivery/dashboard';
        case 'shipper':
            return '/shipper/today';
        case 'regulator':
            return '/regulator/reports';
        case 'consumer':
            return '/consumer';
        default:
            return '/';
    }
};
