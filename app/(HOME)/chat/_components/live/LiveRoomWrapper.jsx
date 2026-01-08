"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import AgoraRTC from "agora-rtc-sdk-ng"; 
import { AgoraRTCProvider } from "agora-rtc-react";
import { Loader2 } from "lucide-react";
import LiveStage from "./LiveStage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; 

export default function LiveRoomWrapper({ channelId, isHost, audioOnly, callMessageId, onClose }) {
  const { user } = useAuth();
  
  // FIX 1: Stable Client Creation. 
  // We use useMemo to ensure this object is a singleton for the lifespan of this component.
  // We check for 'window' to avoid SSR crashes.
  const client = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  }, []);

  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  // Supabase State
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const channelRef = useRef(null);
  const isHostRef = useRef(isHost);

  // Portal Logic
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 1. Fetch Token
  useEffect(() => {
    if (!client) return;
    
    const fetchToken = async () => {
      try {
        const role = 'publisher'; // In "rtc" mode, everyone who speaks is a publisher
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
  }, [channelId, uid, client]); // Removed isHost/callMessageId dependencies to prevent token refetch

  // 2. Realtime Logic
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
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
            await channel.track({
                user_id: user.id,
                username: profile?.username || "User",
                avatar_url: profile?.avatar_url,
                is_host: isHost,
                agora_uid: uid
            });
        }
    });

    channelRef.current = channel;

    let statusSub = null;
    if (callMessageId) {
        statusSub = supabase.channel(`watch-call-${callMessageId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `id=eq.${callMessageId}` }, (payload) => {
                const status = payload.new.metadata?.status;
                if (status === 'ended' || status === 'missed') onClose(); 
            })
            .subscribe();
    }

    return () => {
        if (callMessageId && isHostRef.current) {
            supabase.from('messages').update({
                metadata: { status: 'ended', endedAt: new Date().toISOString(), audioOnly }
            }).eq('id', callMessageId).then();
        }
        if (isHost && !callMessageId) {
            supabase.from('conversations').update({ is_live: false }).eq('id', channelId).then();
        }
        channel.unsubscribe();
        if (statusSub) supabase.removeChannel(statusSub);
    };
  }, [channelId, user, isHost, uid, callMessageId, audioOnly, onClose]);

  const sendLiveMessage = (text) => {
    if (!channelRef.current) return;
    const msgPayload = { id: Date.now(), text, sender_id: user.id, username: viewers.find(v => v.user_id === user.id)?.username || "Me" };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msgPayload });
    setLiveMessages(prev => [...prev, msgPayload]);
  };

  const sendHeart = () => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'heart', payload: {} });
    const heartId = Date.now();
    setIncomingHearts(prev => [...prev, heartId]);
    setTimeout(() => setIncomingHearts(prev => prev.filter(h => h !== heartId)), 3000);
  };

  if (!mounted || !client) return null;

  const content = (
    <div className="fixed inset-0 z-[100000] bg-black">
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-white">
          <Loader2 className="animate-spin mr-2" /> Initializing Frequency...
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-red-500">{error}</div>
      ) : (
        /* FIX 2: Only render Provider when we have a token */
        token && (
          <AgoraRTCProvider client={client}>
            <LiveStage 
              channelName={channelId} 
              appId={AGORA_APP_ID} 
              token={token} 
              uid={uid} 
              isPublisher={!!callMessageId || isHost}
              viewers={viewers}
              messages={liveMessages}
              hearts={incomingHearts}
              onSendMessage={sendLiveMessage}
              onSendHeart={sendHeart}
              onLeave={onClose}
              audioOnly={audioOnly}
            />
          </AgoraRTCProvider>
        )
      )}
    </div>
  );

  return createPortal(content, document.body);
}