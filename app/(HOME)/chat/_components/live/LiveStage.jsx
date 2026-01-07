"use client";
import {
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from "agora-rtc-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, X, MessageSquare, Heart, Users, Monitor, MonitorOff, AlertCircle
} from "lucide-react";
import LiveChatOverlay from "../LiveChatOverlay";
import LiveViewerList from "../LiveViewerList";

export default function LiveStage({
  channelName, appId, token, uid, isPublisher, onLeave, viewers, messages, hearts, onSendMessage, onSendHeart, audioOnly
}) {
  const client = useRTCClient();

  // --- TRACKS ---
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isPublisher);
  const { localCameraTrack, error: camError } = useLocalCameraTrack(isPublisher && !audioOnly);
  
  const [screenOn, setScreenOn] = useState(false);
  const { localScreenTrack, error: screenError } = useLocalScreenTrack(screenOn && isPublisher, {}, "auto");

  const remoteUsers = useRemoteUsers();
  const localVideoRef = useRef(null);
  const localScreenRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [showChat, setShowChat] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  // --- LIFECYCLE ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);
  usePublish([localMicrophoneTrack, camOn ? localCameraTrack : null, screenOn ? localScreenTrack : null]);

  useEffect(() => {
    return () => {
      localCameraTrack?.stop();
      localCameraTrack?.close();
      localMicrophoneTrack?.stop();
      localMicrophoneTrack?.close();
      localScreenTrack?.stop();
      localScreenTrack?.close();
    };
  }, [localCameraTrack, localMicrophoneTrack, localScreenTrack]);

  // Hardware Toggles
  useEffect(() => { if (localMicrophoneTrack) localMicrophoneTrack.setMuted(!micOn); }, [micOn, localMicrophoneTrack]);
  useEffect(() => { if (localCameraTrack) localCameraTrack.setEnabled(camOn); }, [camOn, localCameraTrack]);

  // Handle Video Rendering
  useEffect(() => {
    if (localCameraTrack && camOn && localVideoRef.current) {
        localCameraTrack.play(localVideoRef.current);
    }
  }, [localCameraTrack, camOn, remoteUsers.length]);

  const isConnected = remoteUsers.length > 0;
  const isCameraBlocked = camError?.message?.includes("NotReadableError") || camError?.message?.includes("Could not start video source");

  return (
    <div className="fixed inset-0 z-[100000] bg-black text-white flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-red-600 px-3 py-1 rounded-sm flex items-center gap-2 animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-widest">{isConnected ? "STABLE_LINK" : "ESTABLISHING..."}</span>
          </div>
          <button onClick={() => setShowViewers(!showViewers)} className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 text-[10px] text-zinc-300">
             <Users size={12} className="inline mr-1" /> {viewers.length}
          </button>
        </div>
        <button onClick={onLeave} className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors pointer-events-auto shadow-xl">
          <X size={24} />
        </button>
      </div>

      {showViewers && <div className="pointer-events-auto z-[60]"><LiveViewerList users={viewers} /></div>}

      {/* --- MAIN STAGE --- */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        
        {/* CAMERA ERROR ALERT */}
        {isCameraBlocked && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-xs font-mono animate-bounce">
                <AlertCircle size={16} /> CAMERA_LOCKED: CLOSE OTHER APPS
            </div>
        )}

        {/* NOT CONNECTED: SHOW ME */}
        {!isConnected && (
            <div className="w-full h-full relative">
                <div ref={localVideoRef} className="w-full h-full object-cover bg-zinc-900" style={{ transform: "rotateY(180deg)" }} />
                {!camOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-3">
                        <VideoOff size={48} className="text-zinc-700" />
                        <span className="text-xs font-mono text-zinc-500 uppercase">Signal Muted</span>
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white">Searching for receiver...</span>
                    </div>
                </div>
            </div>
        )}

        {/* CONNECTED: SHOW THEM MAIN, ME PIP */}
        {isConnected && (
            <div className="w-full h-full relative bg-black">
                <RemoteUser user={remoteUsers[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 -z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Users size={48} className="text-zinc-800 animate-pulse" />
                            <span className="text-[10px] font-mono text-zinc-600 uppercase">Receiving Audio Only</span>
                        </div>
                    </div>
                </RemoteUser>

                {/* MY CAMERA (PIP) */}
                <div className="absolute bottom-32 right-6 w-36 h-52 bg-zinc-900 border-2 border-white/20 shadow-2xl rounded-xl overflow-hidden z-30 transition-transform hover:scale-105">
                    <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }} />
                    {!camOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                            <VideoOff size={20} className="text-zinc-600" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 text-[8px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">LOCAL_HOST</div>
                </div>
            </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black to-transparent p-10 flex flex-col gap-6 pointer-events-none">
        {showChat && <div className="h-56 w-full md:w-80 self-start pointer-events-auto mb-4 backdrop-blur-sm rounded-lg overflow-hidden"><LiveChatOverlay messages={messages} onSendMessage={onSendMessage} /></div>}

        <div className="flex items-center justify-center gap-8 pointer-events-auto">
            <button onClick={() => setMicOn(!micOn)} className={`p-5 rounded-full backdrop-blur-xl border transition-all ${micOn ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"}`}>
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            <button onClick={() => setCamOn(!camOn)} className={`p-5 rounded-full backdrop-blur-xl border transition-all ${camOn ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"}`}>
                {camOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button onClick={() => setShowChat(!showChat)} className={`p-5 rounded-full backdrop-blur-xl border transition-all ${showChat ? "bg-accent text-white border-accent shadow-[0_0_20px_rgba(var(--accent),0.4)]" : "bg-white/5 border-white/10"}`}>
                <MessageSquare size={24} />
            </button>

            <button onClick={onSendHeart} className="p-5 bg-pink-500/10 hover:bg-pink-600 text-pink-500 hover:text-white rounded-full backdrop-blur-xl border border-pink-500/30 transition-all active:scale-90">
                <Heart size={24} className="fill-current" />
            </button>
        </div>
      </div>
    </div>
  );
}