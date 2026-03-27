import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeminiTab from './gemini-tab';
import React from 'react';

// Mocking dependencies
vi.mock('@/lib/actions/suggestions/gemini_suggestions', () => ({
    getStockSuggestions: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    TrendingDown: () => <div data-testid="trending-down-icon" />,
    Minus: () => <div data-testid="minus-icon" />,
    MessageCircle: () => <div data-testid="message-circle-icon" />,
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    )
}));
vi.mock("@/components/ui/card", () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardDescription: ({ children }: any) => <div>{children}</div>,
}));

describe('GeminiTab', () => {
    const mockHoldings = [];
    const mockTransactions = [];
    const mockClients = [];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the initial state with the generate button', () => {
        render(<GeminiTab holdings={mockHoldings} transactions={mockTransactions} clients={mockClients} />);

        expect(screen.getByText(/AI-Powered Insights/i)).toBeDefined();
        expect(screen.getByText(/Generate Insights/i)).toBeDefined();
    });

    it('shows loading state when generating insights', async () => {
        const { getStockSuggestions } = await import('@/lib/actions/suggestions/gemini_suggestions');
        (getStockSuggestions as any).mockReturnValue(new Promise(() => { })); // Never resolves to keep loading

        render(<GeminiTab holdings={mockHoldings} transactions={mockTransactions} clients={mockClients} />);

        fireEvent.click(screen.getByText(/Generate Insights/i));

        expect(screen.getByText(/Processing Portfolio.../i)).toBeDefined();
    });

    it('renders suggestions when successfully generated', async () => {
        const mockSuggestions = [
            { symbol: 'RELIANCE', action: 'BUY', reasoning: 'Strong growth', confidence: 0.9, targetPrice: 3000 }
        ];
        const { getStockSuggestions } = await import('@/lib/actions/suggestions/gemini_suggestions');
        (getStockSuggestions as any).mockResolvedValue(mockSuggestions);

        render(<GeminiTab holdings={mockHoldings} transactions={mockTransactions} clients={mockClients} />);

        fireEvent.click(screen.getByText(/Generate Insights/i));

        await waitFor(() => {
            expect(screen.getByText('RELIANCE')).toBeDefined();
            expect(screen.getByText('BUY')).toBeDefined();
            expect(screen.getByText(/Strong growth/i)).toBeDefined();
        });
    });
});
