"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// 1. Define the Global State Shape
interface UserContextType {
    user: User | null;
    profile: any; // Using the 'profiles' table data
    clients: any[]; // Using the 'clients' table data
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ 
    children, 
    initialUser, 
    initialProfile, 
    initialClients 
}: { 
    children: React.ReactNode,
    initialUser: User | null,
    initialProfile: any,
    initialClients: any[]
}) => {
    const supabase = useMemo(() => createClient(), []);
    
    // Initialize state with data passed from the Server Layout
    const [user, setUser] = useState<User | null>(initialUser);
    const [profile, setProfile] = useState<any>(initialProfile);
    const [clients, setClients] = useState<any[]>(initialClients);
    
    // Loading is false immediately if the server provided data
    const [loading, setLoading] = useState(!initialProfile);

    useEffect(() => {
        // Sync auth state (e.g., logout in another tab)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setClients([]);
            } else if (session?.user) {
                setUser(session.user);
            }
        });

        return () => authListener?.subscription.unsubscribe();
    }, [supabase]);

    // Optional: Re-fetch profile/clients if user changes but we haven't reloaded the layout
    useEffect(() => {
        if (user && profile?.id !== user.id) {
            const syncData = async () => {
                const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(p);
                if (p?.client_ids) {
                    const { data: c } = await supabase.from('clients').select('*').in('client_id', p.client_ids);
                    setClients(c || []);
                }
            };
            syncData();
        }
    }, [user?.id, supabase]);

    const value = { user, profile, clients, loading };
    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};