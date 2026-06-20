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

    it('should filter out holdings with negative balance quantity', async () => {
        const holdings = [
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: -5, current_price: 3000, fifty_two_week_high: 2000 },
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 1500, fifty_two_week_high: 2000 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        // TCS with negative balance should be filtered; INFY with 1500 < 0.99*2000=1980 should not trigger aboveHigh
        const tickers = result.aboveHigh.map(h => h.ticker);
        expect(tickers).not.toContain('TCS');
    });

    it('should detect P/E = 51 as high (boundary above threshold of 50)', async () => {
        const holdings = [
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 1000, trailing_pe: 51 },
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 1000, trailing_pe: 50 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.highPE).toHaveLength(1);
        expect(result.highPE[0].ticker).toBe('TCS');
        expect(result.highPE[0].value).toBe('P/E: 51.0');
    });

    it('should exclude negative P/E from low P/E signals (value opportunities only)', async () => {
        const holdings = [
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 1000, trailing_pe: 12 },
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 1000, trailing_pe: -5 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        // Only TCS (pe=12, between 0 and 15) should appear; INFY (pe=-5, negative) should be excluded
        expect(result.lowPE).toHaveLength(1);
        expect(result.lowPE[0].ticker).toBe('TCS');
        expect(result.lowPE[0].value).toBe('P/E: 12.0');
    });

    it('should detect 52W high at exactly the 99% threshold (price = 0.99 * high)', async () => {
        const holdings = [
            // price = 0.99 * 3500 = 3465 => exactly at threshold, should be flagged
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 3465, fifty_two_week_high: 3500 },
            // price = 3400 < 0.99 * 3500 = 3465, should NOT be flagged
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 3400, fifty_two_week_high: 3500 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.aboveHigh).toHaveLength(1);
        expect(result.aboveHigh[0].ticker).toBe('TCS');
        expect(result.aboveHigh[0].value).toBe('52W High: 3500.00');
    });

    it('should detect 52W low at exactly the 101% threshold (price = 1.01 * low)', async () => {
        const holdings = [
            // price = 1.01 * 1000 = 1010 => exactly at threshold, should be flagged
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 1010, fifty_two_week_low: 1000 },
            // price = 1050 > 1.01 * 1000 = 1010, should NOT be flagged
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 1050, fifty_two_week_low: 1000 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.belowLow).toHaveLength(1);
        expect(result.belowLow[0].ticker).toBe('TCS');
    });

    it('should flag high volume at exactly 1.5x threshold (volume = 1.51 * avg)', async () => {
        const holdings = [
            // 151 > 1.5 * 100 = 150 => should be flagged
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 1000, market_volume: 151, avg_volume: 100 },
            // 150 = 1.5 * 100, not strictly greater => should NOT be flagged
            { ticker: 'INFY', stock_name: 'Infosys', balance_qty: 10, current_price: 1000, market_volume: 140, avg_volume: 100 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.highVolume).toHaveLength(1);
        expect(result.highVolume[0].ticker).toBe('TCS');
        expect(result.highVolume[0].value).toBe('1.5x Avg');
    });

    it('should flag low volume at exactly 0.4x threshold (volume = 0.39 * avg)', async () => {
        const holdings = [
            // 39 < 0.4 * 100 = 40 => should be flagged
            { ticker: 'TCS', stock_name: 'TCS', balance_qty: 10, current_price: 1000, market_volume: 39, avg_volume: 100 }
        ];
        const result = await getTechnicalSuggestions(holdings);
        expect(result.lowVolume).toHaveLength(1);
        expect(result.lowVolume[0].ticker).toBe('TCS');
        expect(result.lowVolume[0].value).toBe('0.39x Avg');
    });
});
