import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-500',
        confirmed: 'bg-blue-500/20 text-blue-500',
        in_transit: 'bg-purple-500/20 text-purple-500',
        shipped: 'bg-purple-500/20 text-purple-500',
        delivered: 'bg-green-500/20 text-green-500',
        completed: 'bg-green-500/20 text-green-500',
        cancelled: 'bg-red-500/20 text-red-500',
        available: 'bg-green-500/20 text-green-500',
        in_use: 'bg-blue-500/20 text-blue-500',
        maintenance: 'bg-orange-500/20 text-orange-500',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-500';
}
