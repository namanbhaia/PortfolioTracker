import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './update-profile-preferences';

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
import { revalidatePath } from 'next/cache';

describe('Update Profile Preferences Actions', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQueryBuilder = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        };
        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-uuid' } } })
            },
            from: vi.fn().mockReturnValue(mockQueryBuilder)
        };
        vi.mocked(createClient).mockResolvedValue(mockSupabase);
    });

    it('should throw an error if the user is unauthenticated', async () => {
        // Setup mock session to return no user
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        await expect(actions.updateProfilePreferences({ theme_preference: 'dark' }))
            .rejects
            .toThrow('Unauthorized');

        expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should successfully update profile preferences and trigger cache revalidation', async () => {
        const payload = {
            screensaver_click_only: true,
            auto_fold_sidebar: false,
            theme_preference: 'system'
        };

        const result = await actions.updateProfilePreferences(payload);

        // Check database routing
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        expect(mockQueryBuilder.update).toHaveBeenCalledWith(payload);
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-user-uuid');

        // Check path revalidation
        expect(revalidatePath).toHaveBeenCalledWith('/dashboard/profile');

        // Check success response
        expect(result).toEqual({ success: true });
    });

    it('should successfully update a single preference field', async () => {
        const result = await actions.updateProfilePreferences({ theme_preference: 'dark' });

        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        expect(mockQueryBuilder.update).toHaveBeenCalledWith({ theme_preference: 'dark' });
        expect(result).toEqual({ success: true });
    });

    it('should throw error if Supabase update fails', async () => {
        mockQueryBuilder.eq.mockResolvedValue({ error: { message: 'DB update failed' } });

        await expect(actions.updateProfilePreferences({ theme_preference: 'light' }))
            .rejects
            .toMatchObject({ message: 'DB update failed' });
    });
});
