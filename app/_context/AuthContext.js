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
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- STARK GLOBAL HEARTBEAT & BROADCASTER ---
  useEffect(() => {
    if (!user) return;

    // 1. Initialize the global presence channel
    // We only define the presence key here for the broadcaster
    const channel = supabase.channel('stark-global-presence', {
        config: { presence: { key: user.id } }
    });

    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // 2. Start tracking this session
            await channel.track({ 
                user_id: user.id,
                online_at: new Date().toISOString() 
            });
            
            // 3. Mark DB as active immediately
            await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    });

    // 4. Heartbeat: Keeps the 'last_seen_at' column fresh in the database
    // This runs in the background regardless of which page you are on.
    const heartbeat = setInterval(() => {
        if (user) supabase.rpc('update_last_seen', { p_user_id: user.id });
    }, 45000); // 45 seconds is safe for DB and mobile battery

    return () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
    };
  }, [user]);


  const signOut = async () => {
    if (user) await supabase.rpc('update_last_seen', { p_user_id: user.id });
    await supabase.auth.signOut();
    router.push("/login");
  };

  const value = { session, user, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);