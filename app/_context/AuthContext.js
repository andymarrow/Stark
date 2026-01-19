"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Global State
  const router = useRouter();
  
  const channelRef = useRef(null);

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

  // --- GLOBAL PRESENCE ENGINE ---
  useEffect(() => {
    if (!user) return;

    // 1. Define Channel
    // We use a fixed string 'global' so everyone is in the same room
    const channel = supabase.channel('stark-global', {
      config: {
        presence: {
          key: user.id, // The User ID is the key
        },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Convert presence object keys (user IDs) into a Set
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
             online_at: new Date().toISOString(),
             user_id: user.id 
          });
          // Ping DB on connect
          await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
      });

    // 2. Heartbeat for DB Timestamp (Separate from Presence)
    const heartbeat = setInterval(() => {
        supabase.rpc('update_last_seen', { p_user_id: user.id });
    }, 60000); // 1 min

    return () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    if (user && channelRef.current) {
        await channelRef.current.untrack();
    }
    await supabase.rpc('update_last_seen', { p_user_id: user.id });
    await supabase.auth.signOut();
    router.push("/login");
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    onlineUsers, // Exposed to app
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};