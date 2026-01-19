"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // NEW: Store online users globally here
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const router = useRouter();
  
  // Use a ref to track the channel to prevent duplicate subscriptions
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

  // --- STARK GLOBAL HEARTBEAT & BROADCASTER ---
  useEffect(() => {
    if (!user) return;

    // 1. Define the channel once
    // We use the user.id as the presence key so the state object keys are simply User IDs
    const channel = supabase.channel('stark-global-presence', {
        config: { presence: { key: user.id } }
    });

    channelRef.current = channel;

    // 2. Listen for Sync (Who is online?)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Since we set key: user.id, Object.keys returns the UUIDs directly
        const onlineIds = new Set(Object.keys(state));
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // 3. Broadcast I am online
            await channel.track({ 
                user_id: user.id,
                online_at: new Date().toISOString() 
            });
            
            // 4. Mark DB as active immediately
            await supabase.rpc('update_last_seen', { p_user_id: user.id });
        }
    });

    // 5. Database Heartbeat (Backup for cold storage/offline logic)
    const heartbeat = setInterval(() => {
        if (user) supabase.rpc('update_last_seen', { p_user_id: user.id });
    }, 45000); 

    return () => {
        clearInterval(heartbeat);
        // Clean up: Untrack presence before leaving
        if (channelRef.current) {
            channelRef.current.untrack().then(() => {
                supabase.removeChannel(channelRef.current);
            });
        }
    };
  }, [user]);

  const signOut = async () => {
    if (user && channelRef.current) {
        // Attempt to remove self from presence list instantly on logout
        await channelRef.current.untrack();
        await supabase.rpc('update_last_seen', { p_user_id: user.id });
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Export onlineUsers so the Chat Page can use it
  const value = { session, user, loading, signOut, onlineUsers };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);