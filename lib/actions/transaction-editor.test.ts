import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionEditor } from './transaction-editor';
import { LedgerRepository } from './ledger-repository';

describe('TransactionEditor', () => {
    let repo: LedgerRepository;
    let editor: TransactionEditor;

    beforeEach(() => {
        repo = {
            fetchSalesByDate: vi.fn(),
            fetchPurchasesByDate: vi.fn(),
            fetchSalesByIds: vi.fn(),
            fetchPurchaseById: vi.fn(),
            fetchSalesByTrxIds: vi.fn(),
            fetchSalesByCustomIdWithPurchase: vi.fn(),
            fetchSalesByCustomId: vi.fn(),
            fetchSingleSaleByCustomId: vi.fn(),
            fetchHoldingsBalances: vi.fn(),
            atomicLedgerUpdate: vi.fn(),
            getGrandfatheredRate: vi.fn(),
        } as unknown as LedgerRepository;

        editor = new TransactionEditor(repo);
    });

    it('editPurchaseRate recalculates profits and calls atomicLedgerUpdate', async () => {
        const mockPurchase = {
            trx_id: 'p1',
            date: '2023-01-01',
            rate: 100,
            sale_ids: ['s1'],
            ticker: 'RELIANCE'
        };
        const mockSales = [{
            trx_id: 's1',
            date: '2023-02-01',
            rate: 120,
            sale_qty: 10
        }];

        vi.mocked(repo.fetchPurchaseById).mockResolvedValue(mockPurchase as any);
        vi.mocked(repo.getGrandfatheredRate).mockResolvedValue(null);
        vi.mocked(repo.fetchSalesByTrxIds).mockResolvedValue(mockSales as any);

        await editor.editPurchaseRate('p1', 110);

        expect(repo.atomicLedgerUpdate).toHaveBeenCalledWith(expect.objectContaining({
            purchases_to_update: expect.arrayContaining([expect.objectContaining({ rate: 110 })]),
            sales_to_update: expect.arrayContaining([expect.objectContaining({ profit_stored: 100 })])
        }));
    });

    it('editSaleRate recalculates profits and calls atomicLedgerUpdate', async () => {
        const mockSplits = [{
            trx_id: 's1',
            custom_id: 'SALE-1',
            date: '2023-02-01',
            sale_qty: 10,
            purchases: { rate: 100, date: '2023-01-01', ticker: 'RELIANCE' }
        }];

        vi.mocked(repo.fetchSalesByCustomIdWithPurchase).mockResolvedValue(mockSplits as any);
        vi.mocked(repo.getGrandfatheredRate).mockResolvedValue(null);

        await editor.editSaleRate('SALE-1', 150);

        expect(repo.atomicLedgerUpdate).toHaveBeenCalledWith(expect.objectContaining({
            sales_to_update: expect.arrayContaining([expect.objectContaining({ rate: 150, profit_stored: 500 })])
        }));
    });

    it('editSaleDate triggers FIFO re-processing (Remapping logic)', async () => {
        const mockSplits = [{
            trx_id: 's1',
            custom_id: 'SALE-1',
            date: '2023-02-01',
            sale_qty: 10,
            user_id: 'u1',
            client_name: 'TestClient',
            ticker: 'RELIANCE'
        }];

        vi.mocked(repo.fetchSalesByCustomId).mockResolvedValue(mockSplits as any);
        
        vi.mocked(repo.fetchSalesByDate).mockResolvedValue([]);
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            balance_qty: 10,
            sale_ids: [],
            rate: 100
        }] as any);

        await editor.editSaleDate('SALE-1', '2023-03-01', '2023-02-01', 'TestClient', 'RELIANCE');

        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];

        expect(payload.sales_to_insert).toHaveLength(1);
        expect(payload.sales_to_insert[0].date).toBe('2023-03-01');
        expect(payload.sales_to_insert[0].purchase_trx_id).toBe('p1');
        expect(payload.purchases_to_update[0].balance_qty).toBe(0); 
    });

    it('editPurchaseQty throws error if balance goes negative', async () => {
        vi.mocked(repo.fetchPurchaseById).mockResolvedValue({
            trx_id: 'p1',
            purchase_qty: 100,
            balance_qty: 10
        } as any);
        vi.mocked(repo.fetchHoldingsBalances).mockResolvedValue([{ balance_qty: 10 }] as any); 

        await expect(editor.editPurchaseQty('p1', 80, 'TestClient', 'RELIANCE', '2023-01-01'))
            .rejects.toThrow(/Cannot reduce quantity/);
    });

    it('editPurchaseDate triggers FIFO re-processing and remaps sales correctly', async () => {
        const mockPurchase = {
            trx_id: 'p1',
            date: '2023-01-01',
            purchase_qty: 10,
            balance_qty: 0,
            sale_ids: ['s1'],
            client_id: 'c1'
        };

        const mockOtherPurchase = {
            trx_id: 'p2',
            date: '2023-01-15',
            purchase_qty: 10,
            balance_qty: 10, 
            sale_ids: [],
            client_id: 'c1',
            rate: 120
        };

        const mockSale = {
            trx_id: 's1',
            custom_id: 'SALE-1',
            date: '2023-02-01',
            sale_qty: 10,
            purchase_trx_id: 'p1',
            purchases: { date: '2023-01-01', ticker: 'RELIANCE' },
            rate: 150
        };

        vi.mocked(repo.fetchPurchaseById).mockResolvedValue(mockPurchase as any);
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([mockPurchase, mockOtherPurchase] as any);
        vi.mocked(repo.fetchSalesByIds).mockResolvedValue([mockSale] as any);
        vi.mocked(repo.getGrandfatheredRate).mockResolvedValue(null);

        await editor.editPurchaseDate('p1', '2023-03-01', '2023-01-01', 'TestClient', 'RELIANCE');

        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];

        expect(payload.sales_to_insert).toHaveLength(1);
        expect(payload.sales_to_insert[0].purchase_trx_id).toBe('p2');
        expect(payload.sales_to_insert[0].custom_id).toBe('SALE-1');

        const p2Update = payload.purchases_to_update.find((p: any) => p.trx_id === 'p2');
        expect(p2Update.balance_qty).toBe(0);

        const p1Update = payload.purchases_to_update.find((p: any) => p.trx_id === 'p1');
        expect(p1Update.balance_qty).toBe(10);
    });

    it('editSaleQty triggers FIFO re-processing', async () => {
        const mockExistingSale = {
            custom_id: 'SALE-1',
            date: '2023-02-01',
            rate: 100,
            user_id: 'u1',
            client_id: 'c1',
            comments: '',
            created_at: '2023-02-01T10:00:00Z'
        };

        vi.mocked(repo.fetchSingleSaleByCustomId).mockResolvedValue(mockExistingSale as any);
        vi.mocked(repo.fetchSalesByDate).mockResolvedValue([]);
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            balance_qty: 100,
            sale_ids: [],
            rate: 50
        }] as any);

        await editor.editSaleQty('SALE-1', 20, 'TestClient', 'RELIANCE', '2023-02-01');

        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];

        expect(payload.sales_to_insert).toHaveLength(1);
        expect(payload.sales_to_insert[0].sale_qty).toBe(20);
    });

    it('editPurchaseQty - Decrease Valid updates balance correctly', async () => {
        vi.mocked(repo.fetchPurchaseById).mockResolvedValue({
            trx_id: 'p1',
            purchase_qty: 100,
            balance_qty: 50,
            sale_ids: ['s1']
        } as any);
        vi.mocked(repo.fetchHoldingsBalances).mockResolvedValue([{ balance_qty: 50 }] as any); 
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            purchase_qty: 100,
            balance_qty: 50,
            sale_ids: ['s1'],
            rate: 100
        }] as any);

        await editor.editPurchaseQty('p1', 80, 'TestClient', 'RELIANCE', '2023-01-01');

        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];
        expect(payload.purchases_to_update[0].purchase_qty).toBe(80);
        expect(payload.purchases_to_update[0].balance_qty).toBe(30);
    });

    it('editPurchaseQty - Increase Valid triggers FIFO to consume newly available balance', async () => {
        vi.mocked(repo.fetchPurchaseById).mockResolvedValue({
            trx_id: 'p1',
            purchase_qty: 100,
            balance_qty: 0,
            sale_ids: ['s1']
        } as any);
        vi.mocked(repo.fetchHoldingsBalances).mockResolvedValue([{ balance_qty: 0 }] as any);
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            purchase_qty: 100,
            balance_qty: 0,
            sale_ids: ['s1'],
            rate: 100
        }] as any);
        
        await editor.editPurchaseQty('p1', 120, 'TestClient', 'RELIANCE', '2023-01-01');
        
        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];
        expect(payload.purchases_to_update[0].purchase_qty).toBe(120);
        expect(payload.purchases_to_update[0].balance_qty).toBe(20);
    });

    it('editSaleQty - Decrease Valid restores balance to purchase lots', async () => {
        const mockExistingSale = {
            custom_id: 'SALE-1',
            date: '2023-02-01',
            rate: 100,
            user_id: 'u1',
            client_id: 'c1',
            comments: '',
            created_at: '2023-02-01T10:00:00Z',
            sale_qty: 20
        };

        vi.mocked(repo.fetchSingleSaleByCustomId).mockResolvedValue(mockExistingSale as any);
        vi.mocked(repo.fetchSalesByDate).mockResolvedValue([{
             trx_id: 's1',
             custom_id: 'SALE-1',
             date: '2023-02-01',
             sale_qty: 20,
             user_id: 'u1',
             purchase_trx_id: 'p1',
             client_name: 'TestClient',
             purchases: { date: '2023-01-01', ticker: 'RELIANCE', created_at: '2023-01-01' }
        }] as any);
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            balance_qty: 0,
            sale_ids: ['s1'],
            rate: 50
        }] as any);
        
        await editor.editSaleQty('SALE-1', 10, 'TestClient', 'RELIANCE', '2023-02-01');

        expect(repo.atomicLedgerUpdate).toHaveBeenCalled();
        const payload = vi.mocked(repo.atomicLedgerUpdate).mock.calls[0][0];

        expect(payload.sales_to_insert).toHaveLength(1);
        expect(payload.sales_to_insert[0].sale_qty).toBe(10);
        
        // Originally balance was 0, we returned 20 from unlink, then took 10 -> remaining 10
        expect(payload.purchases_to_update[0].balance_qty).toBe(10);
    });

    it('editSaleQty - Constraint Failure throws error if not enough global purchase balance', async () => {
        const mockExistingSale = {
            custom_id: 'SALE-1',
            date: '2023-02-01',
            rate: 100,
            user_id: 'u1',
            client_id: 'c1',
            sale_qty: 10
        };

        vi.mocked(repo.fetchSingleSaleByCustomId).mockResolvedValue(mockExistingSale as any);
        vi.mocked(repo.fetchSalesByDate).mockResolvedValue([{
            trx_id: 's1',
            custom_id: 'SALE-1',
            date: '2023-02-01',
            sale_qty: 10,
            user_id: 'u1',
            client_id: 'c1',
            purchase_trx_id: 'p1',
            client_name: 'TestClient',
            purchases: { date: '2023-01-01', ticker: 'RELIANCE', created_at: '2023-01-01' }
        }] as any);
        
        // we only have 5 balance available + 10 restored = 15 total capacity.
        vi.mocked(repo.fetchPurchasesByDate).mockResolvedValue([{
            trx_id: 'p1',
            date: '2023-01-01',
            balance_qty: 5,
            sale_ids: ['s1'],
            rate: 50
        }] as any);

        await expect(editor.editSaleQty('SALE-1', 50, 'TestClient', 'RELIANCE', '2023-02-01'))
            .rejects.toThrow(/Insufficient balance/);
    });
});
