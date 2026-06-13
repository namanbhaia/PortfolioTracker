import { describe, it, expect } from 'vitest';
import { calculateProfitMetrics, isLongTerm, isSquareOff, getTodayDate } from './utility';

describe('Utility Functions', () => {
    describe('getTodayDate', () => {
        it('should return a date in YYYY-MM-DD format', () => {
            const today = getTodayDate();
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('isLongTerm', () => {
        it('should return true if diff is more than 365 days', () => {
            const purchaseDate = '2023-01-01';
            const saleDate = '2024-01-02';
            expect(isLongTerm(purchaseDate, saleDate)).toBe(true);
        });

        it('should return false if diff is exactly 365 days', () => {
            const purchaseDate = '2023-01-01';
            const saleDate = '2024-01-01';
            expect(isLongTerm(purchaseDate, saleDate)).toBe(false);
        });

        it('should return false if diff is less than 365 days', () => {
            const purchaseDate = '2023-01-01';
            const saleDate = '2023-06-01';
            expect(isLongTerm(purchaseDate, saleDate)).toBe(false);
        });

        it('should handle leap years correctly', () => {
            // 2024 is a leap year. Feb 29 exists.
            const purchaseDate = '2024-01-01';
            const saleDate = '2024-12-31'; // Exactly 365 days in a leap year is still Dec 31
            expect(isLongTerm(purchaseDate, saleDate)).toBe(false);

            const saleDateLT = '2025-01-01'; // 366 days
            expect(isLongTerm(purchaseDate, saleDateLT)).toBe(true);
        });
    });

    describe('isSquareOff', () => {
        it('should return true if dates are the same', () => {
            const date = '2023-01-01';
            expect(isSquareOff(date, date)).toBe(true);
        });

        it('should return false if dates are different', () => {
            expect(isSquareOff('2023-01-01', '2023-01-02')).toBe(false);
        });

        it('should handle ISO string date formats', () => {
            expect(isSquareOff('2023-01-01T10:00:00Z', '2023-01-01T18:00:00Z')).toBe(true);
        });
    });

    describe('calculateProfitMetrics', () => {
        it('should calculate standard profit correctly', () => {
            const result = calculateProfitMetrics(100, '2023-01-01', 150, null, 10);
            expect(result.profit).toBe(500);
            expect(result.adjusted_profit).toBe(500);
        });

        it('should apply grandfathering logic correctly (purchase before 2018-02-01)', () => {
            // Case: bought at 100, cutoff is 150, sold at 200
            // Adjusted profit should be (200 - 150) * 10 = 500 since sale > cutoff
            const result = calculateProfitMetrics(100, '2017-01-01', 200, 150, 10);
            expect(result.profit).toBe(1000);
            expect(result.adjusted_profit).toBe(500);
        });

        it('should apply grandfathering logic correctly (sale between purchase and cutoff)', () => {
            // Case: bought at 100, cutoff is 150, sold at 130
            // Cost basis = Max(100, Min(130, 150)) = Max(100, 130) = 130
            // Adjusted profit should be (130 - 130) * 10 = 0
            const result = calculateProfitMetrics(100, '2017-01-01', 130, 150, 10);
            expect(result.profit).toBe(300);
            expect(result.adjusted_profit).toBe(0);
        });

        it('should handle loss with grandfathering correctly', () => {
            // Case: bought at 200, cutoff is 150, sold at 100
            // Cost basis = Max(200, Min(100, 150)) = Max(200, 100) = 200
            // Adjusted profit = (100 - 200) * 10 = -1000
            const result = calculateProfitMetrics(200, '2017-01-01', 100, 150, 10);
            expect(result.profit).toBe(-1000);
            expect(result.adjusted_profit).toBe(-1000);
        });

        it('should not apply grandfathering if purchased after 2018-02-01', () => {
            // Even if cutoff is provided, it should ignore it
            const result = calculateProfitMetrics(100, '2019-01-01', 130, 150, 10);
            expect(result.profit).toBe(300);
            expect(result.adjusted_profit).toBe(300);
        });

        it('should handle zero quantity', () => {
            const result = calculateProfitMetrics(100, '2023-01-01', 150, null, 0);
            expect(result.profit).toBe(0);
            expect(result.adjusted_profit).toBe(0);
        });
    });
});
