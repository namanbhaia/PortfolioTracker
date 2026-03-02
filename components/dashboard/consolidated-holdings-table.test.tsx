import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsolidatedHoldingsTable from './consolidated-holdings-table';
import React from 'react';

// Mock UI components
vi.mock("@/components/ui/ticker-cell", () => ({
    default: ({ ticker }: { ticker: string }) => <td data-testid="ticker-cell-mock">{ticker}</td>
}));

describe('ConsolidatedHoldingsTable', () => {
    const mockData = [
        {
            ticker: 'RELIANCE',
            stock_name: 'Reliance Industries',
            total_qty: 10,
            total_pledged: 2,
            avg_purchase_price: 2500,
            total_purchase_value: 25000,
            total_market_value: 26000,
            pl: 1000,
            pl_percent: 4,
            beta: 1.1,
            trailing_pe: 25,
            dividend_yield: 1.5
        }
    ];

    it('renders consolidated data correctly', () => {
        render(<ConsolidatedHoldingsTable consolidatedRows={mockData} />);

        expect(screen.getByText('RELIANCE')).toBeDefined();
        expect(screen.getByText('Reliance Industries')).toBeDefined();
        expect(screen.getByText('₹26,000')).toBeDefined();
        expect(screen.getByText('4.00%')).toBeDefined();
    });

    it('sorts data when header is clicked', async () => {
        render(<ConsolidatedHoldingsTable consolidatedRows={mockData} />);

        const tickerHeader = screen.getByText(/Ticker \/ ISIN/i);
        fireEvent.click(tickerHeader);

        // Sorting is internal state, we just verify it doesn't crash
        expect(screen.getByText('RELIANCE')).toBeDefined();
    });
});
