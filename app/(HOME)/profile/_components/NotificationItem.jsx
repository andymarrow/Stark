"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Heart, UserPlus, MessageSquare, Info, ShieldAlert, Trophy, 
  GitCommit, Zap, Check, CheckCheck, ArrowRightLeft, Eye, 
  ShieldCheck, AlertTriangle, FileCode, Handshake, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getAvatar } from "@/constants/assets";

export default function NotificationItem({ notification, onRead, onUpdateState, currentUserId }) {
  const [processing, setProcessing] = useState(false);
  const isRead = notification.is_read;

  // --- ACTIONS ---

  const handleFollowBack = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('follows').insert({ 
          follower_id: currentUserId, 
          following_id: notification.sender_id 
      });
      if (error && error.code !== '23505') throw error; 
      
      toast.success("Handshake Established");
      onUpdateState(notification.id, { is_read: true, message: "accepted your connection request." });
      onRead(notification.id);
    } catch (err) {
      toast.error("Action Failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptCollab = async () => {
    setProcessing(true);
    try {
        // 1. Get Project ID from the slug in the link
        const slug = notification.link?.split('/').pop();
        if (!slug) throw new Error("Invalid Project Link");

        const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!project) throw new Error("Project Not Found");

        // 2. Update Collaboration Status
        const { error } = await supabase
            .from('collaborations')
            .update({ status: 'accepted' })
            .eq('project_id', project.id)
            .eq('user_id', currentUserId);

        if (error) throw error;

        toast.success("Collaboration Initialized", { description: "Node added to project team." });
        onRead(notification.id); // Mark notification as read
        onUpdateState(notification.id, { is_read: true, message: "You are now a collaborator on this project." });
        
    } catch (err) {
        console.error(err);
        toast.error("Handshake Failed", { description: "Could not join the project team." });
    } finally {
        setProcessing(false);
    }
  };

  const handleRejectCollab = async () => {
    setProcessing(true);
    try {
        const slug = notification.link?.split('/').pop();
        const { data: project } = await supabase.from('projects').select('id').eq('slug', slug).single();

        if (project) {
            await supabase
                .from('collaborations')
                .delete() // We delete the pending row if rejected
                .eq('project_id', project.id)
                .eq('user_id', currentUserId);
        }

        toast.info("Invite Declined");
        onRead(notification.id);
    } catch (err) {
        toast.error("Command Failed");
    } finally {
        setProcessing(false);
    }
  };

  // --- RENDER HELPERS ---

  const getIcon = () => {
    const props = { size: 14 };
    const isMention = notification.type === 'system' && notification.message?.toLowerCase().includes('mentioned');
    if (isMention) return <FileCode {...props} className="text-accent" />;

    switch(notification.type) {
        case 'like': return <Heart {...props} className={isRead ? "text-zinc-600" : "text-red-500 fill-red-500"} />;
        case 'follow': return <UserPlus {...props} className={isRead ? "text-zinc-600" : "text-blue-500"} />;
        case 'chat_request': return <MessageSquare {...props} className={isRead ? "text-zinc-600" : "text-emerald-500"} />;
        case 'request_accepted': return <ShieldCheck {...props} className="text-green-500" />;
        case 'changelog_update': return <GitCommit {...props} className={isRead ? "text-zinc-600" : "text-amber-500"} />;
        case 'collab_invite': return <Handshake {...props} className={isRead ? "text-zinc-600" : "text-indigo-500"} />;
        case 'contest_winner': return <Trophy {...props} className="text-yellow-500" />;
        case 'project_milestone': return <Zap {...props} className="text-purple-500" />;
        case 'report_resolved': return <ShieldAlert {...props} className="text-orange-500" />;
        case 'content_takedown': return <AlertTriangle {...props} className="text-red-600" />;
        default: return <Info {...props} className="text-zinc-500" />;
    }
  };

  const getAction = () => {
    if (isRead) return null;

    // 1. Follow Back
    if (notification.type === 'follow') {
        return (
            <Button 
                onClick={handleFollowBack} disabled={processing}
                variant="outline" className="h-7 text-[10px] uppercase font-mono border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white"
            >
                {processing ? <Loader2 size={10} className="animate-spin" /> : "Connect Back"}
            </Button>
        );
    }
    // 2. Collab Invite (ACCEPT / REJECT)
    if (notification.type === 'collab_invite') {
        return (
            <div className="flex gap-2">
                <Button 
                    onClick={handleAcceptCollab} disabled={processing}
                    className="h-7 text-[10px] uppercase font-mono bg-accent hover:bg-red-700 text-white rounded-none"
                >
                    {processing ? <Loader2 size={10} className="animate-spin" /> : "Accept"}
                </Button>
                <Button 
                    onClick={handleRejectCollab} disabled={processing}
                    variant="outline" className="h-7 text-[10px] uppercase font-mono border-border hover:bg-secondary text-muted-foreground hover:text-foreground rounded-none"
                >
                    <X size={12} className="mr-1" /> Decline
                </Button>
            </div>
        );
    }
    // 3. View Button (Generic)
    if (notification.link && notification.link !== '#') {
        return (
            <Link href={notification.link}>
                <Button variant="ghost" className="h-7 w-7 p-0 border border-transparent hover:border-border transition-colors">
                    <Eye size={14} className="text-muted-foreground hover:text-accent" />
                </Button>
            </Link>
        );
    }
    return null;
  };

  return (
    <div className={`
        flex items-start gap-3 p-3 border border-border bg-background transition-all group relative
        ${!isRead 
            ? 'border-l-2 border-l-accent bg-accent/[0.02] shadow-[inset_0_0_10px_rgba(0,0,0,0.02)]' 
            : 'opacity-70 hover:opacity-100'}
    `}>
        
        <div className="relative mt-1">
            {notification.sender_id === notification.receiver_id ? ( 
                <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                </div>
            ) : (
                <Link href={`/profile/${notification.sender?.username}`} className="block relative w-8 h-8 border border-border bg-secondary overflow-hidden">
                    <Image 
                        src={getAvatar(notification.sender)} 
                        alt="User" 
                        fill 
                        className="object-cover"
                    />
                </Link>
            )}
            
            <div className="absolute -bottom-1 -right-1 bg-background p-0.5 border border-border rounded-full">
                {getIcon()}
            </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-start gap-2">
                <p className="text-xs text-foreground leading-snug">
                    {notification.sender?.username && (
                        <Link href={`/profile/${notification.sender.username}`}>
                            <span className="font-bold mr-1 hover:text-accent cursor-pointer">
                                @{notification.sender.username}
                            </span>
                        </Link>
                    )}
                    <span className={isRead ? "text-muted-foreground" : "text-foreground"}>
                        {notification.message}
                    </span>
                </p>
                <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap mt-0.5">
                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider bg-secondary/30 px-1.5 py-0.5 rounded-sm">
                        {notification.type === 'system' && notification.message.includes('mentioned') ? 'Mention' : notification.type.replace('_', ' ')}
                    </span>
                    {!isRead && (
                        <span className="w-1 h-1 bg-accent rounded-full animate-ping" />
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    {getAction()}
                    
                    {!isRead && (
                        <button 
                            onClick={() => onRead(notification.id)}
                            className="text-zinc-400 hover:text-accent transition-colors p-1"
                            title="Acknowledge Signal"
                        >
                            <Check size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}