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
  Mic,
  MicOff,
  Video,
  VideoOff,
  X,
  MessageSquare,
  Heart,
  Users,
  Monitor,
  MonitorOff,
} from "lucide-react";
import LiveChatOverlay from "./LiveChatOverlay";
import LiveViewerList from "./LiveViewerList";

export default function LiveStage({
  channelName,
  appId,
  token,
  uid,
  isHost, // true if Streamer OR 1:1 Caller/Participant
  onLeave,
  viewers,
  messages,
  hearts,
  onSendMessage,
  onSendHeart,
  audioOnly = false
}) {
  const client = useRTCClient();

  // --- 1. TRACK MANAGEMENT ---
  // Only create tracks if isHost is true (Streamer or Call Participant)
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost);
  const { localCameraTrack } = useLocalCameraTrack(isHost && !audioOnly);
  
  const [screenOn, setScreenOn] = useState(false);
  const { localScreenTrack, error: screenError } = useLocalScreenTrack(screenOn && isHost, {}, "auto");

  const remoteUsers = useRemoteUsers();

  const localVideoRef = useRef(null);
  const localScreenRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [showChat, setShowChat] = useState(true); // Default chat open
  const [showViewers, setShowViewers] = useState(false);

  // --- 2. AGORA LIFECYCLE ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);
  
  // Publish tracks if you are a Host/Participant
  usePublish([localMicrophoneTrack, camOn ? localCameraTrack : null, screenOn ? localScreenTrack : null]);

  // Cleanup Hardware
  useEffect(() => {
    return () => {
      localCameraTrack?.close();
      localMicrophoneTrack?.close();
      localScreenTrack?.close();
    };
  }, [localCameraTrack, localMicrophoneTrack, localScreenTrack]);

  // Screen Share Error Handling
  useEffect(() => {
    if (screenError) setScreenOn(false);
  }, [screenError]);

  // --- 3. HARDWARE TOGGLES ---
  useEffect(() => {
    if (localMicrophoneTrack) localMicrophoneTrack.setMuted(!micOn);
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) localCameraTrack.setEnabled(camOn);
  }, [camOn, localCameraTrack]);

  // --- 4. LAYOUT LOGIC ---
  
  // Scenario A: 1:1 Call Connected (I see Remote User Big, Me Small)
  const isOneToOneConnected = remoteUsers.length > 0 && isHost;
  
  // Scenario B: Channel/Group Viewer (I see Host Big, No Me)
  const isViewer = !isHost && remoteUsers.length > 0;
  
  // Scenario C: I am the Host/Caller but nobody else is here yet (I see Me Big)
  const isSoloHost = isHost && remoteUsers.length === 0;

  // Render Local Video into Ref (Used for PIP or Main depending on scenario)
  useEffect(() => {
    if (localCameraTrack && camOn && localVideoRef.current) {
      localCameraTrack.play(localVideoRef.current);
    }
  }, [localCameraTrack, camOn, isOneToOneConnected, isSoloHost]);

  // Screen Share Playback
  useEffect(() => {
    if (localScreenTrack && screenOn && localScreenRef.current) {
      localScreenTrack.play(localScreenRef.current);
    }
  }, [localScreenTrack, screenOn]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in zoom-in-95 duration-300">
      
      {/* FLOATING HEARTS LAYER */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <AnimatePresence>
          {hearts.map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 1, y: "100%", x: Math.random() * 100 - 50 }}
              animate={{ opacity: 0, y: "20%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute bottom-20 right-10 text-red-500"
            >
              <Heart size={32} fill="currentColor" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 z-40 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent h-32 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-red-600 px-3 py-1 rounded-sm flex items-center gap-2 animate-pulse">
            <span className="text-[10px] font-black uppercase tracking-widest">
                {remoteUsers.length > 0 ? "LIVE_LINK" : "WAITING..."}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-white shadow-black drop-shadow-md">
              {channelName}
            </h3>
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono hover:text-white transition-colors mt-1 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5"
            >
              <Users size={10} /> {viewers.length} Active
            </button>
          </div>
        </div>
        <button
          onClick={onLeave}
          className="p-2 bg-white/10 hover:bg-red-600/80 backdrop-blur-md rounded-full transition-colors pointer-events-auto"
        >
          <X size={20} />
        </button>
      </div>

      {/* VIEWER LIST */}
      {showViewers && (
        <div className="pointer-events-auto z-50">
          <LiveViewerList users={viewers} />
        </div>
      )}

      {/* --- VIDEO STAGE --- */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center">
          
          {/* 1. MAIN SCREEN CONTENT */}
          {/* If Solo Host -> Show Local. If Connected -> Show Remote. */}
          {isSoloHost ? (
             <div className="relative w-full h-full">
                {screenOn ? (
                    <div ref={localScreenRef} className="w-full h-full object-contain bg-zinc-900" />
                ) : (
                    <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }}>
                        {!camOn && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10 gap-2">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                                    <VideoOff size={32} className="text-zinc-600" />
                                </div>
                                <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">Camera Off</span>
                            </div>
                        )}
                    </div>
                )}
             </div>
          ) : remoteUsers.length > 0 ? (
             <div className="relative w-full h-full">
                <RemoteUser user={remoteUsers[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                    {!remoteUsers[0].hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center animate-pulse">
                                <Users size={40} className="text-zinc-500" />
                            </div>
                        </div>
                    )}
                </RemoteUser>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-sm gap-2">
                <div className="w-12 h-12 border-2 border-zinc-700 border-t-accent rounded-full animate-spin" />
                <span>WAITING_FOR_SIGNAL...</span>
             </div>
          )}

          {/* 2. PIP (PICTURE IN PICTURE) - Only for 1:1 Calls when connected */}
          {isOneToOneConnected && (
            <div className="absolute bottom-24 right-4 w-32 h-48 border-2 border-white/20 shadow-2xl bg-black z-20 overflow-hidden rounded-md transition-all hover:scale-105 hover:border-accent">
               {camOn ? (
                   <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }} />
               ) : (
                   <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                       <VideoOff size={20} />
                   </div>
               )}
               <div className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded text-white backdrop-blur-sm">YOU</div>
            </div>
          )}

        </div>
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none p-6">
        {showChat && (
          <div className="h-64 w-full md:w-1/3 mb-4 pointer-events-auto">
            <LiveChatOverlay messages={messages} onSendMessage={onSendMessage} />
          </div>
        )}

        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex gap-4">
            {isHost && (
              <>
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3 rounded-full backdrop-blur-md border transition-all ${micOn ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-red-500 border-red-500 text-white"}`}
                  title="Toggle Mic"
                >
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`p-3 rounded-full backdrop-blur-md border transition-all ${camOn ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-red-500 border-red-500 text-white"}`}
                  title="Toggle Video"
                >
                  {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                  onClick={() => setScreenOn(!screenOn)}
                  className={`p-3 rounded-full backdrop-blur-md border transition-all ${screenOn ? "bg-accent border-accent shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
                  title="Share Screen"
                >
                  {screenOn ? <MonitorOff size={20} /> : <Monitor size={20} />}
                </button>
              </>
            )}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all ${showChat ? "bg-white/20 border-white/40" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
              title="Toggle Chat"
            >
              <MessageSquare size={20} />
            </button>
          </div>
          <button
            onClick={onSendHeart}
            className="p-3 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-full backdrop-blur-md border border-accent/50 transition-all active:scale-90"
            title="Send Love"
          >
            <Heart size={24} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}