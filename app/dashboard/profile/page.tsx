"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Check, Pencil, Loader2 } from 'lucide-react';
import { updateProfileName } from '@/app/actions/update-profile-name';
import ProfileClientsTable from '@/components/dashboard/profile-clients-table';
import { useUser } from '@/components/helper/user-context';

export default function ProfilePage() {
    // 1. Consume data from the central context
    const { profile, clients, loading } = useUser();

    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");

    // 2. Sync local state when context profile loads
    useEffect(() => {
        if (profile?.full_name) {
            setNewName(profile.full_name);
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfileName(newName);
            setIsEditing(false);
        } catch (e) {
            alert("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center">
            <Loader2 className="animate-spin mx-auto text-primary" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-10">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Profile & Access</h1>
                <p className="text-muted-foreground text-sm">Manage your identity and linked family portfolios.</p>
            </header>

            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center gap-2 font-semibold text-slate-700">
                    <User size={18} /> Account Information
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Full Name</label>
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <>
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 p-2 border rounded-md outline-none ring-primary/20 focus:ring-2 text-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleSave} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setNewName(profile?.full_name || ""); // Reset to original name
                                                setIsEditing(false); // Exit editing mode
                                            }}
                                            disabled={saving}
                                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button></div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center w-full group">
                                    <span className="text-lg font-medium text-slate-900">{profile?.full_name}</span>
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-600 text-sm">
                                <Mail size={14} /> {profile?.email}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: LINKED CLIENTS TABLE */}
            <ProfileClientsTable clients={clients || []} />
        </div>
    );
}