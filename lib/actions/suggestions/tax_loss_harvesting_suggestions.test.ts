import { describe, it, expect } from 'vitest';
import { getTaxLossHarvestingSuggestions } from './tax_loss_harvesting_suggestions';

describe('tax_loss_harvesting_suggestions', () => {
    it('should return empty results for empty holdings', async () => {
        const result = await getTaxLossHarvestingSuggestions([]);
        expect(result.shortTerm).toEqual([]);
        expect(result.longTerm).toEqual([]);
        expect(result.totalLossVal).toBe(0);
        expect(result.longTermGains).toEqual([]);
        expect(result.totalGainVal).toBe(0);
    });

    it('should filter out holdings with zero or negative balance_qty', async () => {
        const holdings = [
            {
                ticker: 'RELIANCE',
                stock_name: 'Reliance Industries',
                balance_qty: 0,
                pl: -500,
                pl_percent: -10,
                long_term: false,
                date: '2023-01-01',
                trx_id: 't1'
            }
        ];
        const result = await getTaxLossHarvestingSuggestions(holdings);
        expect(result.shortTerm).toEqual([]);
        expect(result.totalLossVal).toBe(0);
    });

    it('should correctly identify and split short-term and long-term tax loss harvesting opportunities', async () => {
        const holdings = [
            {
                ticker: 'INFY',
                stock_name: 'Infosys',
                balance_qty: 10,
                pl: -1500,
                pl_percent: -8.5,
                long_term: false,
                date: '2025-06-01',
                trx_id: 't1'
            },
            {
                ticker: 'TCS',
                stock_name: 'Tata Consultancy Services',
                balance_qty: 5,
                pl: -3000,
                pl_percent: -15,
                long_term: true,
                date: '2024-01-01',
                trx_id: 't2'
            }
        ];

        const result = await getTaxLossHarvestingSuggestions(holdings);
        expect(result.shortTerm.length).toBe(1);
        expect(result.shortTerm[0].ticker).toBe('INFY');
        expect(result.shortTerm[0].loss_amount).toBe(1500);
        expect(result.shortTerm[0].is_long_term).toBe(false);

        expect(result.longTerm.length).toBe(1);
        expect(result.longTerm[0].ticker).toBe('TCS');
        expect(result.longTerm[0].loss_amount).toBe(3000);
        expect(result.longTerm[0].is_long_term).toBe(true);

        expect(result.totalLossVal).toBe(4500);
        expect(result.longTermGains).toEqual([]);
        expect(result.totalGainVal).toBe(0);
    });

    it('should correctly suggest tax gain harvesting for long-term profitable oldest lots', async () => {
        const holdings = [
            {
                ticker: 'HDFCBANK',
                stock_name: 'HDFC Bank Ltd',
                balance_qty: 20,
                pl: 12000,
                pl_percent: 25,
                long_term: true,
                date: '2023-05-01',
                trx_id: 't3'
            },
            {
                ticker: 'SBIN',
                stock_name: 'State Bank of India',
                balance_qty: 50,
                pl: 5000,
                pl_percent: 15,
                long_term: false, // Short term profitable oldest lot -> should NOT be in longTermGains
                date: '2025-02-01',
                trx_id: 't4'
            }
        ];

        const result = await getTaxLossHarvestingSuggestions(holdings);
        expect(result.shortTerm).toEqual([]);
        expect(result.longTerm).toEqual([]);
        expect(result.totalLossVal).toBe(0);

        expect(result.longTermGains.length).toBe(1);
        expect(result.longTermGains[0].ticker).toBe('HDFCBANK');
        expect(result.longTermGains[0].gain_amount).toBe(12000);
        expect(result.totalGainVal).toBe(12000);
    });

    it('should respect FIFO order and evaluate the oldest lot first', async () => {
        // Under FIFO, we sort by date. 
        // If we have two lots for INFY:
        // Lot A (oldest, date '2023-01-01'): pl = -1000 (loss)
        // Lot B (newer, date '2023-06-01'): pl = +2000 (gain)
        // Only Lot A (the oldest) should be suggested since it is at the head of the queue.
        const holdings = [
            {
                ticker: 'INFY',
                stock_name: 'Infosys',
                balance_qty: 10,
                pl: 2000,
                pl_percent: 10,
                long_term: true,
                date: '2023-06-01',
                trx_id: 't_new'
            },
            {
                ticker: 'INFY',
                stock_name: 'Infosys',
                balance_qty: 5,
                pl: -1000,
                pl_percent: -5,
                long_term: true,
                date: '2023-01-01',
                trx_id: 't_old'
            }
        ];

        const result = await getTaxLossHarvestingSuggestions(holdings);
        
        // Since the oldest lot (t_old) has a loss, it should be recommended in longTerm losses.
        // The newer lot (t_new) is ignored.
        expect(result.longTerm.length).toBe(1);
        expect(result.longTerm[0].trx_id).toBe('t_old');
        expect(result.longTerm[0].loss_amount).toBe(1000);
        expect(result.longTermGains).toEqual([]);
    });
});
