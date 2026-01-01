"use client";
import { 
  LocalUser, 
  RemoteUser, 
  useJoin, 
  useLocalCameraTrack, 
  useLocalMicrophoneTrack, 
  usePublish, 
  useRemoteUsers, 
  useRTCClient
} from "agora-rtc-react";
import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, X, MessageSquare, Heart, Users } from "lucide-react";

export default function LiveStage({ channelName, appId, token, uid, isHost, onLeave }) {
  // Agora Hooks
  const client = useRTCClient();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isHost);
  const { localCameraTrack } = useLocalCameraTrack(isHost);
  const remoteUsers = useRemoteUsers();

  // Controls State
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showChat, setShowChat] = useState(true);

  // 1. Join the Channel
  useJoin({ appid: appId, channel: channelName, token, uid: uid }, true);

  // 2. Publish Tracks (Only if Host)
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Toggle Logic
  useEffect(() => {
    if (localMicrophoneTrack) localMicrophoneTrack.setMuted(!micOn);
  }, [micOn, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack) localCameraTrack.setEnabled(camOn);
  }, [camOn, localCameraTrack]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in zoom-in-95 duration-300">
      
      {/* --- HEADER OVERLAY --- */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent h-32">
        <div className="flex items-center gap-3">
            <div className="bg-red-600 px-3 py-1 rounded-sm flex items-center gap-2 animate-pulse">
                <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
            </div>
            <div>
                <h3 className="text-sm font-bold font-mono uppercase text-white shadow-black drop-shadow-md">
                    {channelName}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono">
                    <Users size={10} /> {remoteUsers.length + 1} Connected
                </div>
            </div>
        </div>

        <button 
            onClick={onLeave}
            className="p-2 bg-white/10 hover:bg-red-600/80 backdrop-blur-md rounded-full transition-colors"
        >
            <X size={20} />
        </button>
      </div>

      {/* --- VIDEO GRID --- */}
      <div className="flex-1 relative overflow-hidden">
        {/* Main Stage (Full Screen) */}
        <div className="absolute inset-0">
            {isHost ? (
                <LocalUser
                    audioTrack={localMicrophoneTrack}
                    cameraTrack={localCameraTrack}
                    micOn={micOn}
                    videoOn={camOn}
                    cover="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000"
                    className="w-full h-full object-cover"
                />
            ) : (
                // If Audience: Show Host (Remote) as Big
                // We assume the first remote user found is the host for simplicity in v1
                remoteUsers.length > 0 ? (
                    <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">
                        WAITING_FOR_SIGNAL...
                    </div>
                )
            )}
        </div>

        {/* Co-Host / Grid (Floating Bottom Right) */}
        {/* If there are multiple speakers, show them in small floating windows */}
        {remoteUsers.length > 0 && isHost && (
            <div className="absolute bottom-24 right-4 w-32 h-48 border-2 border-white/20 shadow-2xl bg-black z-10">
                <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
            </div>
        )}
      </div>

      {/* --- CONTROLS OVERLAY --- */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        
        {/* Simulated Chat Bubbles */}
        {showChat && (
            <div className="h-48 w-full md:w-1/3 mb-4 flex flex-col justify-end space-y-2 mask-image-gradient pointer-events-none">
                <div className="text-sm font-mono text-white/80"><span className="font-bold text-accent">@alex:</span> Looking sharp! 🔥</div>
                <div className="text-sm font-mono text-white/80"><span className="font-bold text-blue-400">@sarah:</span> Can you show the code?</div>
                <div className="text-sm font-mono text-white/80"><span className="font-bold text-green-400">@mike:</span> Joined the stream.</div>
            </div>
        )}

        <div className="flex items-center justify-between">
            <div className="flex gap-4">
                {isHost && (
                    <>
                        <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full backdrop-blur-md border ${micOn ? 'bg-white/10 border-white/20' : 'bg-red-500 border-red-500'}`}>
                            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button onClick={() => setCamOn(!camOn)} className={`p-3 rounded-full backdrop-blur-md border ${camOn ? 'bg-white/10 border-white/20' : 'bg-red-500 border-red-500'}`}>
                            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                    </>
                )}
                <button onClick={() => setShowChat(!showChat)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20">
                    <MessageSquare size={20} />
                </button>
            </div>

            {/* Reactions */}
            <button className="p-3 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-full backdrop-blur-md border border-accent/50 transition-all active:scale-90">
                <Heart size={24} className="fill-current" />
            </button>
        </div>
      </div>

    </div>
  );
}