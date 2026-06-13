import { describe, it, expect } from 'vitest';
import { getTechnicalSuggestions } from './technical_suggestions';

describe('getTechnicalSuggestions', () => {
    it('should identify assets near or above 52-week high', async () => {
        const holdings = [
            {
                ticker: 'RELIANCE',
                stock_name: 'Reliance Industries',
                balance_qty: 10,
                current_price: 2500,
                fifty_two_week_high: 2510,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.aboveHigh).toHaveLength(1);
        expect(result.aboveHigh[0].ticker).toBe('RELIANCE');
        expect(result.aboveHigh[0].type).toBe('Near/Above Yearly High');
    });

    it('should identify assets near or below 52-week low', async () => {
        const holdings = [
            {
                ticker: 'INFY',
                stock_name: 'Infosys',
                balance_qty: 10,
                current_price: 1400,
                fifty_two_week_low: 1395,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.belowLow).toHaveLength(1);
        expect(result.belowLow[0].ticker).toBe('INFY');
    });

    it('should identify high relative volume', async () => {
        const holdings = [
            {
                ticker: 'TCS',
                stock_name: 'TCS',
                balance_qty: 10,
                current_price: 3500,
                market_volume: 2000000,
                avg_volume: 1000000,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.highVolume).toHaveLength(1);
        expect(result.highVolume[0].value).toBe('2.0x Avg');
    });

    it('should identify low relative volume', async () => {
        const holdings = [
            {
                ticker: 'HDFC',
                stock_name: 'HDFC Bank',
                balance_qty: 10,
                current_price: 1600,
                market_volume: 100000,
                avg_volume: 500000,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.lowVolume).toHaveLength(1);
        expect(result.lowVolume[0].value).toBe('0.20x Avg');
    });

    it('should identify high P/E ratio', async () => {
        const holdings = [
            {
                ticker: 'ZOMATO',
                stock_name: 'Zomato',
                balance_qty: 10,
                current_price: 150,
                trailing_pe: 100,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.highPE).toHaveLength(1);
        expect(result.highPE[0].value).toBe('P/E: 100.0');
    });

    it('should identify low P/E ratio', async () => {
        const holdings = [
            {
                ticker: 'COALINDIA',
                stock_name: 'Coal India',
                balance_qty: 10,
                current_price: 400,
                trailing_pe: 8,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.lowPE).toHaveLength(1);
        expect(result.lowPE[0].value).toBe('P/E: 8.0');
    });

    it('should filter out holdings with zero balance', async () => {
        const holdings = [
            {
                ticker: 'SOLD',
                balance_qty: 0,
                current_price: 100,
                fifty_two_week_high: 101,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.aboveHigh).toHaveLength(0);
    });

    it('should deduplicate holdings by ticker', async () => {
        const holdings = [
            { ticker: 'DUPE', balance_qty: 10, current_price: 200, fifty_two_week_high: 201 },
            { ticker: 'DUPE', balance_qty: 5, current_price: 200, fifty_two_week_high: 201 },
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.aboveHigh).toHaveLength(1);
    });

    it('should handle missing data gracefully', async () => {
        const holdings = [
            {
                ticker: 'MISSING',
                balance_qty: 10,
                current_price: null,
            }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.aboveHigh).toHaveLength(0);
        expect(result.belowLow).toHaveLength(0);
        expect(result.highVolume).toHaveLength(0);
        expect(result.lowVolume).toHaveLength(0);
        expect(result.highPE).toHaveLength(0);
        expect(result.lowPE).toHaveLength(0);
    });
});
