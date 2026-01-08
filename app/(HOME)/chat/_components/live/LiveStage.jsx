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
import {
  Mic, MicOff, Video, VideoOff, X, MessageSquare, Heart, Users, AlertCircle, Phone
} from "lucide-react";
import LiveChatOverlay from "./LiveChatOverlay";
import LiveViewerList from "./LiveViewerList";

export default function LiveStage({
  channelName, appId, token, uid, isPublisher, onLeave, viewers, messages, hearts, onSendMessage, onSendHeart, audioOnly
}) {
  // --- TRACKS ---
  // Only enable camera track if NOT audioOnly
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isPublisher);
  const { localCameraTrack, error: camError } = useLocalCameraTrack(isPublisher && !audioOnly);
  
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [showChat, setShowChat] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const remoteUsers = useRemoteUsers();
  const localVideoRef = useRef(null);

  // --- JOIN & PUBLISH ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);

  // We explicitly publish tracks. 
  // If camOn is toggled off, we mute the track rather than unpublishing usually, 
  // but usePublish handles the [track] array updates.
  usePublish([
    localMicrophoneTrack, 
    localCameraTrack // This will be null if audioOnly was true initially
  ]);

  // --- HARDWARE TOGGLES ---
  useEffect(() => { 
    if (localMicrophoneTrack) {
        localMicrophoneTrack.setMuted(!micOn); 
    }
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => { 
    if (localCameraTrack) {
        // If we have a track, enable/disable it based on state
        localCameraTrack.setEnabled(camOn); 
    }
  }, [camOn, localCameraTrack]);

  // --- LOCAL VIDEO PREVIEW ---
  useEffect(() => {
    if (localCameraTrack && camOn && localVideoRef.current) {
        localCameraTrack.play(localVideoRef.current);
    }
    return () => {
        if (localCameraTrack) localCameraTrack.stop();
    }
  }, [localCameraTrack, camOn]);

  const isConnected = remoteUsers.length > 0;
  
  // The person you are talking to
  const mainRemoteUser = remoteUsers[0]; 

  return (
    <div className="w-full h-full relative bg-black text-white flex flex-col overflow-hidden">
      
      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className={`px-3 py-1 rounded-sm flex items-center gap-2 animate-pulse ${isConnected ? 'bg-green-600' : 'bg-yellow-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest">
                {isConnected ? "ENCRYPTED_LINK" : "AWAITING_SIGNAL..."}
            </span>
          </div>
          <button onClick={() => setShowViewers(!showViewers)} className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 text-[10px] text-zinc-300">
             <Users size={12} className="inline mr-1" /> {viewers.length}
          </button>
        </div>
        <button onClick={onLeave} className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors pointer-events-auto shadow-xl z-50">
          <X size={24} />
        </button>
      </div>

      {showViewers && <div className="pointer-events-auto z-[60]"><LiveViewerList users={viewers} /></div>}

      {/* --- MAIN VIDEO AREA --- */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        
        {/* LOCAL USER (Waiting State) */}
        {!isConnected && (
            <div className="w-full h-full relative">
                {/* Show Local Camera if enabled */}
                {camOn && localCameraTrack ? (
                     <div ref={localVideoRef} className="w-full h-full object-cover bg-zinc-900" style={{ transform: "rotateY(180deg)" }} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                        <div className="p-8 rounded-full bg-zinc-800 border border-white/10 animate-pulse">
                             <Phone size={48} className="text-zinc-500" />
                        </div>
                        <p className="text-zinc-500 font-mono text-xs uppercase">Audio Only</p>
                    </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white">Establishing Handshake...</span>
                    </div>
                </div>
            </div>
        )}

        {/* CONNECTED STATE */}
        {isConnected && mainRemoteUser && (
            <div className="w-full h-full relative bg-black">
                {/* REMOTE USER VIDEO */}
                {/* We use cover: true to fill screen. */}
                <RemoteUser 
                    user={mainRemoteUser} 
                    style={{ width: "100%", height: "100%" }} 
                    className="object-cover"
                    cover={true}
                >
                    {/* Fallback if remote user has NO video (Audio Only from their side) */}
                    {!mainRemoteUser.hasVideo && (
                         <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl animate-pulse">
                                    <span className="text-4xl font-bold text-white">
                                        {mainRemoteUser.uid.toString().slice(0,1)}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Incoming Audio Transmission</span>
                            </div>
                        </div>
                    )}
                </RemoteUser>

                {/* MY LOCAL PIP (Picture in Picture) */}
                <div className="absolute bottom-32 right-6 w-32 h-48 md:w-48 md:h-72 bg-zinc-900 border border-white/20 shadow-2xl rounded-xl overflow-hidden z-30 transition-all hover:scale-105 group">
                    {camOn && localCameraTrack ? (
                         <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                             <VideoOff size={24} className="text-zinc-600" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 text-[8px] font-mono bg-black/60 px-1.5 py-0.5 rounded text-white backdrop-blur-sm">YOU</div>
                </div>
            </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-8 px-10 flex flex-col gap-6 pointer-events-none">
        
        {showChat && (
            <div className="h-48 w-full md:w-80 self-start pointer-events-auto mb-2 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 bg-black/50">
                <LiveChatOverlay messages={messages} onSendMessage={onSendMessage} />
            </div>
        )}

        <div className="flex items-center justify-center gap-6 md:gap-8 pointer-events-auto">
            <button onClick={() => setMicOn(!micOn)} className={`p-4 md:p-5 rounded-full backdrop-blur-xl border transition-all ${micOn ? "bg-white/10 border-white/10 hover:bg-white/20 text-white" : "bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white"}`}>
                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            
            {/* Only show video toggle if call started as Video, OR allow upgrading (optional, currently strictly following audioOnly prop) */}
            <button onClick={() => setCamOn(!camOn)} disabled={audioOnly} className={`p-4 md:p-5 rounded-full backdrop-blur-xl border transition-all ${camOn ? "bg-white/10 border-white/10 hover:bg-white/20 text-white" : "bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-800"}`}>
                {camOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            <button onClick={() => setShowChat(!showChat)} className={`p-4 md:p-5 rounded-full backdrop-blur-xl border transition-all ${showChat ? "bg-accent text-white border-accent shadow-[0_0_20px_rgba(var(--accent),0.4)]" : "bg-white/10 border-white/10 hover:bg-white/20 text-white"}`}>
                <MessageSquare size={24} />
            </button>

            <button onClick={onSendHeart} className="p-4 md:p-5 bg-pink-500/10 hover:bg-pink-600/20 text-pink-500 hover:text-pink-400 rounded-full backdrop-blur-xl border border-pink-500/30 transition-all active:scale-90">
                <Heart size={24} className="fill-current" />
            </button>

            <button onClick={onLeave} className="p-4 md:p-5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 ml-4">
                <Phone size={24} className="fill-white rotate-[135deg]" />
            </button>
        </div>
      </div>
    </div>
  );
}