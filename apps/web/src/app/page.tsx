'use client';

import { Be_Vietnam_Pro } from 'next/font/google';
import { LandingPage } from '@/components/landing/landing-page';
import '@/components/landing/landing.css';

const beVietnam = Be_Vietnam_Pro({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700', '800'],
});

export default function HomePage() {
    return (
        <div className={`landing ${beVietnam.className}`}>
            <LandingPage />
        </div>
    );
}
