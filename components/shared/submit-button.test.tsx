import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmitButton } from './submit-button';
import React from 'react';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Loader2: () => <div data-testid="loader-icon" />,
}));

// Mock button
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, type, disabled, className }: any) => (
        <button type={type} disabled={disabled} className={className}>{children}</button>
    )
}));

describe('SubmitButton', () => {
    it('renders the default label', () => {
        render(<SubmitButton />);
        expect(screen.getByText('Run Report')).toBeDefined();
    });

    it('renders a custom label', () => {
        render(<SubmitButton label="Submit Form" />);
        expect(screen.getByText('Submit Form')).toBeDefined();
    });

    it('shows loading state when isPending is true', () => {
        render(<SubmitButton isPending={true} loadingText="Saving..." />);
        expect(screen.getByText('Saving...')).toBeDefined();
        expect(screen.getByTestId('loader-icon')).toBeDefined();
    });

    it('is disabled when isPending is true', () => {
        render(<SubmitButton isPending={true} />);
        const button = screen.getByRole('button') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
    });
});
