"use server"

import { revalidatePath } from 'next/cache';

/**
 * @file cache-revalidate.ts
 * @description Helpers for manually triggering Next.js path revalidation.
 */

/**
 * Revalidates the dashboard layout specifically.
 * @returns {Promise<void>}
 */
export async function revalidateDashboard() {
    revalidatePath('/dashboard', 'layout');
}
