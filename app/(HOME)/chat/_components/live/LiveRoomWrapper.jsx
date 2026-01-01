"use client";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import LiveStage from "./LiveStage";
import { supabase } from "@/lib/supabaseClient";

// IMPORTANT: This pulls from your .env.local
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; 

export default function LiveRoomWrapper({ channelId, isHost, audioOnly, onClose }) {
  // Initialize Agora Client
  const [client] = useState(() => AgoraRTC.createClient({ mode: "live", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate a random numeric UID for Agora (since it doesn't support UUID strings easily)
  const uid = Math.floor(Math.random() * 1000000);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("📡 Requesting Token from Edge Function...");
        
        // This calls the function you just deployed: 'agora-token'
        const { data, error } = await supabase.functions.invoke('agora-token', {
            body: { 
                channelName: channelId, 
                uid: uid, 
                role: isHost ? 'publisher' : 'subscriber' 
            }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            throw new Error("Could not reach authentication server.");
        }
        
        if (!data?.token) {
            throw new Error("Invalid token received.");
        }

        setToken(data.token); 
      } catch (err) {
        console.error("Token Fetch Error", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (AGORA_APP_ID) {
        fetchToken();
    } else {
        setError("Missing AGORA_APP_ID in environment variables.");
        setLoading(false);
    }
  }, [channelId, isHost]);

  if (loading) {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
            <Loader2 size={40} className="animate-spin text-accent mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Establishing Secure Uplink...
            </p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-red-500">
            <AlertTriangle size={40} className="mb-4" />
            <p className="font-mono text-sm uppercase mb-6">Connection Failed: {error}</p>
            <button 
                onClick={onClose} 
                className="border border-white/20 px-6 py-3 text-white text-xs font-mono uppercase hover:bg-white/10 transition-colors"
            >
                Abort Mission
            </button>
        </div>
    );
  }

  return (
    <AgoraRTCProvider client={client}>
      <LiveStage 
        channelName={channelId} 
        appId={AGORA_APP_ID}
        token={token} 
        uid={uid}
        isHost={isHost}
        audioOnly={audioOnly} // Pass this down so camera starts off if needed
        onLeave={onClose}
      />
    </AgoraRTCProvider>
  );
}