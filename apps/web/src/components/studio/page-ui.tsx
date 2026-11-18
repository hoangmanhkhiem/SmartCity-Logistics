import { type ReactNode } from 'react';

export function MetricStat({
    title,
    value,
    icon,
    tone = 'blue',
}: {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    tone?: 'blue' | 'navy' | 'orange' | 'purple';
}) {
    return (
        <article className="metric-card">
            <div className="flex items-center gap-3">
                <span className={`metric-icon ${tone}`}>{icon}</span>
                <div>
                    <p className="text-xs text-[#66728b]">{title}</p>
                    <p className="mt-0.5 text-[22px] font-extrabold tracking-tight text-[#0b1b3a]">{value}</p>
                </div>
            </div>
        </article>
    );
}

export function DataCard({
    title,
    subtitle,
    toolbar,
    children,
    className = '',
}: {
    title?: string;
    subtitle?: string;
    toolbar?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`data-card ${className}`}>
            {(title || toolbar) && (
                <div className="data-card-head">
                    <div>
                        {title && <h2>{title}</h2>}
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    {toolbar}
                </div>
            )}
            {children}
        </section>
    );
}

export function SoftTag({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'navy' | 'orange' | 'green' | 'red' }) {
    return <span className={`soft-tag ${tone}`}>{children}</span>;
}
