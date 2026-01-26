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

// Create the Provider component
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // 1. Get the current user session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                setError(sessionError.message);
                setLoading(false);
                return;
            }

            const currentUser = session?.user;
            setUser(currentUser || null);

            if (currentUser) {
                try {
                    // 2. Fetch the user's profile
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('full_name, client_ids')
                        .eq('id', currentUser.id)
                        .single();

                    if (profileError) throw profileError;
                    setProfile(profileData);

                    // 3. Fetch client details based on the profile's client_ids
                    if (profileData?.client_ids?.length > 0) {
                        const { data: clientData, error: clientError } = await supabase
                            .from('clients')
                            .select('client_id, client_name')
                            .in('client_id', profileData.client_ids);

                        if (clientError) throw clientError;
                        setClients(clientData || []);
                    }
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchData();

        // Listen for auth changes to refetch data
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user !== user) {
                fetchData();
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

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
