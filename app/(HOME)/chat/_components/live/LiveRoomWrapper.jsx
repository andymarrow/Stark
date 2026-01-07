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
  
  const [client] = useState(() => AgoraRTC.createClient({ mode: "live", codec: "vp8" }));
  const [token, setToken] = useState(null);
  const [uid] = useState(Math.floor(Math.random() * 1000000));
  
  const [viewers, setViewers] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [incomingHearts, setIncomingHearts] = useState([]);
  
  // Track attendance to decide if call was missed or connected
  const maxViewersRef = useRef(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const channelRef = useRef(null);

  // 1. Fetch Token (FORCE PUBLISHER)
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // In 1:1 call, everyone is a publisher. In Broadcast, host is publisher.
        // We can safely default to publisher for 1:1.
        const role = callMessageId ? 'publisher' : (isHost ? 'publisher' : 'subscriber');
        
        const { data, error } = await supabase.functions.invoke('agora-token', {
            body: { channelName: channelId, uid: uid, role } 
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
  }, [channelId, uid, isHost, callMessageId]);

  // 2. Setup Realtime
  useEffect(() => {
    if (!user) return;

    // --- Channel Streaming Logic (Non-Call) ---
    if (isHost && !callMessageId) {
        supabase.from('conversations').update({ is_live: true }).eq('id', channelId).then();
    }

    // --- Agora Presence Channel ---
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

    // --- Call Status Watcher (For Receiver) ---
    let statusSubscription = null;
    if (callMessageId) {
        statusSubscription = supabase.channel(`call-status-${callMessageId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'messages', 
                filter: `id=eq.${callMessageId}` 
            }, (payload) => {
                // If status changes to ended/missed, close window
                const newStatus = payload.new.metadata?.status;
                if (newStatus === 'ended' || newStatus === 'missed') {
                    onClose();
                }
            })
            .subscribe();
    }

    // --- CLEANUP ---
    return () => {
        // Legacy Channel Cleanup
        if (isHost && !callMessageId) {
            supabase.from('conversations').update({ is_live: false }).eq('id', channelId).then();
        }

        // Call Cleanup: Update Status in DB
        // We only update if WE are closing it and the status is still 'ongoing'
        if (callMessageId) {
            supabase
                .from('messages')
                .select('metadata')
                .eq('id', callMessageId)
                .single()
                .then(({ data }) => {
                    if (data?.metadata?.status === 'ongoing') {
                        const finalStatus = maxViewersRef.current > 1 ? 'ended' : 'missed';
                        supabase.from('messages').update({
                            metadata: {
                                ...data.metadata,
                                status: finalStatus,
                                endedAt: new Date().toISOString()
                            }
                        }).eq('id', callMessageId).then();
                    }
                });
        }

        channel.unsubscribe();
        if (statusSubscription) supabase.removeChannel(statusSubscription);
    };
  }, [channelId, user, isHost, uid, callMessageId, onClose]);

  // Actions
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

  if (loading) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <AgoraRTCProvider client={client}>
      <LiveStage 
        channelName={channelId} appId={AGORA_APP_ID} token={token} uid={uid} 
        isHost={isHost}
        // In 1:1 calls, isHost really just means "I am a participant", passing true ensures track creation
        isCallParticipant={!!callMessageId}
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