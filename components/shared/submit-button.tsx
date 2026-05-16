"use client"

/**
 * @file submit-button.tsx
 * @description A specialized submit button with a pending/loading state for use in forms.
 */

import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

// Define the interface to accept a custom label
interface SubmitButtonProps {
    isPending?: boolean;
    disabled?: boolean;
    label?: string; // The customizable name
    classname?: string;
    loadingText?: string
}

/**
 * Reusable Submit Button component with loading feedback.
 * @param {SubmitButtonProps} props - Component props.
 */
export function SubmitButton({ isPending, disabled, label = "Run Report", classname, loadingText = "Loading ..." }: SubmitButtonProps) {
    return (
        <Button
            type="submit"
            disabled={isPending || disabled}
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