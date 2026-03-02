import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseForm } from './purchase-form';
import React from 'react';

// Mocking dependencies
vi.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-asset-id' } }),
        insert: vi.fn().mockResolvedValue({ error: null }),
    }),
}));

vi.mock('@/lib/actions/yahoo/find-ticker', () => ({
    getStockSuggestion: vi.fn(),
}));

vi.mock('@/lib/actions/cache-revalidate', () => ({
    revalidateDashboard: vi.fn(),
}));

vi.mock('@/lib/actions/update-assets-table', () => ({
    upsertInAsset: vi.fn(),
}));

describe('PurchaseForm', () => {
    const mockClients = [
        { client_id: '1', client_name: 'Client A', dp_id: 'DP1', trading_id: 'T1' },
        { client_id: '2', client_name: 'Client B', dp_id: 'DP2', trading_id: 'T2' },
    ];
    const mockSetSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields', async () => {
        render(<PurchaseForm clients={mockClients} setSuccess={mockSetSuccess} />);
        screen.debug();
        expect(screen.getByText(/Confirm Purchase/i)).toBeDefined();
    });

    it('auto-populates DP ID and Trading ID when a client is selected', async () => {
        render(<PurchaseForm clients={mockClients} setSuccess={mockSetSuccess} />);

        const clientSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(clientSelect, { target: { value: 'Client A' } });

        await waitFor(() => {
            expect((screen.getByTestId('dp-id-input') as HTMLInputElement).value).toBe('DP1');
            expect((screen.getByTestId('trading-id-input') as HTMLInputElement).value).toBe('T1');
        });
    });

    it('submits the form successfully when assets exist', async () => {
        render(<PurchaseForm clients={mockClients} setSuccess={mockSetSuccess} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Client A' } });
        fireEvent.change(screen.getByPlaceholderText(/Ticker/i), { target: { value: 'RELIANCE' } });
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '2500' } });
        fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '10' } });

        const submitButton = screen.getByRole('button', { name: /Confirm Purchase/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockSetSuccess).toHaveBeenCalledWith(true);
        });
    });
});
