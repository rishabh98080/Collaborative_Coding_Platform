'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function HomeRedirect() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect if visiting the exact root path
        if (pathname === '/' || pathname === '') {
            const randomRoomId = crypto.randomUUID().slice(0, 8);
            router.replace(`/${randomRoomId}`);
        }
    }, [pathname, router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' }}>
            <h2>Initializing your secure coding workspace...</h2>
        </div>
    );
}