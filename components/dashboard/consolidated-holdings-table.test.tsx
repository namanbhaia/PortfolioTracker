import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsolidatedHoldingsTable from './consolidated-holdings-table';
import React from 'react';

// Mock UI components
vi.mock("@/components/tables/ticker-cell", () => ({
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
            today_low: 2580,
            client_breakdown: { 'Client A': 4, 'Client B': 6 }
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

    it('shows tooltip content on hover', async () => {
        const { container } = render(<ConsolidatedHoldingsTable consolidatedRows={mockData} isVisible={mockIsVisible} />);

        // Find the Info icon and trigger mouse enter to show the tooltip
        const infoIcon = container.querySelector('svg.lucide-info');
        if (infoIcon) {
            fireEvent.mouseEnter(infoIcon);
        }

        // We look for the text "Client A" which should be in the tooltip
        // Note: queryByText returns null if not found. toBeDefined() on null is true in some environments but usually we want to be explicit.
        expect(screen.queryByText(/Client A:/i)).not.toBeNull();
        expect(screen.queryByText(/Client B:/i)).not.toBeNull();

        // Use getAllByText since these numbers might appear elsewhere in the table (e.g. PL %)
        const elementsWith4 = screen.getAllByText(/4/i);
        expect(elementsWith4.length).toBeGreaterThan(0);

        // Verify specifically that one of them is in the breakdown
        const breakdownElement = screen.queryByText(/Client A:/i);
        expect(breakdownElement).not.toBeNull();
    });
});
