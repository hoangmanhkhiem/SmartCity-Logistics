'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { user, accessToken, currentRole } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      // Already logged in - redirect to dashboard based on role
      router.replace(getDashboardPath(currentRole));
    } else {
      // Not logged in - redirect to login
      router.replace('/login');
    }
  }, [accessToken, user, currentRole, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Đang chuyển hướng...</span>
      </div>
    </div>
  );
}
