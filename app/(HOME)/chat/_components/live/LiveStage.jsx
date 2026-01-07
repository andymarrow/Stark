"use client";
import {
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, X, MessageSquare, Heart, Users,
} from "lucide-react";
import LiveChatOverlay from "./LiveChatOverlay";
import LiveViewerList from "./LiveViewerList";

export default function LiveStage({
  channelName, appId, token, uid, isPublisher, onLeave, viewers, messages, hearts, onSendMessage, onSendHeart, audioOnly
}) {
  const client = useRTCClient();

  // --- TRACKS ---
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isPublisher);
  const { localCameraTrack } = useLocalCameraTrack(isPublisher && !audioOnly);
  
  const remoteUsers = useRemoteUsers();
  const localVideoRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [showChat, setShowChat] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  // --- LIFECYCLE ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);
  
  // Publish
  usePublish([localMicrophoneTrack, camOn ? localCameraTrack : null]);

  // Clean Hardware
  useEffect(() => {
    return () => {
      localCameraTrack?.close();
      localMicrophoneTrack?.close();
    };
  }, [localCameraTrack, localMicrophoneTrack]);

  // Toggle Hardware
  useEffect(() => { if (localMicrophoneTrack) localMicrophoneTrack.setMuted(!micOn); }, [micOn, localMicrophoneTrack]);
  useEffect(() => { if (localCameraTrack) localCameraTrack.setEnabled(camOn); }, [camOn, localCameraTrack]);

  // --- RENDER LOCAL VIDEO ---
  // This logic ensures the local video plays in the correct ref regardless of layout
  useEffect(() => {
    if (localCameraTrack && camOn && localVideoRef.current) {
      localCameraTrack.play(localVideoRef.current);
    }
  }, [localCameraTrack, camOn, remoteUsers.length]); // Re-run when remote users change (layout shift)

  const isConnected = remoteUsers.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in zoom-in-95 duration-300">
      
      {/* HEARTS */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {hearts.map((id) => (
            <motion.div key={id} initial={{ opacity: 1, y: "100%", x: Math.random() * 100 - 50 }} animate={{ opacity: 0, y: "20%" }} exit={{ opacity: 0 }} transition={{ duration: 2, ease: "easeOut" }} className="absolute bottom-20 right-10 text-red-500">
              <Heart size={32} fill="currentColor" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 z-40 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-red-600 px-3 py-1 rounded-sm flex items-center gap-2 animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-widest">
                {isConnected ? "SECURE_LINK_ACTIVE" : "WAITING_FOR_UPLINK..."}
            </span>
          </div>
          <button onClick={() => setShowViewers(!showViewers)} className="bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5 text-[10px] text-zinc-300">
             <Users size={10} className="inline mr-1" /> {viewers.length}
          </button>
        </div>
        <button onClick={onLeave} className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors pointer-events-auto shadow-lg">
          <X size={24} />
        </button>
      </div>

      {showViewers && <div className="pointer-events-auto z-50"><LiveViewerList users={viewers} /></div>}

      {/* --- VIDEO STAGE --- */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
        
        {/* CASE A: NOT CONNECTED (Show My Video Full Screen) */}
        {!isConnected && (
            <div className="relative w-full h-full">
                {/* My Video */}
                <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }}>
                    {!camOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 gap-2">
                            <VideoOff size={48} className="text-zinc-700" />
                            <span className="font-mono text-xs uppercase text-zinc-500">Video Muted</span>
                        </div>
                    )}
                </div>
                
                {/* Waiting Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-md px-8 py-6 rounded-xl flex flex-col items-center gap-4 border border-white/10">
                        <div className="w-12 h-12 border-4 border-zinc-700 border-t-accent rounded-full animate-spin" />
                        <div className="text-center">
                            <h3 className="font-bold text-white tracking-widest uppercase">Calling...</h3>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1">Waiting for remote handshake</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CASE B: CONNECTED (Remote Full, Me PIP) */}
        {isConnected && (
            <>
                {/* Remote Video (Main) */}
                <div className="relative w-full h-full">
                    <RemoteUser user={remoteUsers[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 -z-10">
                            <Users size={48} className="text-zinc-600 animate-pulse" />
                        </div>
                    </RemoteUser>
                </div>

                {/* Local Video (PIP) */}
                <div className="absolute bottom-24 right-4 w-32 h-48 bg-black border border-white/20 shadow-2xl rounded-lg overflow-hidden z-20 transition-all hover:scale-105 hover:border-accent">
                    <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }}>
                        {!camOn && (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                <VideoOff size={20} className="text-zinc-600" />
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded text-white backdrop-blur-sm">YOU</div>
                </div>
            </>
        )}

      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none p-6 pb-8">
        {showChat && <div className="h-48 w-full md:w-1/3 self-start pointer-events-auto mb-4"><LiveChatOverlay messages={messages} onSendMessage={onSendMessage} /></div>}

        <div className="flex items-center justify-center gap-6 pointer-events-auto">
            <button onClick={() => setMicOn(!micOn)} className={`p-4 rounded-full backdrop-blur-md border transition-all ${micOn ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-red-500 border-red-500 text-white"}`}>
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            <button onClick={() => setCamOn(!camOn)} className={`p-4 rounded-full backdrop-blur-md border transition-all ${camOn ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-red-500 border-red-500 text-white"}`}>
                {camOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button onClick={() => setShowChat(!showChat)} className={`p-4 rounded-full backdrop-blur-md border transition-all ${showChat ? "bg-accent text-white border-accent" : "bg-white/10 border-white/20 hover:bg-white/20"}`}>
                <MessageSquare size={24} />
            </button>

            <button onClick={onSendHeart} className="p-4 bg-pink-500/20 hover:bg-pink-500 text-pink-500 hover:text-white rounded-full backdrop-blur-md border border-pink-500/50 transition-all active:scale-90">
                <Heart size={24} className="fill-current" />
            </button>
        </div>
      </div>
    </div>
  );
}