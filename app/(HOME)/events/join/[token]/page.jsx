"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { 
  Loader2, ShieldAlert, Clock, ArrowRight, 
  LayoutTemplate, CheckCircle2, Lock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function EventLandingPage({ params }) {
  const { token } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // 1. Fetch Event Details via Secure RPC
        const { data, error } = await supabase
          .rpc('get_event_by_token', { token_input: token });

        if (error || !data) throw new Error("Invalid or Expired Protocol Token.");

        setEvent(data);

        // 2. Check if user already submitted (if multiple not allowed)
        if (user && !data.allow_multiple) {
            const { data: sub } = await supabase
                .from('event_submissions')
                .select('id')
                .eq('event_id', data.id) // data.id comes from RPC
                .eq('project_id', user.id) // This assumes project_id linkage, wait...
                // Correction: We need to check via a join or specific logic. 
                // Since RLS hides other submissions, we can't easily check *this* user's submission 
                // unless we query based on the project owner. 
                // Let's do a safer check:
            
            // Actually, we can check if the user has ANY project linked to this event
            // Note: RLS allows "Creators see own submissions".
            const { count } = await supabase
                .from('event_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', data.id); // RLS will filter to auth.uid() owner automatically
            
            if (count > 0) setExistingSubmission(true);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [token, user]);

  const handleInitiate = () => {
    if (!user) {
        // Redirect to login, then back here
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnTo=${returnUrl}`);
        return;
    }

    if (existingSubmission && !event.allow_multiple) {
        toast.error("Transmission Blocked", { description: "Single submission protocol active." });
        return;
    }

    // Redirect to Create Page with Context
    router.push(`/create?event_token=${token}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-4 text-red-500"><ShieldAlert size={48} /></div>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Connection Terminated</h1>
        <p className="font-mono text-xs text-muted-foreground uppercase">{error}</p>
        <Link href="/">
            <Button variant="outline" className="mt-8 rounded-none border-border font-mono text-xs uppercase">
                Return to Base
            </Button>
        </Link>
    </div>
  );

  // Calculate Status
  const isExpired = event.deadline && new Date(event.deadline) < new Date();
  const isClosed = event.is_closed || isExpired;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      {/* 1. Hero Banner */}
      <div className="relative h-[40vh] w-full bg-black overflow-hidden border-b border-border">
        {event.cover_image ? (
            <Image src={event.cover_image} alt="Cover" fill className="object-cover opacity-60" />
        ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Host Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 p-2 pr-4 rounded-full">
            <Avatar className="h-8 w-8 border border-white/20">
                <AvatarImage src={event.host.avatar} />
                <AvatarFallback>H</AvatarFallback>
            </Avatar>
            <div>
                <p className="text-[10px] font-mono text-zinc-400 uppercase leading-none">Incoming Transmission</p>
                <p className="text-xs font-bold text-white uppercase">{event.host.full_name || event.host.username}</p>
            </div>
        </div>
      </div>

      {/* 2. Content Briefing */}
      <div className="flex-1 container mx-auto px-4 -mt-20 relative z-10 pb-20">
        <div className="max-w-2xl mx-auto bg-card border border-border shadow-2xl p-8 md:p-12 relative overflow-hidden group">
            
            {/* Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: event.accent_color }} />

            <div className="mb-8">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                    {event.title}
                </h1>
                <p className="text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description || "No directive provided. Prepare your submission according to standard protocols."}
                </p>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 border-y border-border border-dashed py-6">
                <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                        <Clock size={12} /> Deadline
                    </span>
                    <p className={`text-sm font-bold uppercase ${isExpired ? 'text-red-500' : 'text-foreground'}`}>
                        {event.deadline ? new Date(event.deadline).toLocaleDateString() : "Open Indefinitely"}
                    </p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
                        <LayoutTemplate size={12} /> Format
                    </span>
                    <p className="text-sm font-bold uppercase text-foreground">
                        {event.allow_multiple ? "Multiple Entries" : "Single Entry"}
                    </p>
                </div>
            </div>

            {/* Action Area */}
            {isClosed ? (
                <div className="bg-red-500/5 border border-red-500/20 p-4 flex items-center justify-center gap-2 text-red-500 font-mono text-xs uppercase font-bold">
                    <Lock size={14} /> Submissions Closed
                </div>
            ) : existingSubmission && !event.allow_multiple ? (
                <div className="bg-green-500/5 border border-green-500/20 p-4 flex items-center justify-center gap-2 text-green-600 font-mono text-xs uppercase font-bold">
                    <CheckCircle2 size={14} /> Submission Logged
                </div>
            ) : (
                <Button 
                    onClick={handleInitiate}
                    className="w-full h-14 text-base font-bold uppercase tracking-widest rounded-none shadow-lg hover:shadow-xl transition-all"
                    style={{ backgroundColor: event.accent_color, color: '#ffffff' }}
                >
                    Initiate Submission <ArrowRight className="ml-2" />
                </Button>
            )}

            {!user && !isClosed && (
                <p className="text-center text-[10px] font-mono text-muted-foreground mt-4 uppercase">
                    *Auth Required to Proceed
                </p>
            )}

        </div>
      </div>
    </div>
  );
}