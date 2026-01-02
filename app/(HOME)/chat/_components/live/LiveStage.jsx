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
  isHost,
  onLeave,
  viewers,
  messages,
  hearts,
  onSendMessage,
  onSendHeart,
}) {
  const client = useRTCClient();

  // --- 1. TRACK MANAGEMENT ---
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost);
  const { localCameraTrack } = useLocalCameraTrack(isHost);
  
  const [screenOn, setScreenOn] = useState(false);
  const { localScreenTrack, error: screenError } = useLocalScreenTrack(screenOn && isHost, {}, "auto");

  const remoteUsers = useRemoteUsers();

  const localVideoRef = useRef(null);
  const localScreenRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showViewers, setShowViewers] = useState(false);

  // --- 2. AGORA LIFECYCLE ---
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);
  usePublish([localMicrophoneTrack, localCameraTrack, localScreenTrack]);

  // CRITICAL FIX: Explicit Hardware Disposal on Unmount
  // This ensures the camera light actually goes off when clicking "X"
  useEffect(() => {
    return () => {
      console.log("🛑 Terminating Session: Releasing Hardware...");
      if (localCameraTrack) {
        localCameraTrack.stop();
        localCameraTrack.close();
      }
      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }
      if (localScreenTrack) {
        localScreenTrack.stop();
        localScreenTrack.close();
      }
    };
  }, [localCameraTrack, localMicrophoneTrack, localScreenTrack]);

  // Handle Screen Share Error/Cancel
  useEffect(() => {
    if (screenError) {
      setScreenOn(false);
    }
  }, [screenError]);

  // --- 3. RENDERING LOGIC ---

  // Camera Playback
  useEffect(() => {
    if (isHost && localCameraTrack && camOn) {
      const timer = setTimeout(() => {
        if (localVideoRef.current) localCameraTrack.play(localVideoRef.current);
      }, 100);
      return () => {
        clearTimeout(timer);
        localCameraTrack.stop();
      };
    }
  }, [isHost, localCameraTrack, camOn, screenOn]);

  // Screen Playback
  useEffect(() => {
    if (isHost && localScreenTrack && screenOn) {
      const timer = setTimeout(() => {
        if (localScreenRef.current) localScreenTrack.play(localScreenRef.current);
      }, 200);

      localScreenTrack.on("track-ended", () => setScreenOn(false));
      return () => {
        clearTimeout(timer);
        localScreenTrack.stop();
      };
    }
  }, [isHost, localScreenTrack, screenOn]);

  // Hardware Toggles
  useEffect(() => {
    if (localMicrophoneTrack) {
      try { localMicrophoneTrack.setMuted(!micOn); } catch (e) {}
    }
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) {
      try { localCameraTrack.setEnabled(camOn); } catch (e) {}
    }
  }, [camOn, localCameraTrack]);

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
            <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-white shadow-black drop-shadow-md">
              {channelName}
            </h3>
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono hover:text-white transition-colors mt-1 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5"
            >
              <Users size={10} /> {viewers.length} Connected
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

      {/* VIDEO GRID */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center">
          {isHost ? (
            <div className="relative w-full h-full">
              {screenOn ? (
                <div ref={localScreenRef} className="w-full h-full bg-black flex items-center justify-center" style={{ objectFit: 'contain' }} />
              ) : (
                <div ref={localVideoRef} className="w-full h-full" style={{ transform: "rotateY(180deg)" }}>
                  {!camOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10" style={{ transform: "rotateY(180deg)" }}>
                      <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <VideoOff size={32} />
                        <span className="font-mono text-xs uppercase tracking-widest">Camera Paused</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {screenOn && camOn && (
                <div className="absolute bottom-24 right-4 w-32 h-48 border-2 border-white/20 shadow-2xl bg-black z-10 overflow-hidden rounded-md">
                   <div ref={localVideoRef} className="w-full h-full" style={{ transform: "rotateY(180deg)" }} />
                </div>
              )}
            </div>
          ) : (
            remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 font-mono text-sm gap-2">
                <div className="w-12 h-12 border-2 border-zinc-700 border-t-accent rounded-full animate-spin" />
                <span>WAITING_FOR_SIGNAL...</span>
              </div>
            )
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