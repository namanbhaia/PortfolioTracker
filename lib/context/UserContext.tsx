"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Define the shape of our context data
interface UserContextType {
    user: User | null;
    profile: any; // Consider defining a stricter type for profile
    clients: any[]; // And for clients
    loading: boolean;
    error: string | null;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

import { useMemo } from 'react';
// Create the Provider component
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        // Initial session fetch
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        getInitialSession();

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                setLoading(true);
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('full_name, client_ids')
                        .eq('id', user.id)
                        .single();

                    if (profileError) throw profileError;
                    setProfile(profileData);

                    if (profileData?.client_ids?.length > 0) {
                        const { data: clientData, error: clientError } = await supabase
                            .from('clients')
                            .select('client_id, client_name')
                            .in('client_id', profileData.client_ids);

                        if (clientError) throw clientError;
                        setClients(clientData || []);
                    } else {
                        setClients([]);
                    }
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setProfile(null);
                setClients([]);
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id, supabase]);

    const value = { user, profile, clients, loading, error };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
