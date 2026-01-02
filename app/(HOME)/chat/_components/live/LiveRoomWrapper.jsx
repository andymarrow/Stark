"use client";
import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import LiveStage from "./LiveStage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID; 

export default function LiveRoomWrapper({ channelId, isHost, audioOnly, onClose }) {
  const { user } = useAuth();
  
  // Agora State
  const [client] = useState(() => AgoraRTC.createClient({ mode: "live", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  // Realtime State (Ephemeral)
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]); // Array of IDs for animation

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Supabase Channel Ref
  const channelRef = useRef(null);

  // 1. Fetch Agora Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('agora-token', {
            body: { channelName: channelId, uid: uid, role: isHost ? 'publisher' : 'subscriber' }
        });
        if (error || !data?.token) throw new Error("Token generation failed");
        setToken(data.token); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (AGORA_APP_ID) fetchToken();
    else { setError("Missing AGORA_APP_ID"); setLoading(false); }
  }, [channelId, isHost, uid]);

  // 2. Setup Supabase Realtime (Presence & Broadcast)
  useEffect(() => {
    if (!user) return;

    // Update DB status if Host
    if (isHost) {
        supabase.from('conversations').update({ is_live: true }).eq('id', channelId).then();
    }

    const channel = supabase.channel(`live-room-${channelId}`, {
        config: {
            presence: { key: user.id },
        }
    });

    channel
    // A. Handle Presence (Viewer List)
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = [];
        for (let id in newState) {
            // Each key is an array of presence objects for that user
            users.push(newState[id][0]); 
        }
        setViewers(users);
    })
    // B. Handle Ephemeral Chat
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setLiveMessages(prev => [...prev.slice(-49), payload]); // Keep last 50 in memory
    })
    // C. Handle Flying Hearts
    .on('broadcast', { event: 'heart' }, () => {
        const heartId = Date.now() + Math.random();
        setIncomingHearts(prev => [...prev, heartId]);
        // Auto remove from state array after animation time (to prevent memory leak)
        setTimeout(() => {
            setIncomingHearts(prev => prev.filter(h => h !== heartId));
        }, 3000);
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // Fetch profile for presence payload
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

    // Cleanup
    return () => {
        if (isHost) {
            supabase.from('conversations').update({ is_live: false }).eq('id', channelId).then();
        }
        channel.unsubscribe();
    };
  }, [channelId, user, isHost, uid]);

  // 3. Helper Functions passed down
  const sendLiveMessage = (text) => {
    if (!channelRef.current) return;
    const msgPayload = {
        id: Date.now(),
        text,
        sender_id: user.id,
        username: viewers.find(v => v.user_id === user.id)?.username || "Me"
    };
    // Send to others
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msgPayload });
    // Add to local immediately
    setLiveMessages(prev => [...prev, msgPayload]);
  };

  const sendHeart = () => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'heart', payload: {} });
    // Trigger local animation
    const heartId = Date.now();
    setIncomingHearts(prev => [...prev, heartId]);
    setTimeout(() => {
        setIncomingHearts(prev => prev.filter(h => h !== heartId));
    }, 3000);
  };

  if (loading) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <AgoraRTCProvider client={client}>
      <LiveStage 
        channelName={channelId} appId={AGORA_APP_ID} token={token} uid={uid} isHost={isHost}
        // Pass Realtime Data
        viewers={viewers}
        messages={liveMessages}
        hearts={incomingHearts}
        onSendMessage={sendLiveMessage}
        onSendHeart={sendHeart}
        onLeave={onClose}
      />
    </AgoraRTCProvider>
  );
}