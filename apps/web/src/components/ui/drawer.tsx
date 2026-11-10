'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    side?: 'right' | 'left' | 'bottom';
    widthClassName?: string;
}

export function Drawer({ isOpen, onClose, title, children, side = 'right', widthClassName = 'max-w-md' }: DrawerProps) {
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    const isBottom = side === 'bottom';

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div
                className={cn(
                    'relative bg-white dark:bg-slate-900 shadow-2xl flex flex-col ring-1 ring-slate-200 dark:ring-slate-800',
                    isBottom
                        ? 'w-full max-h-[85vh] mt-auto rounded-t-2xl'
                        : cn('h-full w-full', widthClassName, side === 'right' ? 'ml-auto' : 'mr-auto'),
                )}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
            </div>
        </div>
    );
}
