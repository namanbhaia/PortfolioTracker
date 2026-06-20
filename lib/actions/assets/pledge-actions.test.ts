import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './pledge-actions';

// Mock Next.js Cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => {
    return {
        createClient: vi.fn()
    };
});

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

describe('Pledge Actions', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        };
        mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        };
        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    describe('pledgeShares', () => {
        it('should throw an error if the pledge quantity exceeds total owned shares', async () => {
            // Existing pledge: 5 shares, Holdings (owned): 10 shares, Attempt: 6 more → total 11 > 10
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'pledges') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: { pledged_qty: 5 }, error: null })
                                })
                            })
                        })
                    };
                }
                if (table === 'client_holdings') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => Promise.resolve({ data: [{ balance_qty: 10 }], error: null })
                            })
                        })
                    };
                }
                return mockQueryBuilder;
            });

            await expect(actions.pledgeShares('Client A', 'TCS', 6))
                .rejects
                .toThrow(/Cannot pledge 6 more shares. Total owned: 10/);
        });

        it('should successfully upsert new pledged quantity if within limits', async () => {
            // Existing pledge: 2 shares, Holdings: 10 shares, Pledge: 3 more → total 5 <= 10
            const mockUpsert = vi.fn().mockResolvedValue({ error: null });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'pledges') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: { pledged_qty: 2 }, error: null })
                                })
                            })
                        }),
                        upsert: mockUpsert
                    };
                }
                if (table === 'client_holdings') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => Promise.resolve({ data: [{ balance_qty: 10 }], error: null })
                            })
                        })
                    };
                }
                return mockQueryBuilder;
            });

            const result = await actions.pledgeShares('Client A', 'TCS', 3);

            expect(mockUpsert).toHaveBeenCalledWith(
                { client_name: 'Client A', ticker: 'TCS', pledged_qty: 5 },
                { onConflict: 'client_name, ticker' }
            );
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard/pledging');
            expect(result).toEqual({ success: true });
        });

        it('should allow pledge when no existing pledge exists (new pledge)', async () => {
            // No existing pledge (single returns null with error)
            const mockUpsert = vi.fn().mockResolvedValue({ error: null });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'pledges') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: null, error: { message: 'Not found' } })
                                })
                            })
                        }),
                        upsert: mockUpsert
                    };
                }
                if (table === 'client_holdings') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => Promise.resolve({ data: [{ balance_qty: 15 }], error: null })
                            })
                        })
                    };
                }
                return mockQueryBuilder;
            });

            const result = await actions.pledgeShares('Client B', 'INFY', 5);
            // 0 existing + 5 new = 5, which is <= 15 total owned
            expect(mockUpsert).toHaveBeenCalledWith(
                { client_name: 'Client B', ticker: 'INFY', pledged_qty: 5 },
                { onConflict: 'client_name, ticker' }
            );
            expect(result).toEqual({ success: true });
        });
    });

    describe('unpledgeShares', () => {
        it('should throw an error if no pledged shares are found', async () => {
            mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

            await expect(actions.unpledgeShares('Client A', 'TCS', 5))
                .rejects
                .toThrow('No pledged shares found for this asset.');
        });

        it('should delete the pledge record if remaining quantity drops to 0', async () => {
            // Existing pledge: 5 shares. Unpledge: 5 shares. Remaining: 0
            // Chain: .from('pledges').delete().eq('client_name', ...).eq('ticker', ...) → { error: null }
            const mockEqForDelete = vi.fn().mockResolvedValue({ error: null });
            const mockDeleteEq = vi.fn().mockReturnValue({ eq: mockEqForDelete });
            const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'pledges') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: { pledged_qty: 5 }, error: null })
                                })
                            })
                        }),
                        delete: mockDelete
                    };
                }
                return mockQueryBuilder;
            });

            const result = await actions.unpledgeShares('Client A', 'TCS', 5);

            expect(mockDelete).toHaveBeenCalled();
            expect(mockDeleteEq).toHaveBeenCalledWith('client_name', 'Client A');
            expect(mockEqForDelete).toHaveBeenCalledWith('ticker', 'TCS');
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should update the pledge record if remaining quantity is greater than 0', async () => {
            // Existing pledge: 5 shares. Unpledge: 3 shares. Remaining: 2
            // Chain: .from('pledges').update({ pledged_qty: 2 }).eq('client_name', ...).eq('ticker', ...) → { error: null }
            const mockEqForUpdate = vi.fn().mockResolvedValue({ error: null });
            const mockUpdateEq = vi.fn().mockReturnValue({ eq: mockEqForUpdate });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'pledges') {
                    return {
                        select: () => ({
                            eq: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: { pledged_qty: 5 }, error: null })
                                })
                            })
                        }),
                        update: mockUpdate
                    };
                }
                return mockQueryBuilder;
            });

            const result = await actions.unpledgeShares('Client A', 'TCS', 3);

            expect(mockUpdate).toHaveBeenCalledWith({ pledged_qty: 2 });
            expect(mockUpdateEq).toHaveBeenCalledWith('client_name', 'Client A');
            expect(mockEqForUpdate).toHaveBeenCalledWith('ticker', 'TCS');
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });
    });
});
