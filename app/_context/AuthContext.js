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
    //
    // This used to fire every 60s for as long as a tab existed, including
    // tabs sitting in a background window on a machine nobody was using.
    // That is the single biggest source of request volume on this project:
    // it costs one database write per user per minute whether or not
    // anything is happening, so roughly 25 people idling with a tab open
    // generates about a million requests a month on its own, which is the
    // whole of the traffic the hosting bill was being driven by.
    //
    // Two changes: five minutes instead of one, and nothing at all while
    // the tab is hidden. "Last seen" only needs to be roughly right, and a
    // hidden tab is by definition not someone looking at the site. Together
    // that's about a 95% cut with no visible behaviour change.
    const HEARTBEAT_MS = 5 * 60 * 1000;

    const beat = () => {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
        supabase.rpc('update_last_seen', { p_user_id: user.id });
    };

    const heartbeat = setInterval(beat, HEARTBEAT_MS);

    // Coming back to the tab should refresh presence immediately rather than
    // waiting out the rest of the interval.
    const onVisible = () => {
        if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
        clearInterval(heartbeat);
        document.removeEventListener("visibilitychange", onVisible);
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