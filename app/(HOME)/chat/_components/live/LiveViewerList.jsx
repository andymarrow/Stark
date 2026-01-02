"use client";
import { Users } from "lucide-react";
import Image from "next/image";

export default function LiveViewerList({ users }) {
  // users array comes from Agora's remoteUsers or a Supabase presence channel
  // For V1, we simulate using the Agora remoteUsers array which contains basic connection info.
  // In V2, you would sync this with Supabase 'profiles' table to get real names/avatars.

  return (
    <div className="absolute top-20 right-4 w-48 bg-black/80 backdrop-blur-md border border-white/10 rounded-sm p-4 animate-in slide-in-from-right-4 z-50">
        <h4 className="text-[10px] font-mono uppercase text-zinc-400 mb-3 flex items-center gap-2">
            <Users size={12} /> Audience ({users.length})
        </h4>
        
        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {users.map((user, i) => (
                <div key={user.uid} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-mono text-white">
                        {/* Placeholder for User Avatar */}
                        U{user.uid.toString().slice(-2)}
                    </div>
                    <span className="text-xs text-zinc-300 truncate">
                        User_{user.uid}
                    </span>
                </div>
            ))}
            {users.length === 0 && (
                <p className="text-[9px] text-zinc-600 font-mono italic">Waiting for signal...</p>
            )}
        </div>
    </div>
  );
}