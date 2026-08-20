'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    title: string;
}

export function Header({ title }: HeaderProps) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between h-full px-6">
                {/* Title */}
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                        <Bell size={19} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full ring-2 ring-white dark:ring-slate-950"></span>
                    </button>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-slate-100 transition-colors dark:hover:bg-slate-800"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                                {user?.name || 'User'}
                            </span>
                            <ChevronDown size={15} className="text-slate-400" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 py-1.5 overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-slate-400">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <User size={16} />
                                    Hồ sơ
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                >
                                    <LogOut size={16} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
