'use client';

import { useId } from 'react';

type Overlay = 'heat' | 'lez' | 'policy' | 'route';

export function MapSketch({ overlay = 'heat', className = '' }: { overlay?: Overlay; className?: string }) {
    const uid = useId().replace(/:/g, '');
    return (
        <svg viewBox="0 0 800 500" className={`h-full w-full ${className}`} aria-hidden>
            <rect width="800" height="500" fill="#e8ece4" />
            <path d="M690 0 C650 120 720 220 670 330 C630 420 690 470 670 500 L800 500 L800 0 Z" fill="#cfe0e6" />
            <ellipse cx="420" cy="250" rx="34" ry="58" fill="#cfe0e6" />
            <ellipse cx="190" cy="140" rx="70" ry="40" fill="#cfe0e6" />
            <rect x="250" y="330" width="120" height="80" rx="10" fill="#d8e6d0" />
            <rect x="520" y="60" width="90" height="70" rx="10" fill="#d8e6d0" />
            <g fill="none" stroke="#d2d7ce" strokeWidth="16" strokeLinecap="round">
                <path d="M0 220 L800 260" /><path d="M300 0 L340 500" /><path d="M0 420 C200 400 500 440 800 400" /><path d="M560 0 L520 500" /><path d="M0 80 L640 120" />
            </g>
            <g fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round">
                <path d="M0 220 L800 260" /><path d="M300 0 L340 500" /><path d="M0 420 C200 400 500 440 800 400" /><path d="M560 0 L520 500" /><path d="M0 80 L640 120" />
            </g>
            {overlay === 'heat' && (
                <>
                    <defs>
                        <radialGradient id={`${uid}-heat`}>
                            <stop offset="0" stopColor="#C2410C" stopOpacity="0.75" />
                            <stop offset="0.45" stopColor="#EA8A2E" stopOpacity="0.4" />
                            <stop offset="1" stopColor="#F5C26B" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="330" cy="230" r="110" fill={`url(#${uid}-heat)`} />
                    <circle cx="540" cy="250" r="80" fill={`url(#${uid}-heat)`} />
                    <circle cx="420" cy="400" r="70" fill={`url(#${uid}-heat)`} />
                    <circle cx="160" cy="210" r="60" fill={`url(#${uid}-heat)`} />
                    <circle cx="300" cy="90" r="50" fill={`url(#${uid}-heat)`} />
                </>
            )}
            {overlay === 'lez' && (
                <>
                    <defs>
                        <pattern id={`${uid}-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#0e6e5c" strokeWidth="2" strokeOpacity="0.35" />
                        </pattern>
                    </defs>
                    <path d="M270 150 L500 165 L520 330 L330 360 L250 280 Z" fill={`url(#${uid}-hatch)`} stroke="#0e6e5c" strokeWidth="3" strokeDasharray="8 5" />
                    <rect x="282" y="160" width="56" height="24" rx="6" fill="#0e6e5c" />
                    <text x="310" y="177" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">LEZ</text>
                    <g fill="none" stroke="#b42318" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 9">
                        <path d="M0 80 L300 99" /><path d="M560 0 L545 180" /><path d="M600 300 L680 310" />
                    </g>
                </>
            )}
            {overlay === 'route' && (
                <>
                    <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M110 300 L150 230 L300 216 L330 215 L340 300 L400 330 L460 320" stroke="#0e6e5c" />
                        <path d="M110 300 L160 420 L340 420 L520 410 L540 250 L610 300" stroke="#b85c00" strokeDasharray="10 6" />
                    </g>
                    <rect x="96" y="286" width="28" height="28" rx="6" fill="#14211c" />
                    <text x="110" y="305" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">K</text>
                    {[
                        [300, 216, '#0e6e5c', '1'], [340, 300, '#0e6e5c', '2'], [460, 320, '#0e6e5c', '3'],
                        [340, 420, '#b85c00', '1'], [540, 250, '#b85c00', '2'], [610, 300, '#b85c00', '3'],
                    ].map(([x, y, c, n]) => (
                        <g key={`${x}${n}${c}`}>
                            <circle cx={x as number} cy={y as number} r="12" fill={c as string} />
                            <text x={x as number} y={(y as number) + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{n}</text>
                        </g>
                    ))}
                </>
            )}
        </svg>
    );
}
