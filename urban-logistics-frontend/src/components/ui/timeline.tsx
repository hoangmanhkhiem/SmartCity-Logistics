'use client';

import { cn } from '@/lib/utils';

export interface TimelineItem {
    key: string;
    title: string;
    description?: string;
    timestamp?: string;
    status?: 'done' | 'active' | 'pending' | 'failed';
}

interface TimelineProps {
    items: TimelineItem[];
    className?: string;
}

const dotStyles: Record<NonNullable<TimelineItem['status']>, string> = {
    done: 'bg-emerald-500',
    active: 'bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/40',
    pending: 'bg-slate-300 dark:bg-slate-600',
    failed: 'bg-red-500',
};

export function Timeline({ items, className }: TimelineProps) {
    return (
        <ol className={cn('relative border-l border-slate-200 dark:border-slate-800 ml-2', className)}>
            {items.map((item, i) => (
                <li key={item.key} className={cn('ml-4', i !== items.length - 1 && 'pb-6')}>
                    <span
                        className={cn(
                            'absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full',
                            dotStyles[item.status ?? 'pending'],
                        )}
                    />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                    {item.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                    )}
                    {item.timestamp && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.timestamp}</p>
                    )}
                </li>
            ))}
        </ol>
    );
}
