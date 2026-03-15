import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HoldingsTable from './holdings-table';
import React from 'react';

// Mock UI components
vi.mock("@/components/ui/trx-id-cell", () => ({
    default: ({ id }: { id: string }) => <span>{id}</span>
}));
vi.mock("@/components/ui/comment-cell", () => ({
    default: ({ comment }: { comment: string }) => <span>{comment}</span>
}));
vi.mock("@/components/ui/ticker-cell", () => ({
    default: ({ ticker }: { ticker: string }) => <td data-testid="ticker-cell-mock">{ticker}</td>
}));
vi.mock("@/components/ui/sort-arrow", () => ({
    default: () => <span>^</span>
}));

describe('HoldingsTable', () => {
    const mockIsVisible = vi.fn().mockReturnValue(true);
    const mockHoldings = [
        {
            trx_id: 'TRX1',
            client_name: 'Client A',
            ticker: 'RELIANCE',
            stock_name: 'Reliance Industries',
            date: '2023-01-01',
            purchase_qty: 10,
            rate: 2500,
            purchase_value: 25000,
            long_term: true,
            comments: 'Buy'
        }
    ];

    it('renders holdings data correctly', () => {
        render(<HoldingsTable holdings={mockHoldings} isVisible={mockIsVisible} />);

        expect(screen.getByText('Client A')).toBeDefined();
        expect(screen.getByTestId('ticker-cell-mock')).toHaveTextContent('RELIANCE');
        expect(screen.getByText(/Reliance Industries/i)).toBeDefined();
        // Checking for value with commas (en-IN format renders 25,000)
        expect(screen.getByText(/25,000/)).toBeDefined();
        expect(screen.getByText('10')).toBeDefined();
    });

    it('calls onSort when a header button is clicked', () => {
        const onSortMock = vi.fn();
        render(<HoldingsTable holdings={mockHoldings} onSort={onSortMock} isVisible={mockIsVisible} />);

        fireEvent.click(screen.getByRole('button', { name: /Client Info/i }));
        expect(onSortMock).toHaveBeenCalledWith('client_name');
    });
});
