"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpRight, Loader2, Users, UserPlus, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function NetworkRegistry({ 
    isOpen, 
    onClose, 
    type, 
    connections, 
    loading 
}) {
  const [search, setSearch] = useState("");

  // Local Filter Logic
  const filtered = connections.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) || 
    c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border border-border p-0 rounded-none overflow-hidden gap-0 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.2)]">
        
        {/* --- HEADER --- */}
        <DialogHeader className="p-6 border-b border-border bg-secondary/10 relative">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-accent animate-pulse" />
                        <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] font-bold">
                            Consensus_Link_Active
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                        {type === 'followers' ? <Users size={24}/> : <UserPlus size={24}/>}
                        {type === 'followers' ? "Node_Followers" : "Following_Registry"}
                    </DialogTitle>
                </div>
                {/* No manual close button here to avoid duplicate X */}
            </div>

            {/* Registry Search */}
            <div className="relative mt-8 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input 
                    type="text" 
                    placeholder="SEARCH_REGISTRY_INPUT..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-10 bg-background border border-border focus:border-accent outline-none text-xs font-mono uppercase tracking-widest transition-all placeholder:text-muted-foreground/30"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground hidden md:block">
                    RECORDS: {filtered.length}
                </div>
            </div>
        </DialogHeader>

        {/* --- BODY: THE NODE LIST --- */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar bg-background">
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="animate-spin text-accent" size={32} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Synchronizing_Registry...</span>
                </div>
            ) : filtered.length > 0 ? (
                <div className="divide-y divide-border">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((conn, idx) => (
                            <motion.div
                                key={conn.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <Link 
                                    href={`/profile/${conn.username}`}
                                    onClick={onClose}
                                    className="group flex items-center justify-between p-4 hover:bg-secondary/20 transition-all border-l-2 border-transparent hover:border-accent"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar Container */}
                                        <div className="relative w-14 h-14 bg-secondary border border-border overflow-hidden p-1">
                                            <div className="relative w-full h-full overflow-hidden">
                                                <Image 
                                                    src={conn.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                                                    alt={conn.username} 
                                                    fill 
                                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                                                />
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-sm truncate uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                                                    {conn.full_name || conn.username}
                                                </h4>
                                                {conn.role === 'admin' && <ShieldCheck size={12} className="text-purple-500" />}
                                            </div>
                                            <p className="text-[10px] font-mono text-accent uppercase tracking-tighter mb-1">
                                                @{conn.username}
                                            </p>
                                            {/* BIO REPLACES CREATOR ROLE HERE */}
                                            <p className="text-[10px] text-muted-foreground line-clamp-1 font-light italic max-w-[280px]">
                                                {conn.bio || "No_Bio_Protocol_Established"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-2 py-0.5 bg-secondary text-[8px] font-mono text-muted-foreground border border-border uppercase">
                                            {conn.is_for_hire ? "HIREABLE" : "SYNCED"}
                                        </div>
                                        <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="py-20 text-center border border-dashed border-border m-4 flex flex-col items-center gap-3">
                    <Users size={32} className="text-muted-foreground/20" />
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                        Zero_Signals_Detected
                    </p>
                </div>
            )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-3 border-t border-border bg-secondary/5 flex justify-between items-center px-6">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
                Secure_Registry_Link_V1
            </span>
            <div className="flex gap-1.5">
                <div className="w-1 h-1 bg-green-500 rounded-full" />
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}