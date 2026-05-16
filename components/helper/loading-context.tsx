"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import GlobalSpinner from '@/components/shared/global-spinner';

/**
 * @file loading-context.tsx
 * @description Provides a global state for navigation loading, allowing components to trigger a full-screen spinner.
 */

interface LoadingContextType {
    setIsLoading: (isLoading: boolean) => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Automatically stop loading when the path or search params change
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {isLoading && <GlobalSpinner />}
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
