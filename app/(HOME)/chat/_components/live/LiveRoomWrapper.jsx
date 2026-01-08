"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AgoraRTCProvider } from "agora-rtc-react";
import { Loader2 } from "lucide-react";
import LiveStage from "./LiveStage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; 

export default function LiveRoomWrapper({ channelId, isHost, audioOnly, callMessageId, onClose }) {
  const { user } = useAuth();
  
  // --- FIX: Client State ---
  const [agoraClient, setAgoraClient] = useState(null);
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  // Supabase State
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  const channelRef = useRef(null);

  // 1. Initialize Client (Client-Side Only)
  useEffect(() => {
    setMounted(true);
    
    // Dynamic import to prevent SSR "window is not defined" or build errors
    import("agora-rtc-sdk-ng").then((AgoraRTC) => {
      const client = AgoraRTC.default.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);
    }).catch(err => {
        console.error("Agora Load Failed", err);
        setError("Failed to load video engine");
    });

    return () => setMounted(false);
  }, []);

  // 2. Fetch Token (Only after client is ready)
  useEffect(() => {
    if (!agoraClient) return;

    const fetchToken = async () => {
      try {
        const role = 'publisher'; 
        const { data, error } = await supabase.functions.invoke('agora-token', {
            body: { channelName: channelId, uid: uid, role }
        });
        if (error || !data?.token) throw new Error("Token failed");
        setToken(data.token); 
      } catch (err) {
        console.error("Token Error:", err);
        setError("Connection Failed");
      } finally {
        setLoading(false);
      }
    };

    if (AGORA_APP_ID) fetchToken();
    else { setError("Missing App ID"); setLoading(false); }
  }, [channelId, uid, agoraClient]); 

  // 3. Realtime Logic (Supabase)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`live-room-${channelId}`, {
        config: { presence: { key: user.id } }
    });

    channel
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = [];
        for (let id in newState) { users.push(newState[id][0]); }
        setViewers(users);
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => setLiveMessages(prev => [...prev.slice(-49), payload]))
    .on('broadcast', { event: 'heart' }, () => {
        const heartId = Date.now() + Math.random();
        setIncomingHearts(prev => [...prev, heartId]);
        setTimeout(() => setIncomingHearts(prev => prev.filter(h => h !== heartId)), 3000);
    })
    .subscribe();

    channelRef.current = channel;

    // Kicker Logic
    let statusSub = null;
    if (callMessageId) {
        statusSub = supabase.channel(`watch-call-${callMessageId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `id=eq.${callMessageId}` }, (payload) => {
                if (['ended', 'missed'].includes(payload.new.metadata?.status)) onClose(); 
            })
            .subscribe();
    }

    return () => {
        if (isHost && callMessageId) {
            supabase.from('messages').update({
                metadata: { status: 'ended', endedAt: new Date().toISOString(), audioOnly }
            }).eq('id', callMessageId).then();
        }
        channel.unsubscribe();
        if (statusSub) supabase.removeChannel(statusSub);
    };
  }, [channelId, user, isHost, uid, callMessageId, audioOnly, onClose]);

  // Passthroughs
  const sendLiveMessage = (text) => {
    if (channelRef.current) {
        const payload = { id: Date.now(), text, sender_id: user.id, username: "Me" };
        channelRef.current.send({ type: 'broadcast', event: 'chat', payload });
        setLiveMessages(prev => [...prev, payload]);
    }
  };

  const sendHeart = () => {
    if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'heart', payload: {} });
        setIncomingHearts(prev => [...prev, Date.now()]);
    }
  };

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] bg-black">
      {loading || !agoraClient || !token ? (
        <div className="w-full h-full flex items-center justify-center text-white gap-2">
          <Loader2 className="animate-spin text-accent" /> 
          <span className="font-mono text-xs uppercase tracking-widest">Secure_Link_Handshake...</span>
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-red-500">{error}</div>
      ) : (
        <AgoraRTCProvider client={agoraClient}>
            <LiveStage 
              channelName={channelId} 
              appId={AGORA_APP_ID} 
              token={token} 
              uid={uid} 
              isPublisher={true} // Everyone publishes in a call
              viewers={viewers}
              messages={liveMessages}
              hearts={incomingHearts}
              onSendMessage={sendLiveMessage}
              onSendHeart={sendHeart}
              onLeave={onClose}
              audioOnly={audioOnly}
            />
        </AgoraRTCProvider>
      )}
    </div>
  );

  return createPortal(content, document.body);
}