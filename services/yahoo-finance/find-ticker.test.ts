import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSearch = vi.hoisted(() => vi.fn());
const mockQuote = vi.hoisted(() => vi.fn());

vi.mock('yahoo-finance2', () => {
    return {
        default: vi.fn().mockImplementation(function() {
            return {
                search: mockSearch,
                quote: mockQuote
            };
        })
    };
});

import { getTickerDetailsFromYahoo, getStockSuggestion } from './find-ticker';

describe('Yahoo Finance Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTickerDetailsFromYahoo', () => {
        it('should fetch prices for a list of ISINs', async () => {
            mockSearch.mockResolvedValueOnce({ quotes: [{ symbol: 'RELIANCE.NS' }] });
            mockQuote.mockResolvedValueOnce({ symbol: 'RELIANCE.NS', regularMarketPrice: 2500 });

            const result = await getTickerDetailsFromYahoo(['INE002A01018']);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                isin: 'INE002A01018',
                symbol: 'RELIANCE.NS',
                price: 2500
            });
        });

        it('should handle search returning no results', async () => {
            mockSearch.mockResolvedValueOnce({ quotes: [] });
            const result = await getTickerDetailsFromYahoo(['INVALID_ISIN']);
            expect(result).toHaveLength(0);
        });
    });

    describe('getStockSuggestion', () => {
        it('should return suggestion for a valid ticker', async () => {
            mockQuote.mockResolvedValueOnce({
                shortName: 'Reliance Industries',
                regularMarketPrice: 2500
            });

            const result = await getStockSuggestion('RELIANCE');
            expect(result.success).toBe(true);
            expect(result.suggestion).toEqual({
                ticker: 'RELIANCE',
                name: 'Reliance Industries',
                price: 2500
            });
        });

        it('should return success: false if stock not found', async () => {
            mockQuote.mockResolvedValueOnce(null);
            const result = await getStockSuggestion('INVALID');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Stock not found');
        });
    });
});
