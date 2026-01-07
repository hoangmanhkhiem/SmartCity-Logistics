'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      // Already logged in - redirect to dashboard based on role
      const primaryRole = (user.memberships?.[0]?.role?.name || 'consumer') as any;
      router.replace(getDashboardPath(primaryRole));
    } else {
      // Not logged in - redirect to login
      router.replace('/login');
    }
  }, [accessToken, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Đang chuyển hướng...</span>
      </div>
    </div>
  );
}
