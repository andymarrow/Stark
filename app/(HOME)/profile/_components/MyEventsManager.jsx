"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Loader2, ArrowRight, Copy, Check, Lock, Globe, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CreateEventModal from "./CreateEventModal";
import Link from "next/link";
import Image from "next/image";

// 1. Accept 'profile' prop
export default function MyEventsManager({ user, profile }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // 2. Update Permission Logic
  // We check the DB Profile for 'admin' role or 'verified' status
  const canCreate = profile?.role === 'admin' || profile?.is_verified; 

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });
    
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const copyLink = (token) => {
    const link = `${window.location.origin}/events/join/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(token);
    toast.success("Secure Link Copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Hosted Protocols</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">Manage your private showcases and hackathons.</p>
        </div>
        
        <Button 
            onClick={() => setIsModalOpen(true)}
            disabled={!canCreate}
            className="h-10 bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Plus size={14} className="mr-2" /> Initialize Event
        </Button>
      </div>

      {!canCreate && (
        <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 font-mono text-xs flex items-center justify-center gap-2">
            <ShieldAlert size={14} />
            <span>ACCESS_DENIED: Verification Badge Required to Host Events.</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
      ) : events.length === 0 ? (
        <div className="py-20 border border-dashed border-border text-center flex flex-col items-center justify-center gap-4 bg-secondary/5">
            <p className="text-xs font-mono uppercase text-muted-foreground">No active event nodes detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
                <div key={event.id} className="group border border-border bg-card hover:border-accent transition-all duration-300 flex flex-col md:flex-row">
                    
                    <div className="relative w-full md:w-48 aspect-video md:aspect-auto bg-secondary border-b md:border-b-0 md:border-r border-border overflow-hidden">
                        {event.cover_image ? (
                            <Image src={event.cover_image} alt={event.title} fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-bold uppercase text-xs">
                                No Signal
                            </div>
                        )}
                        <div className="absolute top-2 left-2">
                            {event.is_public ? (
                                <span className="bg-green-500 text-white text-[8px] font-mono px-1.5 py-0.5 uppercase flex items-center gap-1">
                                    <Globe size={8} /> Public
                                </span>
                            ) : (
                                <span className="bg-black/80 text-white text-[8px] font-mono px-1.5 py-0.5 uppercase flex items-center gap-1">
                                    <Lock size={8} /> Private
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                                {event.title}
                            </h3>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mt-2">
                                <span>Token: {event.access_token.substring(0, 8)}...</span>
                                <span>Deadline: {event.deadline ? new Date(event.deadline).toLocaleDateString() : "Open"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4 md:mt-0 pt-4 md:pt-0">
                            {/* We will build this dashboard page next */}
                            <Link href={`/events/${event.id}/dashboard`} className="flex-1">
                                <Button 
                                    className="w-full h-9 rounded-none bg-foreground text-background hover:bg-accent hover:text-white transition-all duration-200 font-mono text-[10px] uppercase tracking-widest shadow-sm"
                                >
                                    Manage Console <ArrowRight size={12} className="ml-2" />
                                </Button>
                            </Link>
                            
                            <Button 
                                onClick={() => copyLink(event.access_token)}
                                variant="outline" 
                                className="h-9 w-9 p-0 rounded-none border-border bg-background hover:bg-secondary text-foreground transition-colors"
                                title="Copy Submission Link"
                            >
                                {copiedId === event.access_token ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchEvents} 
      />
    </div>
  );
}