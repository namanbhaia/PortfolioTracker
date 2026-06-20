import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './update-transactions';

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

// Mock dependencies - TransactionEditor and LedgerRepository must be constructor functions
const mockEditorInstance = {
    editPurchaseRate: vi.fn().mockResolvedValue(true),
    editPurchaseQty: vi.fn().mockResolvedValue(true),
    editPurchaseDate: vi.fn().mockResolvedValue(true),
    editSaleRate: vi.fn().mockResolvedValue(true),
    editSaleQty: vi.fn().mockResolvedValue(true),
    editSaleDate: vi.fn().mockResolvedValue(true)
};

vi.mock('@/lib/actions/transactions/transaction-editor', () => {
    return {
        TransactionEditor: vi.fn().mockImplementation(function () {
            return mockEditorInstance;
        })
    };
});

vi.mock('@/lib/actions/transactions/ledger-repository', () => {
    return {
        LedgerRepository: vi.fn().mockImplementation(function () {
            return {};
        })
    };
});

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TransactionEditor } from '@/lib/actions/transactions/transaction-editor';

describe('Update Transactions Actions', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Re-configure editor mock after clearAllMocks
        vi.mocked(TransactionEditor).mockImplementation(function () {
            return mockEditorInstance;
        } as any);

        // Reset all editor method mocks
        mockEditorInstance.editPurchaseRate.mockResolvedValue(true);
        mockEditorInstance.editPurchaseQty.mockResolvedValue(true);
        mockEditorInstance.editPurchaseDate.mockResolvedValue(true);
        mockEditorInstance.editSaleRate.mockResolvedValue(true);
        mockEditorInstance.editSaleQty.mockResolvedValue(true);
        mockEditorInstance.editSaleDate.mockResolvedValue(true);

        mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        };
        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
            },
            from: vi.fn().mockReturnValue(mockQueryBuilder)
        };
        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    it('should return error if unauthorized', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        const result = await actions.updateTransaction('123', 'purchase', {}, '/dashboard');

        expect(result).toEqual({ error: 'Unauthorized' });
    });

    describe('Purchase Modification Routing', () => {
        it('should edit purchase rate if rate changes', async () => {
            const original = { trx_id: '123', rate: 100, purchase_qty: 10, date: '2024-01-01', comments: 'old' };
            mockQueryBuilder.single.mockResolvedValue({ data: original, error: null });

            const data = { rate: 120, qty: 10, date: '2024-01-01', comments: 'old' };
            const result = await actions.updateTransaction('123', 'purchase', data, '/dashboard');

            expect(mockEditorInstance.editPurchaseRate).toHaveBeenCalledWith('123', 120);
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should edit purchase qty if quantity changes', async () => {
            const original = {
                trx_id: '123', rate: 100, purchase_qty: 10,
                date: '2024-01-01', comments: 'old', client_name: 'Client A'
            };
            mockQueryBuilder.single.mockResolvedValue({ data: original, error: null });

            const data = { rate: 100, qty: 15, date: '2024-01-01', comments: 'old', ticker: 'TCS' };
            await actions.updateTransaction('123', 'purchase', data, '/dashboard');

            expect(mockEditorInstance.editPurchaseQty).toHaveBeenCalledWith(
                '123', 15, 'Client A', 'TCS', '2024-01-01'
            );
        });

        it('should edit purchase date if date changes', async () => {
            const original = {
                trx_id: '123', rate: 100, purchase_qty: 10,
                date: '2024-01-01', comments: 'old', client_name: 'Client A'
            };
            mockQueryBuilder.single.mockResolvedValue({ data: original, error: null });

            const data = { rate: 100, qty: 10, date: '2024-01-05', comments: 'old', ticker: 'TCS' };
            await actions.updateTransaction('123', 'purchase', data, '/dashboard');

            expect(mockEditorInstance.editPurchaseDate).toHaveBeenCalledWith(
                '123', '2024-01-05', '2024-01-01', 'Client A', 'TCS'
            );
        });

        it('should update comments directly in DB if comments change', async () => {
            const original = { trx_id: '123', rate: 100, purchase_qty: 10, date: '2024-01-01', comments: 'old' };

            // Use per-table mocks to avoid the shared builder's .eq chain conflict:
            // - from('purchases') for the select fetch uses single()
            // - from('purchases') for the update uses update().eq()
            const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
            let purchasesCallCount = 0;

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'purchases') {
                    purchasesCallCount++;
                    if (purchasesCallCount === 1) {
                        // First call: select original record
                        return {
                            select: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: original, error: null })
                                })
                            }),
                            update: mockUpdate
                        };
                    } else {
                        // Second call: the update for comments
                        return {
                            select: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: original, error: null })
                                })
                            }),
                            update: mockUpdate
                        };
                    }
                }
                return mockQueryBuilder;
            });

            const data = { rate: 100, qty: 10, date: '2024-01-01', comments: 'new' };
            await actions.updateTransaction('123', 'purchase', data, '/dashboard');

            expect(mockSupabase.from).toHaveBeenCalledWith('purchases');
            expect(mockUpdate).toHaveBeenCalledWith({ comments: 'new' });
            expect(mockUpdateEq).toHaveBeenCalledWith('trx_id', '123');
        });

        it('should return error if purchase transaction is not found', async () => {
            mockQueryBuilder.single.mockResolvedValue({
                data: null,
                error: { message: 'Row not found' }
            });

            const result = await actions.updateTransaction('nonexistent', 'purchase', {}, '/dashboard');

            expect(result).toEqual({ error: expect.stringContaining('Transaction not found') });
        });
    });

    describe('Sale Modification Routing', () => {
        it('should edit sale rate and quantity using custom_id when rate and qty change', async () => {
            const original = {
                trx_id: 'abc', custom_id: 'custom-99', rate: 150,
                sale_qty: 5, date: '2024-01-10', comments: 'old', client_name: 'Client A'
            };

            let salesCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'sales') {
                    salesCallCount++;
                    if (salesCallCount === 1) {
                        // First call: fetch original record via trx_id
                        return {
                            select: () => ({
                                eq: () => ({
                                    single: () => Promise.resolve({ data: original, error: null })
                                })
                            })
                        };
                    } else {
                        // Second call: fetch splits by custom_id for total qty calculation
                        return {
                            select: () => ({
                                eq: () => Promise.resolve({ data: [{ sale_qty: 5 }], error: null })
                            }),
                            update: () => ({
                                eq: () => Promise.resolve({ error: null })
                            })
                        };
                    }
                }
                return mockQueryBuilder;
            });

            const data = { rate: 160, qty: 8, date: '2024-01-10', comments: 'old', ticker: 'TCS' };
            await actions.updateTransaction('abc', 'sale', data, '/dashboard');

            // Rate changed (150 → 160): editSaleRate should be called with custom_id
            expect(mockEditorInstance.editSaleRate).toHaveBeenCalledWith('custom-99', 160);
            // Qty changed (5 → 8): editSaleQty should be called with custom_id
            expect(mockEditorInstance.editSaleQty).toHaveBeenCalledWith(
                'custom-99', 8, 'Client A', 'TCS', '2024-01-10'
            );
        });
    });
});
