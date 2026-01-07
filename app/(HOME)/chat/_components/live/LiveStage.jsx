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
  isHost,             // True if Streamer OR Caller
  isCallParticipant,  // True if this is a 1:1 Call (not a broadcast)
  onLeave,
  viewers,
  messages,
  hearts,
  onSendMessage,
  onSendHeart,
  audioOnly
}) {
  const client = useRTCClient();

  // --- 1. TRACK MANAGEMENT ---
  // In Broadcast: Only Host publishes.
  // In 1:1 Call: EVERYONE publishes (Caller & Receiver).
  const shouldPublish = isHost || isCallParticipant;

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(shouldPublish);
  const { localCameraTrack } = useLocalCameraTrack(shouldPublish && !audioOnly);
  
  const [screenOn, setScreenOn] = useState(false);
  const { localScreenTrack, error: screenError } = useLocalScreenTrack(screenOn && shouldPublish, {}, "auto");

  const remoteUsers = useRemoteUsers();

  const localVideoRef = useRef(null);
  const localScreenRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!audioOnly);
  const [showChat, setShowChat] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  // --- 2. AGORA LIFECYCLE ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);
  
  // Publish tracks if you are a Host or Call Participant
  usePublish([localMicrophoneTrack, camOn ? localCameraTrack : null, screenOn ? localScreenTrack : null]);

  // Cleanup Hardware on Unmount
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

  // --- 4. LAYOUT LOGIC (The "Black Screen" Fix) ---
  
  const isOneToOne = isCallParticipant;
  const isConnected = remoteUsers.length > 0;
  
  // RENDER LOCAL VIDEO
  // We need to play the local video into the ref whenever the track exists and is enabled
  useEffect(() => {
    if (localCameraTrack && camOn && localVideoRef.current) {
      try {
        if (localCameraTrack.isPlaying) localCameraTrack.stop();
        localCameraTrack.play(localVideoRef.current);
      } catch (e) {
        console.error("Local Video Play Error:", e);
      }
    }
  }, [localCameraTrack, camOn, isConnected, isOneToOne]);

  // RENDER SCREEN SHARE
  useEffect(() => {
    if (localScreenTrack && screenOn && localScreenRef.current) {
        localScreenTrack.play(localScreenRef.current);
    }
  }, [localScreenTrack, screenOn]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col animate-in zoom-in-95 duration-300">
      
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
                {isConnected ? "LIVE_LINK" : "WAITING..."}
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
      <div className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
        
        {/* SCENARIO 1: WAITING (Solo) */}
        {!isConnected && (
            <div className="relative w-full h-full">
                {/* If I'm the host/caller, show ME full screen while waiting */}
                {shouldPublish ? (
                    screenOn ? (
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
                    )
                ) : (
                    // I am a viewer waiting for host
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-sm gap-2">
                        <div className="w-12 h-12 border-2 border-zinc-700 border-t-accent rounded-full animate-spin" />
                        <span>WAITING_FOR_HOST...</span>
                    </div>
                )}

                {/* Overlay Waiting Message */}
                {shouldPublish && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-xl flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                            <span className="text-xs font-mono uppercase tracking-widest">
                                {isOneToOne ? "Calling..." : "Starting Stream..."}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* SCENARIO 2: CONNECTED (Remote Exists) */}
        {isConnected && (
            <>
                {/* A. REMOTE USER (FULL SCREEN) */}
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

                {/* B. LOCAL USER (PIP) - Only if 1:1 Call or Host */}
                {shouldPublish && (
                    <div className="absolute bottom-24 right-4 w-32 h-48 bg-black border border-white/20 shadow-2xl rounded-lg overflow-hidden z-20 transition-all hover:scale-105 hover:border-accent">
                        {camOn ? (
                            <div ref={localVideoRef} className="w-full h-full object-cover" style={{ transform: "rotateY(180deg)" }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                                <VideoOff size={24} />
                            </div>
                        )}
                        <div className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded text-white backdrop-blur-sm">YOU</div>
                    </div>
                )}
            </>
        )}

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
            {shouldPublish && (
              <>
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3 rounded-full backdrop-blur-md border ${micOn ? "bg-white/10 border-white/20" : "bg-red-500 border-red-500"}`}
                  title="Toggle Mic"
                >
                  {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`p-3 rounded-full backdrop-blur-md border ${camOn ? "bg-white/10 border-white/20" : "bg-red-500 border-red-500"}`}
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
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20"
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