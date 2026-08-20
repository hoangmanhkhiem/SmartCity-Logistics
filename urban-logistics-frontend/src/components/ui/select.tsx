'use client';

import { cn } from '@/lib/utils';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    onChange?: (value: string) => void;
    error?: string;
}

export function Select({
    label,
    options,
    placeholder = 'Chọn...',
    onChange,
    error,
    className,
    value,
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    'w-full px-3 py-2 rounded-lg border transition-colors',
                    'bg-white dark:bg-slate-900',
                    'border-slate-300 dark:border-slate-700',
                    'text-slate-900 dark:text-white',
                    'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error && 'border-red-500 focus:ring-red-500',
                    className
                )}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
