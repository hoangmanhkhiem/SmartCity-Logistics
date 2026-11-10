import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-slate-200 dark:border-slate-800',
                'bg-white dark:bg-slate-900',
                'shadow-sm shadow-slate-200/60 dark:shadow-none',
                hover && 'transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-slate-200 dark:border-slate-800', className)}>
            {children}
        </div>
    );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-800', className)}>
            {children}
        </div>
    );
}
