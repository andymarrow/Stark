"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check active session on load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // 2. Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- STARK GLOBAL HEARTBEAT & PRESENCE ---
  useEffect(() => {
    if (!user) return;

    // A. Create a global channel for the entire platform
    const channel = supabase.channel('stark-global-presence', {
        config: { presence: { key: user.id } }
    });

    channel
    .on('presence', { event: 'leave' }, async ({ leftPresences }) => {
        // When this specific user leaves the site (closes all tabs)
        if (leftPresences.some(p => p.presence_ref === user.id)) {
            // Update the Database timestamp to show exactly when they went dark
            await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // Track the user across the site
            await channel.track({ 
                user_id: user.id,
                online_at: new Date().toISOString() 
            });
            
            // Mark as active in the DB immediately upon opening any Stark node
            await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    });

    // Handle browser/tab closure
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    // Before signing out, record the final last seen timestamp
    if (user) await supabase.rpc('update_last_seen', { p_user_id: user.id });
    
    await supabase.auth.signOut();
    router.push("/login");
  };

  const value = {
    session,
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};