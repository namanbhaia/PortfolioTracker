import { describe, it, expect, vi } from 'vitest';
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
    });

    describe('isSquareOff', () => {
        it('should return true if dates are the same', () => {
            const date = '2023-01-01';
            expect(isSquareOff(date, date)).toBe(true);
        });

        it('should return false if dates are different', () => {
            expect(isSquareOff('2023-01-01', '2023-01-02')).toBe(false);
        });
    });

    describe('calculateProfitMetrics', () => {
        it('should calculate standard profit correctly', () => {
            const result = calculateProfitMetrics(100, '2023-01-01', 150, null, 10);
            expect(result.profit).toBe(500);
            expect(result.adjusted_profit).toBe(500);
        });

        it('should apply Section 112A Baseline FMV Grandfathering logic correctly (purchase before 2018-02-01)', () => {
            // Case: bought at 100, cutoff is 150, sold at 200
            // Adjusted profit should be (200 - 150) * 10 = 500 since sale > cutoff
            const result = calculateProfitMetrics(100, '2017-01-01', 200, 150, 10);
            expect(result.profit).toBe(1000);
            expect(result.adjusted_profit).toBe(500);
        });

        it('should apply Section 112A Baseline FMV Grandfathering logic correctly (sale between purchase and cutoff)', () => {
            // Case: bought at 100, cutoff is 150, sold at 130
            // Adjusted profit should be 0 because sale > purchase AND sale < cutoff
            const result = calculateProfitMetrics(100, '2017-01-01', 130, 150, 10);
            expect(result.profit).toBe(300);
            expect(result.adjusted_profit).toBe(0);
        });

        it('should not apply Section 112A Baseline FMV Grandfathering if purchased after 2018-02-01', () => {
            // Even if cutoff is provided, it should ignore it
            const result = calculateProfitMetrics(100, '2019-01-01', 130, 150, 10);
            expect(result.profit).toBe(300);
            expect(result.adjusted_profit).toBe(300);
        });
    });
});
