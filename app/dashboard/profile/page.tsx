"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Check, Pencil, Loader2, ShieldCheck } from 'lucide-react';
import { updateProfileName } from '@/lib/actions/profile/update-profile-name';
import { updateScreensaverPreference } from '@/lib/actions/profile/update-screensaver-preference';
import { updateProfilePreferences } from '@/lib/actions/profile/update-profile-preferences';
import { useTheme } from 'next-themes';
import ProfileClientsTable from '@/components/dashboard/profile-clients-table';
import { useUser } from '@/components/helper/user-context';

export default function ProfilePage() {
    // 1. Consume data from the central context
    const { profile, clients, screensaverClickOnly, setScreensaverClickOnly, autoFoldSidebar, setAutoFoldSidebar, themePreference, setThemePreference, loading } = useUser();
    const { setTheme } = useTheme();

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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile & Access</h1>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Manage your identity and linked family portfolios.</p>
            </header>

            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
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
                                        autoComplete="off"
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none ring-primary/20 focus:ring-2 text-sm dark:text-white"
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
                                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button></div>
                                </>
                            ) : (
                                <div className="flex justify-between items-center w-full group">
                                    <span className="text-lg font-medium text-slate-900 dark:text-white">{profile?.full_name}</span>
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
                                        <Pencil size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Email</label>
                            <div className="flex items-center gap-2 mt-1 text-slate-600 dark:text-slate-400 text-sm">
                                <Mail size={14} /> {profile?.email}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: PRIVACY SETTINGS */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck size={18} /> Privacy Settings
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Click to Dismiss Screensaver</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">When enabled, the screensaver will only be dismissed by a click.</p>
                        </div>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                try {
                                    const nextValue = !screensaverClickOnly;
                                    await updateScreensaverPreference(nextValue);
                                    setScreensaverClickOnly(nextValue);
                                } catch (e) {
                                    alert("Error updating preference");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${screensaverClickOnly ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${screensaverClickOnly ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION 3: APPEARANCE & BEHAVIOR */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck size={18} /> Appearance & Behavior
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Auto-Fold Sidebar</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">When enabled, the side profile will automatically minimize to save screen space.</p>
                        </div>
                        <button
                            onClick={async () => {
                                setSaving(true);
                                try {
                                    const nextValue = !autoFoldSidebar;
                                    await updateProfilePreferences({ auto_fold_sidebar: nextValue });
                                    setAutoFoldSidebar(nextValue);
                                } catch (e) {
                                    alert("Error updating preference");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${autoFoldSidebar ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${autoFoldSidebar ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Theme Preference</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Choose between light, dark, or system default.</p>
                        </div>
                        <select
                            value={themePreference || 'system'}
                            onChange={async (e) => {
                                const nextValue = e.target.value;
                                setSaving(true);
                                try {
                                    await updateProfilePreferences({ theme_preference: nextValue });
                                    setThemePreference(nextValue);
                                    setTheme(nextValue);
                                } catch (err) {
                                    alert("Error updating preference");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white transition-colors"
                        >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECTION 3: LINKED CLIENTS TABLE */}
            <ProfileClientsTable clients={clients || []} />
        </div>
    );
}