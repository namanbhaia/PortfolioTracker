"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // Your Supabase browser client

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [showPassword, setShowPassword] = useState(false);
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
            // 1. Fetch the user's associated email using the username from your 'profiles' table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', username)
                .single();

            if (profileError || !profile) {
                throw new Error("Invalid username or password.");
            }

            // 2. Perform the actual Sign In using the retrieved email
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password,
            });

            if (authError) throw authError;

            // 3. Success! Redirect to the holdings dashboard
            router.push('/dashboard/holdings');
            router.refresh();

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-2xl mb-4 shadow-lg">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Wealth Manager</h1>
                    <p className="text-slate-500 text-sm mt-2">Enter your credentials to access managed accounts.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 font-medium">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    placeholder="e.g. admin_manager"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center shadow-md"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}