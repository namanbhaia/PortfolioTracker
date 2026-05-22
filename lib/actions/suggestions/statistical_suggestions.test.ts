import { describe, it, expect } from 'vitest';
import { getStatisticalSuggestions } from './statistical_suggestions';

describe('statistical_suggestions', () => {
    it('should return empty results for empty inputs', async () => {
        const result = await getStatisticalSuggestions([], []);
        expect(result.concentration).toEqual([]);
        expect(result.volatility).toEqual([]);
        expect(result.pledgedVolatility).toEqual([]);
    });

    it('should correctly identify concentration risks (>20% weight)', async () => {
        const holdings = [
            {
                ticker: 'RELIANCE',
                stock_name: 'Reliance Industries',
                balance_qty: 10,
                market_value: 25000,
                beta: 1.1
            },
            {
                ticker: 'TCS',
                stock_name: 'Tata Consultancy Services',
                balance_qty: 1,
                market_value: 3000,
                beta: 0.8
            },
            {
                ticker: 'INFY',
                stock_name: 'Infosys Ltd',
                balance_qty: 1,
                market_value: 2000,
                beta: 0.9
            }
        ];
        // Total value = 30000. RELIANCE is 25000 / 30000 = 83.3% (> 20%). Other stocks are < 20%.
        const result = await getStatisticalSuggestions(holdings);
        expect(result.concentration.length).toBe(1);
        expect(result.concentration[0].ticker).toBe('RELIANCE');
        expect(result.concentration[0].percentage).toBeCloseTo(83.33, 1);
        expect(result.concentration[0].warning).toContain('High Concentration Risk');
    });

    it('should correctly classify high beta (>1.5) and low beta (<0.5) volatility alerts', async () => {
        const holdings = [
            {
                ticker: 'TATAMOTORS',
                stock_name: 'Tata Motors',
                balance_qty: 10,
                market_value: 10000,
                beta: 1.8
            },
            {
                ticker: 'HINDUNILVR',
                stock_name: 'Hindustan Unilever',
                balance_qty: 10,
                market_value: 10000,
                beta: 0.4
            },
            {
                ticker: 'ITC',
                stock_name: 'ITC Ltd',
                balance_qty: 10,
                market_value: 10000,
                beta: 1.0 // typical volatility, should not alert
            }
        ];

        const result = await getStatisticalSuggestions(holdings);
        
        // TATAMOTORS (1.8 > 1.5) should be in volatility
        const motorAlert = result.volatility.find(v => v.ticker === 'TATAMOTORS');
        expect(motorAlert).toBeDefined();
        expect(motorAlert?.warning).toContain('High Volatility');

        // HINDUNILVR (0.4 < 0.5) should be in volatility
        const hulAlert = result.volatility.find(v => v.ticker === 'HINDUNILVR');
        expect(hulAlert).toBeDefined();
        expect(hulAlert?.warning).toContain('Low Volatility');

        // ITC (1.0) should not be in volatility
        const itcAlert = result.volatility.find(v => v.ticker === 'ITC');
        expect(itcAlert).toBeUndefined();
    });

    it('should trigger pledged volatility warnings only when stock has pledges and beta > 1.5', async () => {
        const holdings = [
            {
                ticker: 'TATAMOTORS',
                stock_name: 'Tata Motors',
                balance_qty: 10,
                market_value: 10000,
                beta: 1.8
            },
            {
                ticker: 'INFY',
                stock_name: 'Infosys',
                balance_qty: 10,
                market_value: 10000,
                beta: 0.9
            }
        ];

        const pledges = [
            {
                ticker: 'TATAMOTORS',
                client_name: 'Client A',
                pledged_qty: 100
            },
            {
                ticker: 'INFY',
                client_name: 'Client A',
                pledged_qty: 50
            }
        ];

        const result = await getStatisticalSuggestions(holdings, pledges);

        // TATAMOTORS has pledged shares (100) and beta 1.8 (>1.5) -> should trigger warning
        expect(result.pledgedVolatility.length).toBe(1);
        expect(result.pledgedVolatility[0].ticker).toBe('TATAMOTORS');
        expect(result.pledgedVolatility[0].pledged_qty).toBe(100);
        expect(result.pledgedVolatility[0].beta).toBe(1.8);
        expect(result.pledgedVolatility[0].warning).toContain('High-Risk Pledge');

        // INFY has pledged shares but beta is 0.9 (<=1.5) -> should NOT trigger warning
    });
});
