import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './admin-bulk-ops';

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

// Mock dependencies - constructors must use `function` (not arrow functions) so `new` works
const mockEditorInstance = {
    remapEntireLedger: vi.fn().mockResolvedValue(true)
};

vi.mock('../transactions/transaction-editor', () => {
    return {
        TransactionEditor: vi.fn().mockImplementation(function () {
            return mockEditorInstance;
        })
    };
});

vi.mock('../transactions/ledger-repository', () => {
    return {
        LedgerRepository: vi.fn().mockImplementation(function () {
            return {};
        })
    };
});

import { TransactionEditor } from '../transactions/transaction-editor';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

describe('Admin Bulk Operations Actions', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Re-configure constructor mocks after clearAllMocks
        vi.mocked(TransactionEditor).mockImplementation(function () {
            return mockEditorInstance;
        } as any);

        // Reset shared editor methods
        mockEditorInstance.remapEntireLedger.mockResolvedValue(true);

        mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
        };
        mockSupabase = {
            rpc: vi.fn(),
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        };
        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    describe('bulkAssetUpdateAction', () => {
        it('should trigger the bulk_asset_update SQL function with correct payload', async () => {
            const assets = [{ ticker: 'TCS', current_price: 100 }];
            mockSupabase.rpc.mockResolvedValue({ error: null });

            const result = await actions.bulkAssetUpdateAction(assets);

            expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_asset_update', {
                payload: { assets_to_upsert: assets }
            });
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should throw an error if the RPC call fails', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: { message: 'Database error' } });

            await expect(actions.bulkAssetUpdateAction([]))
                .rejects
                .toThrow('Database error');
        });
    });

    describe('runBseToNseMigrationAction', () => {
        it('should trigger the migrate_bse_to_nse SQL function', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: null });

            const result = await actions.runBseToNseMigrationAction();

            expect(mockSupabase.rpc).toHaveBeenCalledWith('migrate_bse_to_nse');
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should throw an error if the migration RPC call fails', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: { message: 'Migration failed' } });

            await expect(actions.runBseToNseMigrationAction())
                .rejects
                .toThrow('Migration failed');
        });
    });

    describe('bulkLedgerUpdateAction', () => {
        it('should trigger the atomic_ledger_update SQL function with full payload', async () => {
            const payload = {
                purchases_to_insert: [{ ticker: 'TCS', qty: 10 }],
                sales_to_delete: ['trx-123']
            };
            mockSupabase.rpc.mockResolvedValue({ error: null });

            const result = await actions.bulkLedgerUpdateAction(payload);

            expect(mockSupabase.rpc).toHaveBeenCalledWith('atomic_ledger_update', {
                payload
            });
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should throw an error if the atomic ledger update RPC call fails', async () => {
            mockSupabase.rpc.mockResolvedValue({ error: { message: 'Ledger commit error' } });

            await expect(actions.bulkLedgerUpdateAction({}))
                .rejects
                .toThrow('Ledger commit error');
        });
    });

    describe('remapAllLedgersAction', () => {
        it('should loop and remap all unique client-ticker ledger pairs', async () => {
            const mockPurchases = [
                { client_name: 'Client A', ticker: 'TCS' },
                { client_name: 'Client A', ticker: 'TCS' }, // duplicate - should be deduplicated
                { client_name: 'Client B', ticker: 'INFY' }
            ];
            mockQueryBuilder.select.mockResolvedValue({ data: mockPurchases, error: null });

            const result = await actions.remapAllLedgersAction();

            // Should be called exactly 2 times (2 unique pairs, not 3)
            expect(mockEditorInstance.remapEntireLedger).toHaveBeenCalledTimes(2);
            expect(mockEditorInstance.remapEntireLedger).toHaveBeenCalledWith('Client A', 'TCS');
            expect(mockEditorInstance.remapEntireLedger).toHaveBeenCalledWith('Client B', 'INFY');
            expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
            expect(result).toEqual({ success: true });
        });

        it('should return success immediately if no purchases exist', async () => {
            mockQueryBuilder.select.mockResolvedValue({ data: null, error: null });

            const result = await actions.remapAllLedgersAction();

            // remapEntireLedger should not have been called at all (data is null)
            expect(mockEditorInstance.remapEntireLedger).not.toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });
    });
});
