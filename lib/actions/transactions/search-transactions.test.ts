import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchTransactions } from './search-transactions';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('searchTransactions', () => {
    let mockSupabase: any;

    const createMockChain = (data: any = [], error: any = null) => {
        const chain: any = {
            select: vi.fn().mockImplementation(() => chain),
            eq: vi.fn().mockImplementation(() => chain),
            in: vi.fn().mockImplementation(() => chain),
            single: vi.fn().mockImplementation(() => chain),
            not: vi.fn().mockImplementation(() => chain),
            order: vi.fn().mockImplementation(() => chain),
            gte: vi.fn().mockImplementation(() => chain),
            lte: vi.fn().mockImplementation(() => chain),
            ilike: vi.fn().mockImplementation(() => chain),
            limit: vi.fn().mockImplementation(() => chain),
            then: vi.fn().mockImplementation((resolve) => resolve({ data, error })),
        };
        return chain;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            auth: {
                getUser: vi.fn(),
            },
            from: vi.fn(),
        };
        (createClient as any).mockResolvedValue(mockSupabase);
    });

    describe('Authorization & Identity', () => {
        it('should return error if unauthorized', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
            const formData = new FormData();
            const result = await searchTransactions(formData);
            expect(result).toEqual({ error: 'Unauthorized access.' });
        });

        it('should return error if no authorized clients found', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') return createMockChain({ client_ids: [] });
                if (table === 'clients') return createMockChain([]);
                return createMockChain();
            });

            const formData = new FormData();
            const result = await searchTransactions(formData);
            expect(result).toEqual({ purchases: [], sales: [], error: 'No authorized clients found.' });
        });
    });

    describe('Validation Logic', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') return createMockChain({ client_ids: ['c1'] });
                if (table === 'clients') return createMockChain([{ client_name: 'Client A' }]);
                return createMockChain();
            });
        });

        it('should validate date range (start > end)', async () => {
            const formData = new FormData();
            formData.append('start_date', '2023-12-01');
            formData.append('end_date', '2023-01-01');
            const result = await searchTransactions(formData);
            expect(result).toEqual({ error: "The 'From Date' cannot be later than the 'To Date'." });
        });

        it('should prevent future dates', async () => {
            const formData = new FormData();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            formData.append('end_date', tomorrow.toISOString().split('T')[0]);
            const result = await searchTransactions(formData);
            expect(result).toEqual({ error: "Future dates are not permitted." });
        });

        it('should prevent broad searches (only name)', async () => {
            const formData = new FormData();
            formData.append('client_name', 'Client A');
            const result = await searchTransactions(formData);
            expect(result).toEqual({ error: "Search results too broad. Please refine your search." });
        });
    });

    describe('Standard Filtering', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') return createMockChain({ client_ids: ['c1'] });
                if (table === 'clients') return createMockChain([{ client_name: 'Client A' }]);
                if (table === 'client_holdings') return createMockChain([{ id: 'p1', ticker: 'AAPL' }]);
                if (table === 'sales_view') return createMockChain([{ id: 's1', ticker: 'AAPL' }]);
                return createMockChain();
            });
        });

        it('should perform standard filtering with ticker correctly', async () => {
            const formData = new FormData();
            formData.append('client_name', 'Client A');
            formData.append('ticker', 'AAPL');
            const result = await searchTransactions(formData);
            expect(result.purchases).toHaveLength(1);
            expect(result.sales).toHaveLength(1);
        });
    });

    describe('UUID Tracing', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
        });

        it('should handle UUID tracing for Purchase', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') return createMockChain({ client_ids: ['c1'] });
                if (table === 'clients') return createMockChain([{ client_name: 'Client A' }]);
                if (table === 'client_holdings') {
                    // This mock needs to handle both verification (single) and primary (single)
                    const chain = createMockChain({ trx_id: 'p1', ticker: 'AAPL' });
                    return chain;
                }
                if (table === 'sales_view') {
                    // Verification (single) should return null to allow Purchase to take precedence if we want,
                    // or just return [] for boldSales search
                    const chain = createMockChain([]); // For boldSales
                    chain.single = vi.fn().mockImplementation(() => createMockChain(null)); // For verification
                    return chain;
                }
                return createMockChain([]);
            });

            const formData = new FormData();
            formData.append('trx_id', 'p1');
            const result = await searchTransactions(formData);
            expect(result.purchases).toBeDefined();
            expect(result.purchases![0].is_bold).toBe(true);
        });

        it('should handle UUID tracing for Sale', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') return createMockChain({ client_ids: ['c1'] });
                if (table === 'clients') return createMockChain([{ client_name: 'Client A' }]);
                if (table === 'client_holdings') {
                    const chain = createMockChain([{ trx_id: 'p1' }]); // For relatedP
                    chain.single = vi.fn().mockImplementation(() => createMockChain(null)); // For verification
                    return chain;
                }
                if (table === 'sales_view') {
                    const chain = createMockChain([]); // Default for relatedS
                    chain.single = vi.fn().mockImplementation(() => createMockChain({ trx_id: 's1', purchase_trx_id: 'p1', custom_id: 'C1' })); // For verification and primary
                    return chain;
                }
                return createMockChain([]);
            });

            const formData = new FormData();
            formData.append('trx_id', 's1');
            const result = await searchTransactions(formData);
            expect(result.sales).toBeDefined();
            expect(result.sales![0].is_bold).toBe(true);
        });
    });
});
