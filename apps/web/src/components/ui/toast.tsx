'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
}

interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="alert"
                        className={cn(
                            'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2',
                            t.variant === 'error'
                                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/50 dark:bg-red-950/90 dark:text-red-200'
                                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-800/50 dark:bg-green-950/90 dark:text-green-200'
                        )}
                    >
                        {t.variant === 'error' ? (
                            <XCircle size={18} className="mt-0.5 shrink-0" />
                        ) : (
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        )}
                        <p className="flex-1 text-sm">{t.message}</p>
                        <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

/** Rút message lỗi dễ đọc từ lỗi axios/backend NestJS (400 trả về message string hoặc string[]). */
export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại'): string {
    const resp = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
    const msg = resp?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return fallback;
}
