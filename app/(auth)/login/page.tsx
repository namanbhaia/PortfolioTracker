"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // Your Supabase browser client

export default function LoginPage() {
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
      </div>
    </div>
  );
}