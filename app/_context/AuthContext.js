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

  // --- NEW: STARK GLOBAL HEARTBEAT & PRESENCE ---
  useEffect(() => {
    if (!user) return;

    // A. Initialize Global Presence Channel
    const channel = supabase.channel('stark-global-presence', {
        config: { presence: { key: user.id } }
    });

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // Track the agent across the platform
            await channel.track({ 
                user_id: user.id,
                online_at: new Date().toISOString() 
            });
            
            // Initial arrival ping to DB
            await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    });

    // B. PERSISTENT BACKGROUND HEARTBEAT
    // We update the DB timestamp every 30 seconds to keep the "Last Seen" accurate.
    // We do NOT use 'leave' listeners here because they are too sensitive for mobile.
    const heartbeat = setInterval(() => {
        if (user) {
            supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    }, 30000); 

    return () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    // Final timestamp update on manual exit
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