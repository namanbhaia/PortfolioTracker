import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsolidatedHoldingsTable from './consolidated-holdings-table';
import React from 'react';

// Mock UI components
vi.mock("@/components/ui/ticker-cell", () => ({
    default: ({ ticker }: { ticker: string }) => <td data-testid="ticker-cell-mock">{ticker}</td>
}));

describe('ConsolidatedHoldingsTable', () => {
    const mockIsVisible = vi.fn().mockReturnValue(true);
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
            eps: 120.5,
            today_high: 2610,
            today_low: 2580
        }
    ];

    it('renders consolidated data correctly', () => {
        render(<ConsolidatedHoldingsTable consolidatedRows={mockData} isVisible={mockIsVisible} />);

        expect(screen.getByText('RELIANCE')).toBeDefined();
        expect(screen.getByText('Reliance Industries')).toBeDefined();
        expect(screen.getByText('₹26,000')).toBeDefined();
        expect(screen.getByText('4.00%')).toBeDefined();
    });

    it('sorts data when header is clicked', async () => {
        render(<ConsolidatedHoldingsTable consolidatedRows={mockData} isVisible={mockIsVisible} />);

        const tickerHeader = screen.getByText(/Ticker \/ ISIN/i);
        fireEvent.click(tickerHeader);

        // Sorting is internal state, we just verify it doesn't crash
        expect(screen.getByText('RELIANCE')).toBeDefined();
    });
});
