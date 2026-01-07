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
  
  // Agora State - Mode must be "rtc" for communication, or "live" with low latency
  // We stick to "live" but ensure client role is host for everyone in a call
  const [client] = useState(() => AgoraRTC.createClient({ mode: "live", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  // Realtime State
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  
  const maxViewersRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const channelRef = useRef(null);

  // 1. Fetch Token (FORCE PUBLISHER ROLE FOR EVERYONE)
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('agora-token', {
            // CRITICAL FIX: In a 1:1 call, BOTH parties are 'publisher'
            body: { channelName: channelId, uid: uid, role: 'publisher' } 
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

  // 2. Setup Supabase Realtime & Auto-Close Logic
  useEffect(() => {
    if (!user) return;

    // A. Room Presence Channel
    const channel = supabase.channel(`live-room-${channelId}`, {
        config: { presence: { key: user.id } }
    });

    channel
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users = [];
        for (let id in newState) { users.push(newState[id][0]); }
        setViewers(users);
        if (users.length > maxViewersRef.current) maxViewersRef.current = users.length;
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

    // B. Call Status Listener (Auto-Close for the other person)
    let statusSubscription = null;
    if (callMessageId) {
        statusSubscription = supabase.channel(`call-watch-${callMessageId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'messages', 
                filter: `id=eq.${callMessageId}` 
            }, (payload) => {
                // If the DB status changes to 'ended' or 'missed', close this window
                if (payload.new.metadata?.status === 'ended' || payload.new.metadata?.status === 'missed') {
                    onClose(); 
                }
            })
            .subscribe();
    }

    // Cleanup
    return () => {
        // If I am the one closing the window explicitly (and I'm the host OR the call was active), update DB
        if (callMessageId) {
            // Determine if it was a real talk or missed call
            const callStatus = maxViewersRef.current > 1 ? 'ended' : 'missed';
            
            // Only perform update if it's currently ongoing to avoid race conditions
            supabase
                .from('messages')
                .select('metadata')
                .eq('id', callMessageId)
                .single()
                .then(({ data }) => {
                    if (data?.metadata?.status === 'ongoing') {
                        supabase.from('messages').update({
                            metadata: {
                                ...data.metadata,
                                status: callStatus,
                                endedAt: new Date().toISOString()
                            }
                        }).eq('id', callMessageId).then();
                    }
                });
        }

        channel.unsubscribe();
        if (statusSubscription) supabase.removeChannel(statusSubscription);
    };
  }, [channelId, user, isHost, uid, callMessageId, audioOnly, onClose]);

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
        audioOnly={audioOnly}
      />
    </AgoraRTCProvider>
  );
}