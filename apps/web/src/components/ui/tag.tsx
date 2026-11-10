'use client';

import { cn } from '@/lib/utils';

type TagColor = 'gray' | 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange';

interface TagProps {
    children: React.ReactNode;
    color?: TagColor;
    className?: string;
}

const colorStyles: Record<TagColor, string> = {
    gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    blue: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    purple: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
};

export function Tag({ children, color = 'gray', className }: TagProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium leading-tight',
                colorStyles[color],
                className,
            )}
        >
            {children}
        </span>
    );
}
