"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, Loader2, ArrowLeft, Briefcase, Hash } from 'lucide-react';

export default function SignUpPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const username = formData.get('username') as string;
        const clientName = formData.get('clientName') as string;
        const tradingId = formData.get('tradingId') as string;

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.toLowerCase().trim(),
                        full_name: clientName, // Initial name for the profile
                        primary_client_name: clientName, // For the Clients table
                        trading_id: tradingId // For the Clients table
                    }
                }
            });

            if (authError) throw authError;

            if (data.user) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 2500);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4 bg-white p-10 rounded-3xl shadow-xl">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 italic font-black text-2xl">✓</div>
                    <h2 className="text-2xl font-black text-slate-900">Portfolio Ready!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">Account and primary client created. <br />Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">

                <div>
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-6 uppercase tracking-tighter">
                        <ArrowLeft size={14} /> Back to Entry
                    </Link>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
                    <p className="mt-2 text-sm text-slate-500 font-medium">Set up your profile and primary trading account.</p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSignUp}>
                    {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-xs font-bold border border-rose-100">{error}</div>}

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Auth Credentials</p>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input name="username" type="text" required className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Username (for login)" />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input name="email" type="email" required className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Email Address" />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input name="password" type="password" required minLength={6} className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Security Password" />
                        </div>

                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 pt-4">Primary Client Details</p>

                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input name="clientName" type="text" required className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Client Name (e.g. Personal A/C)" />
                        </div>

                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input name="tradingId" type="text" required className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Trading ID (e.g. TRD-001)" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Initialize Portfolio"}
                    </button>
                </form>
            </div>
        </div>
    );
}