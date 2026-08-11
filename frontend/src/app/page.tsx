'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function HomeRedirect() {
    const router = useRouter();
    const pathname = usePathname();
    
    const [status, setStatus] = useState<'waking' | 'online'>('waking');
    const [progress, setProgress] = useState(10);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE ;

    useEffect(() => {
        // Only run the waking and redirect logic on the exact root path
        if (pathname !== '/' && pathname !== '') return;

        let isMounted = true;

        // Animate the progress bar slowly up to 85% while we wait
        const progressInterval = setInterval(() => {
            setProgress((prev) => (prev < 85 ? prev + 5 : prev));
        }, 600);

        const checkHealth = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/api/health`, {
                    method: 'GET',
                    cache: 'no-store',
                });
                return response.ok;
            } catch (err) {
                // Server is still sleeping, fetch will fail
                return false;
            }
        };

        // Ping the backend every 100ms as requested
        const pollId = setInterval(async () => {
            const isAwake = await checkHealth();
            
            if (isAwake && isMounted) {
                // Stop polling and progress animation
                clearInterval(pollId);
                clearInterval(progressInterval);
                
                // Update UI to show success
                setStatus('online');
                setProgress(100);
                
                // Give it a brief half-second pause so the user sees 100% completion 
                // before getting redirected to their new room
                setTimeout(() => {
                    if (isMounted) {
                        const randomRoomId = crypto.randomUUID().slice(0, 8);
                        router.replace(`/${randomRoomId}`);
                    }
                }, 500);
            }
        }, 100);

        // Cleanup intervals on unmount
        return () => {
            isMounted = false;
            clearInterval(pollId);
            clearInterval(progressInterval);
        };
    }, [pathname, router, apiBaseUrl]);

    // Don't render anything if we aren't on the root path
    if (pathname !== '/' && pathname !== '') return null;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white px-4 font-sans">
            <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 p-8 shadow-2xl space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    {/* Spinner */}
                    <div className="relative flex h-12 w-12 items-center justify-center">
                        <div className="absolute h-full w-full rounded-full border-4 border-orange-500/20 animate-pulse"></div>
                        <div className="absolute h-full w-full rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                    </div>
                    
                    <h2 className="text-xl font-semibold tracking-wide text-gray-100">
                        Initializing Workspace
                    </h2>
                    
                    <p className="text-sm text-gray-400 font-medium">
                        {status === 'waking' 
                            ? 'Waking up backend server from sleep...' 
                            : 'Server online! Creating your secure room...'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Status</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
