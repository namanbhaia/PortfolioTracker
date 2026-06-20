import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './sync-assets';

// Mock Next.js Cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

// Mock standard Supabase JS client
vi.mock('@supabase/supabase-js', () => {
    const mockFunctions = {
        invoke: vi.fn()
    };
    const mockSupabase = {
        functions: mockFunctions
    };
    return {
        createClient: vi.fn().mockReturnValue(mockSupabase)
    };
});

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

describe('Sync Assets Actions', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = vi.mocked(createClient)();
    });

    it('should successfully trigger the sync-assets-sheet Edge Function and revalidate cache', async () => {
        mockSupabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });

        const result = await actions.syncAssetsAction();

        expect(createClient).toHaveBeenCalled();
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('sync-assets-sheet', {
            body: { name: 'Functions' }
        });
        expect(revalidatePath).toHaveBeenCalledWith('/');
        expect(result).toEqual({
            success: true,
            message: 'Successfully triggered sheet sync.'
        });
    });

    it('should catch and return errors if the Edge Function invocation fails', async () => {
        const mockError = { message: 'Invocation timed out' };
        mockSupabase.functions.invoke.mockResolvedValue({ data: null, error: mockError });

        const result = await actions.syncAssetsAction();

        expect(mockSupabase.functions.invoke).toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(result).toEqual({
            success: false,
            error: 'Invocation timed out'
        });
    });

    it('should catch and return errors if an unexpected exception is thrown', async () => {
        mockSupabase.functions.invoke.mockRejectedValue(new Error('Network failure'));

        const result = await actions.syncAssetsAction();

        expect(result).toEqual({
            success: false,
            error: 'Network failure'
        });
    });
});
