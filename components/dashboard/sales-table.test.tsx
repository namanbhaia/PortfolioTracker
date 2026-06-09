import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SalesTable from './sales-table';
import React from 'react';

// Mock UI components
vi.mock("@/components/tables/trx-id-cell", () => ({
    default: ({ id }: { id: string }) => <span>{id}</span>
}));
vi.mock("@/components/tables/comment-cell", () => ({
    default: ({ comment }: { comment: string }) => <span>{comment}</span>
}));
vi.mock("@/components/tables/ticker-cell", () => ({
    default: ({ ticker }: { ticker: string }) => <td>{ticker}</td>
}));
vi.mock("@/components/tables/sort-arrow", () => ({
    default: () => <span>^</span>
}));

describe('SalesTable', () => {
    const mockIsVisible = vi.fn().mockReturnValue(true);
    const mockSales = [
        {
            trx_id: 'SALE1',
            client_name: 'Client A',
            ticker: 'RELIANCE',
            stock_name: 'Reliance Industries',
            purchase_date: '2023-01-01',
            purchase_qty: 10,
            purchase_rate: 2500,
            purchase_value: 25000,
            sale_date: '2024-01-02',
            sale_qty: 10,
            sale_rate: 2600,
            sale_value: 26000,
            pl_percentage: 4,
            pl: 1000,
            adjusted_pl: 1000,
            long_term: true,
            comments: 'Sold'
        }
    ];

    it('renders sales data correctly', async () => {
        render(<SalesTable sales={mockSales} isVisible={mockIsVisible} />);

        expect(screen.getByText('SALE1')).toBeDefined();
        expect(screen.getByText('Client A')).toBeDefined();
        expect(screen.getByText('RELIANCE')).toBeDefined();
        expect(screen.getByText(/Reliance Industries/i)).toBeDefined();
        expect(screen.getByText(/2600.00/)).toBeDefined();
        expect(screen.getAllByText(/1,000.00/)).toHaveLength(4); // 2 in row (Total P/L & Grandfathered P/L), 2 in footer
    });

    it('calculates and renders footer sums correctly', async () => {
        const multipleSales = [
            {
                trx_id: 'SALE1',
                client_name: 'Client A',
                ticker: 'RELIANCE',
                stock_name: 'Reliance Industries',
                purchase_date: '2023-01-01',
                purchase_qty: 10,
                purchase_rate: 2500,
                purchase_value: 25000,
                sale_date: '2024-01-02',
                sale_qty: 10,
                sale_rate: 2600,
                sale_value: 26000,
                pl_percentage: 4,
                pl: 1000,
                adjusted_pl: 800,
                long_term: true,
                comments: 'Sold 1'
            },
            {
                trx_id: 'SALE2',
                client_name: 'Client B',
                ticker: 'TCS',
                stock_name: 'Tata Consultancy Services',
                purchase_date: '2023-02-01',
                purchase_qty: 5,
                purchase_rate: 3000,
                purchase_value: 15000,
                sale_date: '2024-02-02',
                sale_qty: 5,
                sale_rate: 2800,
                sale_value: 14000,
                pl_percentage: -6.67,
                pl: -1000,
                adjusted_pl: -500,
                long_term: false,
                comments: 'Sold 2'
            }
        ];

        render(<SalesTable sales={multipleSales} isVisible={mockIsVisible} />);

        // Expected totals:
        // Purchase Qty: 15
        // Purchase Value: 40000
        // Sale Qty: 15
        // Sale Value: 40000
        // Total PL: 0.00
        // Grandfathered PL: 300.00

        expect(screen.getAllByText('Total')).toBeDefined();
        expect(screen.getAllByText('15')).toHaveLength(2); // Purchase Qty (15) and Sale Qty (15)
        expect(screen.getAllByText('₹40,000')).toHaveLength(2); // Purchase Value (₹40,000) and Sale Value (₹40,000)
        expect(screen.getByText('₹0.00')).toBeDefined(); // Total P/L
        expect(screen.getByText('₹300.00')).toBeDefined(); // Grandfathered P/L
    });

    it('calls onSort when header is clicked', async () => {
        const mockOnSort = vi.fn();
        render(<SalesTable sales={mockSales} onSort={mockOnSort} isVisible={mockIsVisible} />);

        fireEvent.click(await screen.findByRole('button', { name: /Date/i }));
        expect(mockOnSort).toHaveBeenCalledWith('sale_date');
    });
});
