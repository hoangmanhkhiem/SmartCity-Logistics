'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, type = 'text', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={cn(
                        'w-full px-3.5 py-2 rounded-lg border bg-white dark:bg-slate-900',
                        'text-slate-900 dark:text-slate-100',
                        'border-slate-300 dark:border-slate-700',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                        'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                        'transition-colors duration-150',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
