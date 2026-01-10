"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            // 1. Resolve email from username (since Supabase Auth uses email)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', username)
                .maybeSingle();

            if (profileError) {
                throw new Error("Database connection error. Please try again.");
                console.log("Supabase Lookup Error:", profileError.message);
                //throw profileError;
            }
            if (!profile) {
                throw new Error("Username not found. Please sign up first.");
                console.log("Supabase Auth Error: ", profileError.message);
            }

            // 2. Sign in with the resolved email
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password,
            });

            if (authError) throw authError;

            // 3. Success - redirect to home dashboard
            router.push('/dashboard/holdings');
            router.refresh();

        } catch (err) {
            // Robust error handling to satisfy the parser
            const message = err instanceof Error ? err.message : "Authentication failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">

                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">WealthTrack</h2>
                    <p className="mt-2 text-sm text-slate-500 font-medium">Family Wealth Management Console</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                name="username"
                                type="text"
                                required
                                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                                placeholder="Username"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                name="password"
                                type="password"
                                required
                                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Access Dashboard"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                        New to WealthTrack?{' '}
                        <Link
                            href="/signup"
                            className="text-indigo-600 font-black hover:text-indigo-700 transition-colors"
                        >
                            Initialize Portfolio
                        </Link>
                    </p>
                </div>

                <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Encrypted Session &bull; 2026 Enterprise Security
                </p>
            </div>
        </div>
    );
}