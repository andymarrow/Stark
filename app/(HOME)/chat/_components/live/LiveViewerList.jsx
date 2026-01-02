"use client";
import { Users, Shield } from "lucide-react";
import Image from "next/image";

export default function LiveViewerList({ users }) {
  return (
    <div className="absolute top-20 right-4 w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-sm p-4 animate-in slide-in-from-right-4 z-50 shadow-2xl">
        <h4 className="text-[10px] font-mono uppercase text-zinc-400 mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
            <Users size={12} /> Audience ({users.length})
        </h4>
        
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {users.map((user, i) => (
                <div key={user.user_id + i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                            {user.avatar_url ? (
                                <Image src={user.avatar_url} alt={user.username} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                                    {user.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-white font-bold truncate max-w-[100px]">{user.username}</span>
                            {user.is_host && <span className="text-[9px] text-red-500 font-mono uppercase">Host</span>}
                        </div>
                    </div>
                </div>
            ))}
            {users.length === 0 && (
                <p className="text-[9px] text-zinc-600 font-mono italic text-center py-2">No active signals.</p>
            )}
        </div>
    </div>
  );
}