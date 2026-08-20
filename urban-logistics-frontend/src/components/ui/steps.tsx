'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
    key: string;
    label: string;
}

interface StepsProps {
    steps: StepItem[];
    currentIndex: number;
    className?: string;
}

export function Steps({ steps, currentIndex, className }: StepsProps) {
    return (
        <div className={cn('flex items-center w-full', className)}>
            {steps.map((step, i) => {
                const isDone = i < currentIndex;
                const isActive = i === currentIndex;
                return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0',
                                    isDone && 'bg-indigo-600 text-white',
                                    isActive && 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',
                                    !isDone && !isActive && 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                                )}
                            >
                                {isDone ? <Check size={16} /> : i + 1}
                            </div>
                            <span
                                className={cn(
                                    'text-xs whitespace-nowrap',
                                    isActive ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400',
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 mx-2 mb-4',
                                    isDone ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800',
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
