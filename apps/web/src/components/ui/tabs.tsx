'use client';

import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
    value: string;
    onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('Tabs.* phải nằm trong <Tabs>');
    return ctx;
}

interface TabsProps {
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ value, onChange, children, className }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-center gap-1 border-b border-slate-200 dark:border-slate-800', className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const { value: active, onChange } = useTabsContext();
    const isActive = active === value;
    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                className,
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const { value: active } = useTabsContext();
    if (active !== value) return null;
    return <div className={cn('pt-4', className)}>{children}</div>;
}
