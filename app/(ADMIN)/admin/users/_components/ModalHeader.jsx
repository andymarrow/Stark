"use client";
import Image from "next/image";
import Link from "next/link";
import { Shield, X, ExternalLink } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";

export default function ModalHeader({ user }) {
  return (
    <div className="p-6 border-b border-white/10 bg-zinc-900/30 flex justify-between items-start">
        <div className="flex gap-5">
            <div className="relative w-20 h-20 border border-white/10 bg-zinc-900 overflow-hidden">
                <Image src={user.avatar_url || "/placeholder.jpg"} alt={user.username} fill className="object-cover" />
                <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-black ${user.role === 'banned' ? 'bg-red-500' : 'bg-green-500'}`} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {user.full_name || user.username}
                    {user.role === 'admin' && <Shield size={16} className="text-red-500" />}
                </h2>
                <Link href={`/profile/${user.username}`} target="_blank" className="text-zinc-500 font-mono text-sm mb-2 hover:text-white flex items-center gap-1 group">
                    @{user.username} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="flex gap-2 mt-1">
                    <Badge label={`ID: ${user.id.substring(0, 8)}...`} />
                    <Badge label={user.role} color={user.role === 'admin' ? 'red' : user.role === 'banned' ? 'red' : 'blue'} />
                </div>
            </div>
        </div>
        <DialogClose asChild>
            <button className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </DialogClose>
    </div>
  );
}

function Badge({ label, color }) {
    const style = color === 'blue' ? 'text-blue-400 border-blue-900/50 bg-blue-900/10' : 
                  color === 'red' ? 'text-red-500 border-red-900/50 bg-red-900/10' : 
                  'text-zinc-500 border-zinc-800 bg-zinc-900';
    return <span className={`text-[10px] px-2 py-0.5 border font-mono uppercase tracking-wider ${style}`}>{label}</span>;
}