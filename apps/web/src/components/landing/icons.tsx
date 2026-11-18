export type IconName =
    | 'arrow'
    | 'box'
    | 'building'
    | 'chart'
    | 'check'
    | 'clock'
    | 'headset'
    | 'location'
    | 'menu'
    | 'route'
    | 'search'
    | 'shield'
    | 'spark'
    | 'truck';

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
    const paths: Record<IconName, React.ReactNode> = {
        arrow: (
            <>
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
            </>
        ),
        box: (
            <>
                <path d="m4 7 8-4 8 4-8 4-8-4Z" />
                <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
                <path d="M12 11v10" />
            </>
        ),
        building: (
            <>
                <path d="M4 21V5l8-3v19" />
                <path d="M12 8h8v13" />
                <path d="M8 7v1M8 11v1M8 15v1M16 12v1M16 16v1" />
                <path d="M2 21h20" />
            </>
        ),
        chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
        check: <path d="m5 12 4 4L19 6" />,
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        headset: (
            <>
                <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
                <path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
                <path d="M17 18c0 2-2 3-5 3" />
            </>
        ),
        location: (
            <>
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),
        menu: (
            <>
                <path d="M4 7h16M4 12h16M4 17h16" />
            </>
        ),
        route: (
            <>
                <circle cx="5" cy="18" r="2" />
                <circle cx="19" cy="6" r="2" />
                <path d="M7 18h3a2 2 0 0 0 2-2V8a2 2 0 0 1 2-2h3" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        spark: (
            <>
                <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
                <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
            </>
        ),
        truck: (
            <>
                <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
            </>
        ),
    };
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    );
}
