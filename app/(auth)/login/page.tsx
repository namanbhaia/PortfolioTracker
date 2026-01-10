"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, User, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

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
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .ilike('username', username.trim())
                .maybeSingle();

            if (profileError || !profile) {
                throw new Error("Invalid username or password.");
            }

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password,
            });

            if (authError) throw authError;

            router.push('/dashboard/holdings');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />

            <div className="max-w-md w-full relative group">
                {/* Subtle Glow behind the card */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

                <div className="relative bg-[#11141b]/80 backdrop-blur-xl border border-white/5 p-10 rounded-3xl shadow-2xl">

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="text-white" size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter italic">WEALTH<span className="text-indigo-500">TRACK</span></h2>
                        <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Family Asset Terminal</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="group relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all outline-none text-sm"
                                    placeholder="Identity ID"
                                />
                            </div>

                            <div className="group relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all outline-none text-sm"
                                    placeholder="Security Key"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black hover:bg-indigo-50 text-sm font-black rounded-2xl transition-all shadow-xl shadow-white/5 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    Enter Dashboard
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-sm text-slate-500">
                            New identity?{' '}
                            <Link href="/signup" className="text-white font-bold hover:text-indigo-400 transition-colors">
                                Initialize Portfolio
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Technical Footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[10px] text-slate-700 uppercase tracking-[0.3em] font-black">
                    Quantum-Grade Encryption &bull; Node-01-SEC
                </p>
            </div>
        </div>
    );
}