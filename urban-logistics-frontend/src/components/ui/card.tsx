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
                'rounded-xl border border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800',
                'shadow-sm',
                hover && 'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-b border-gray-200 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-6 py-4 border-t border-gray-200 dark:border-gray-700', className)}>
            {children}
        </div>
    );
}
