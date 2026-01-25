"use client"

import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

// Define the interface to accept a custom label
interface SubmitButtonProps {
    isPending?: boolean;
    label?: string; // The customizable name
    classname?: string; 
    loadingText?: string
}

export function SubmitButton({ isPending, label = "Run Report", classname, loadingText = "Loading ..." }: SubmitButtonProps) {
    return (
        <Button 
            type="submit" 
            disabled={isPending} 
            className={classname}
        >
            {isPending ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    <span>{label}</span>
                </>
            )}
        </Button>
    );
}