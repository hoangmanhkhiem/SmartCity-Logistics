import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'regulator' | 'carrier_mgr' | 'dispatcher' | 'consumer' | 'viewer';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    memberships?: {
        organization: { id: string; name: string; type: string };
        role: { id: string; name: string };
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
                const primaryRole = user.memberships?.[0]?.role?.name as UserRole || 'consumer';
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
            // Nền tảng / điều phối / API tích hợp nằm dưới /logistics/*
            return '/logistics/dashboard';
        case 'carrier_mgr':
        case 'dispatcher':
            return '/delivery/dashboard';
        case 'regulator':
            return '/regulator/dashboard';
        default:
            return '/consumer';
    }
};
