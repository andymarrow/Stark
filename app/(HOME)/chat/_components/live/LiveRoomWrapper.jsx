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
  
  // Agora State
  const [client] = useState(() => AgoraRTC.createClient({ mode: "live", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  // Realtime State
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  
  // Track max concurrent viewers to determine if call was "Missed" or "Connected"
  const maxViewersRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const channelRef = useRef(null);

  // 1. Fetch Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('agora-token', {
            body: { channelName: channelId, uid: uid, role: 'publisher' } // Everyone is publisher in a call
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
  }, [channelId, uid]);

  // 2. Setup Supabase Realtime
  useEffect(() => {
    if (!user) return;

    if (isHost && !callMessageId) {
        // Fallback for channel streaming logic (not 1:1 call)
        supabase.from('conversations').update({ is_live: true }).eq('id', channelId).then();
    }

    const channel = supabase.channel(`live-room-${channelId}`, {
        config: { presence: { key: user.id } }
    });

    channel
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = [];
        for (let id in newState) { users.push(newState[id][0]); }
        
        setViewers(users);
        
        // Track max viewers for "Missed Call" logic
        if (users.length > maxViewersRef.current) {
            maxViewersRef.current = users.length;
        }
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setLiveMessages(prev => [...prev.slice(-49), payload]);
    })
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

    // CLEANUP & CALL END LOGIC
    return () => {
        if (isHost && !callMessageId) {
             // Legacy Channel logic
            supabase.from('conversations').update({ is_live: false }).eq('id', channelId).then();
        } 

        // 1:1 Call Logic: Update the message status in DB
        if (callMessageId) {
            const callStatus = maxViewersRef.current > 1 ? 'ended' : 'missed';
            
            supabase.from('messages').update({
                metadata: {
                    status: callStatus,
                    endedAt: new Date().toISOString(),
                    audioOnly: audioOnly
                }
            }).eq('id', callMessageId).then();
        }

        channel.unsubscribe();
    };
  }, [channelId, user, isHost, uid, callMessageId, audioOnly]);

  // 3. Helper Functions
  const sendLiveMessage = (text) => {
    if (!channelRef.current) return;
    const msgPayload = {
        id: Date.now(),
        text,
        sender_id: user.id,
        username: viewers.find(v => v.user_id === user.id)?.username || "Me"
    };
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

  if (loading) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <AgoraRTCProvider client={client}>
      <LiveStage 
        channelName={channelId} appId={AGORA_APP_ID} token={token} uid={uid} isHost={isHost}
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