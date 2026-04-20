import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './price-alerts';

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

import { createClient } from '@/lib/supabase/server';

describe('Price Alerts Actions', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockQueryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis()
        };

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
            },
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        };

        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    it('getAlerts should throw if user is unauthenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
        await expect(actions.getAlerts()).rejects.toThrow("Unauthorized");
    });

    it('getAlerts should fetch alerts for the current user', async () => {
        const mockData = [{ id: '1', ticker: 'RELIANCE' }];
        // Make the query builder resolve with our data
        mockQueryBuilder.then = vi.fn((resolve) => resolve({ data: mockData, error: null }));

        const result = await actions.getAlerts();

        expect(mockSupabase.from).toHaveBeenCalledWith('price_alerts');
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
        expect(result).toEqual(mockData);
    });

    it('createAlert should insert a new alert with correct payload', async () => {
        const payload: any = { ticker: 'TCS', condition: 'greater_than', target_type: 'manual', target_value: 100, is_one_time: true };
        const mockReturn = { id: 'new-id', ...payload };
        
        mockQueryBuilder.then = vi.fn((resolve) => resolve({ data: mockReturn, error: null }));

        const result = await actions.createAlert(payload);

        expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'test-user-id',
            ticker: 'TCS'
        }));
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockReturn);
    });

    it('snoozeAlert should calculate and set snoozed_until appropriately', async () => {
        vi.useFakeTimers();
        const now = new Date('2024-01-01T12:00:00Z');
        vi.setSystemTime(now);

        mockQueryBuilder.then = vi.fn((resolve) => resolve({ data: [{ id: 'alert-1' }], error: null }));

        await actions.snoozeAlert('alert-1', 2);

        const expectedTime = new Date('2024-01-01T14:00:00Z').toISOString();

        expect(mockQueryBuilder.update).toHaveBeenCalledWith({
            snoozed_until: expectedTime,
            is_triggered: false
        });
        
        vi.useRealTimers();
    });

    it('deleteAlert should delete using both id and user_id', async () => {
        mockQueryBuilder.then = vi.fn((resolve) => resolve({ error: null }));

        await actions.deleteAlert('alert-1');

        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'alert-1');
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('markAlertAsRead should set is_triggered to false', async () => {
        mockQueryBuilder.then = vi.fn((resolve) => resolve({ data: [{ id: 'alert-2' }], error: null }));

        await actions.markAlertAsRead('alert-2');

        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_triggered: false });
    });
});
