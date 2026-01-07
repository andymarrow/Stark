"use client";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import LiveStage from "./LiveStage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; 

export default function LiveRoomWrapper({ channelId, isHost, audioOnly, callMessageId, onClose }) {
  const { user } = useAuth();
  
  // Initialize Agora Client
  // 'mode: rtc' is better for 1:1 calls than 'live'
  const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000)); // Random INT ID for Agora
  
  // Supabase State
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for Cleanup
  const channelRef = useRef(null);
  const isHostRef = useRef(isHost); // Keep track if I am the original caller

  // 1. Fetch Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // CRITICAL: For 1:1 calls (callMessageId exists), EVERYONE must be a 'publisher'
        // For Broadcasts, only isHost is 'publisher'
        const role = callMessageId ? 'publisher' : (isHost ? 'publisher' : 'subscriber');
        
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
  }, [channelId, uid, isHost, callMessageId]);

  // 2. Realtime Logic & Cleanup
  useEffect(() => {
    if (!user) return;

    // A. Presence Channel (Who is here?)
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

    // B. Call Status Watcher (The "Kick" Mechanism)
    let statusSub = null;
    if (callMessageId) {
        statusSub = supabase.channel(`watch-call-${callMessageId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'messages', 
                filter: `id=eq.${callMessageId}` 
            }, (payload) => {
                const status = payload.new.metadata?.status;
                // If call ended/missed, EVERYONE leaves immediately
                if (status === 'ended' || status === 'missed') {
                    onClose(); 
                }
            })
            .subscribe();
    }

    // C. CLEANUP FUNCTION (Runs when I close the window)
    return () => {
        // If I am the CALLER (Host), I must end the call for everyone
        if (callMessageId && isHostRef.current) {
            supabase.from('messages').update({
                metadata: {
                    status: 'ended', // Just mark as ended, duration calc handles the rest
                    endedAt: new Date().toISOString(),
                    audioOnly: audioOnly
                }
            }).eq('id', callMessageId).then();
        }

        // Legacy Channel Cleanup
        if (isHost && !callMessageId) {
            supabase.from('conversations').update({ is_live: false }).eq('id', channelId).then();
        }

        channel.unsubscribe();
        if (statusSub) supabase.removeChannel(statusSub);
    };
  }, [channelId, user, isHost, uid, callMessageId, audioOnly, onClose]);

  // Pass-through functions
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

  if (loading) return <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <AgoraRTCProvider client={client}>
      <LiveStage 
        channelName={channelId} 
        appId={AGORA_APP_ID} 
        token={token} 
        uid={uid} 
        
        // LOGIC: If it's a Call, EVERYONE is a Host (Publisher).
        // If it's a Stream, only the isHost prop matters.
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
  );
}