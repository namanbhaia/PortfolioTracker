import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TechnicalTab from './technical-tab';
import React from 'react';

// Mocking dependencies
vi.mock('@/lib/actions/suggestions/technical_suggestions', () => ({
    getTechnicalSuggestions: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    TrendingUp: () => <div />,
    TrendingDown: () => <div />,
    BarChart3: () => <div />,
    Activity: () => <div />,
    Scale: () => <div />,
    ChevronUp: () => <div />,
    ChevronDown: () => <div />,
    AlertCircle: () => <div />,
    CheckCircle2: () => <div />,
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardTitle: ({ children }: any) => <div>{children}</div>,
    CardDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/tabs", () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <div>{children}</div>,
}));

describe('TechnicalTab', () => {
    const mockHoldings = [];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading pulse initially', async () => {
        const { getTechnicalSuggestions } = await import('@/lib/actions/suggestions/technical_suggestions');
        (getTechnicalSuggestions as any).mockReturnValue(new Promise(() => { })); // Never-ending promise

        const { container } = render(<TechnicalTab holdings={mockHoldings} />);
        expect(container.querySelector('.animate-pulse')).toBeDefined();
    });

    it('renders technical insights when loaded', async () => {
        const mockSuggestions = {
            aboveHigh: [{ ticker: 'TCS', stock_name: 'Tata Consultancy', type: 'Above 52W High', value: '3500', description: 'Strong breakout' }],
            belowLow: [],
            highVolume: [],
            lowVolume: [],
            highPE: [],
            lowPE: []
        };
        const { getTechnicalSuggestions } = await import('@/lib/actions/suggestions/technical_suggestions');
        (getTechnicalSuggestions as any).mockResolvedValue(mockSuggestions);

        render(<TechnicalTab holdings={mockHoldings} />);

        await waitFor(() => {
            expect(screen.getByText('TCS')).toBeDefined();
            expect(screen.getByText(/Above 52W High/i)).toBeDefined();
        });
    });

    it('shows "No Major Signals" when suggestions are empty', async () => {
        const mockSuggestions = {
            aboveHigh: [], belowLow: [], highVolume: [], lowVolume: [], highPE: [], lowPE: []
        };
        const { getTechnicalSuggestions } = await import('@/lib/actions/suggestions/technical_suggestions');
        (getTechnicalSuggestions as any).mockResolvedValue(mockSuggestions);

        render(<TechnicalTab holdings={mockHoldings} />);

        await waitFor(() => {
            expect(screen.getAllByText(/No Major Signals/i).length).toBeGreaterThan(0);
        });
    });
});
