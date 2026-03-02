import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaleForm } from './sale-form';
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
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { client_id: 'c1' } }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockResolvedValue({ data: 1 }),
    }),
}));

vi.mock('@/components/helper/utility', () => ({
    calculateProfitMetrics: vi.fn().mockReturnValue({ profit: 100, adjusted_profit: 100 }),
    getGrandfatheredRate: vi.fn().mockResolvedValue(150),
    isLongTerm: vi.fn().mockReturnValue(false),
    isSquareOff: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/actions/cache-revalidate', () => ({
    revalidateDashboard: vi.fn(),
}));

describe('SaleForm', () => {
    const mockClients = [
        { client_id: '1', client_name: 'Client A', dp_id: 'DP1', trading_id: 'T1' },
    ];
    const mockSetSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields', async () => {
        render(<SaleForm clients={mockClients} setSuccess={mockSetSuccess} />);
        expect(screen.getByText(/Confirm Sale/i)).toBeDefined();
    });

    it('auto-populates DP ID and Trading ID when a client is selected', async () => {
        render(<SaleForm clients={mockClients} setSuccess={mockSetSuccess} />);

        const clientSelect = screen.getAllByRole('combobox')[0]; // First select is client
        fireEvent.change(clientSelect, { target: { value: 'Client A' } });

        await waitFor(() => {
            expect((screen.getByTestId('dp-id-input') as HTMLInputElement).value).toBe('DP1');
            expect((screen.getByTestId('trading-id-input') as HTMLInputElement).value).toBe('T1');
        });
    });
});
