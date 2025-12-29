"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  MessageSquare, 
  Github, 
  Twitter, 
  Linkedin, 
  MoreHorizontal, 
  Flag, 
  AlertTriangle, 
  Loader2,
  Lock,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ProfileHeader({ user, currentUser }) {
  const router = useRouter();
   // 1. DERIVED STATE: CHECK OWNERSHIP
  const isOwner = currentUser?.id === user?.id;
  
  // Connection States
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [isInitializingChat, setIsInitializingChat] = useState(false);
  
  // UI States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMessageGateOpen, setIsMessageGateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form States
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");

  // 1. Check Connection Status (Handshake logic)
  useEffect(() => {
    if (currentUser && user?.id) {
      const checkConnection = async () => {
        setIsCheckingConnection(true);
        try {
            const [iFollowReq, theyFollowReq] = await Promise.all([
                supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', user.id).maybeSingle(),
                supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', currentUser.id).maybeSingle()
            ]);
            setIsFollowing(!!iFollowReq.data);
            setFollowsMe(!!theyFollowReq.data);
        } catch (error) {
            console.error("Handshake check failed:", error);
        } finally {
            setIsCheckingConnection(false);
        }
      };
      checkConnection();
    } else {
      setIsCheckingConnection(false);
    }
  }, [currentUser, user?.id]);

  /**
   * 2. Handle Messaging (Find or Create Logic)
   */
  const handleMessageClick = async () => {
    if (!currentUser) return toast.error("Authentication Required");
    
    // Gating check
    if (!isFollowing || !followsMe) {
      setIsMessageGateOpen(true);
      return;
    }

    setIsInitializingChat(true);

    try {
        // 1. Find existing conversations for current user
        const { data: myParticipations, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (partError) throw partError;

        const myConvIds = (myParticipations || []).map(p => p.conversation_id);
        let existingRoomId = null;

        // 2. Check if the target user is in any of those conversations
        if (myConvIds.length > 0) {
           const { data: commonRoom, error: roomError } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .in('conversation_id', myConvIds)
              .eq('user_id', user.id)
              .maybeSingle();
            
           if (!roomError && commonRoom) {
               existingRoomId = commonRoom.conversation_id;
           }
        }

        if (existingRoomId) {
            router.push(`/chat?id=${existingRoomId}`);
        } else {
            // 3. Create a new conversation
            const { data: newRoom, error: createError } = await supabase
                .from('conversations')
                .insert({ last_message: 'Encrypted handshake initiated.' })
                .select()
                .single();

            if (createError) throw createError;

            // 4. Add both users to the participants list
            const { error: joinError } = await supabase
                .from('conversation_participants')
                .insert([
                    { conversation_id: newRoom.id, user_id: currentUser.id },
                    { conversation_id: newRoom.id, user_id: user.id }
                ]);

            if (joinError) throw joinError;

            router.push(`/chat?id=${newRoom.id}`);
        }
    } catch (err) {
        console.error("Critical Chat Init Error:", err);
        toast.error("Initialization Failed", { description: "The encrypted channel could not be established." });
    } finally {
        setIsInitializingChat(false);
    }
  };

  // 3. Handle Follow Toggle
  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Authentication Required", { description: "Login to establish network links." });
      return;
    }
    
    const prevStatus = isFollowing;
    setIsFollowing(!prevStatus);

    try {
      if (prevStatus) {
        await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', user.id);
        toast.info(`Disconnected from @${user.username}`);
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: user.id });
        toast.success(`Connection established with @${user.username}`);
      }
    } catch (err) {
      setIsFollowing(prevStatus);
      toast.error("Handshake Failed");
    }
  };

  // 4. Handle Report
  const handleReportSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        target_user_id: user.id,
        reason: reportReason,
        details: reportDetails
      });

      if (error) throw error;

      toast.success("Incident Logged", { description: "Moderators have been notified." });
      setIsReportOpen(false);
    } catch (err) {
      toast.error("Transmission Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Share
  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link Copied", { description: "Profile URL copied to clipboard." });
    }
  };

  if (!user) return null;

  return (
    <div className="w-full bg-background border border-border relative overflow-hidden group mb-6">
      
      {/* 
        ========================================
        1. CINEMATIC BANNER AREA
        ========================================
      */}
      <div className="h-48 md:h-64 w-full relative bg-secondary/30 overflow-hidden">
        {user.banner_url ? (
            <Image 
                src={user.banner_url} 
                alt="Profile Banner" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
            />
        ) : (
             // Fallback Pattern if no banner is set
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-50" />
        )}
        
        {/* Gradient Overlay for Text Readability & Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Decorative shape if no banner */}
        {!user.banner_url && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/50 rounded-bl-[100px] -mr-12 -mt-12 pointer-events-none z-0" />
        )}
      </div>

      {/* 
        ========================================
        2. CONTENT LAYER (Overlapping Banner)
        ========================================
      */}
      <div className="px-6 md:px-10 pb-10 -mt-20 relative z-10">
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            
            {/* AVATAR SECTION (Overlaps the Banner) */}
            <div className="flex-shrink-0 relative">
                <div className="w-32 h-32 md:w-40 md:h-40 relative border-4 border-background bg-secondary shadow-xl">
                    <div className="relative w-full h-full overflow-hidden bg-zinc-900">
                    <Image 
                        src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"} 
                        alt={user.username || "User"} 
                        fill 
                        className="object-cover" 
                    />
                    </div>
                </div>
                {user.is_for_hire && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border border-accent px-3 py-1 shadow-sm whitespace-nowrap z-20">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase flex items-center gap-1.5 tracking-widest">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                        HIREABLE
                    </span>
                    </div>
                )}
            </div>

            {/* USER INFO & META */}
            <div className="flex-1 min-w-0 pt-4 md:pt-20 space-y-4">
                
                {/* Top Row: Name & Socials */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground uppercase leading-none truncate">
                            {user.full_name || user.username}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-muted-foreground font-mono text-sm tracking-tighter">NODE_ID: @{user.username}</p>
                            {isFollowing && followsMe && (
                                <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-1.5 font-mono flex items-center gap-1">
                                    <ShieldCheck size={10} /> MUTUAL_LINK
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {user.socials?.github && <SocialButton icon={Github} href={user.socials.github} />}
                        {user.socials?.twitter && <SocialButton icon={Twitter} href={user.socials.twitter} />}
                        {user.socials?.linkedin && <SocialButton icon={Linkedin} href={user.socials.linkedin} />}
                    </div>
                </div>

                {/* Bio */}
                <p className="text-sm md:text-base leading-relaxed max-w-2xl text-foreground/80 font-light italic">
                    "{user.bio || 'No system biography provided.'}"
                </p>

                {/* Meta Details */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground uppercase tracking-wide border-t border-border pt-4 w-full">
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-accent" />
                        <span>{user.location || 'Global'}</span>
                    </div>
                    {user.website && (
                        <div className="flex items-center gap-2">
                        <LinkIcon size={12} className="text-accent" />
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline decoration-dotted transition-colors">
                            {user.website.replace('https://', '').replace('http://', '')}
                        </a>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-accent" />
                        <span>Joined {new Date(user.created_at).getFullYear()}</span>
                    </div>
                </div>
            </div>
            
            {/* ACTION BUTTONS (Right Column on Desktop) */}
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto pt-4 md:pt-20">
                 {!isOwner ? (
                    <>
                        <Button 
                            onClick={handleFollowToggle}
                            className={`flex-1 md:w-36 h-10 rounded-none font-mono text-xs uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
                            ${isFollowing 
                                ? 'bg-secondary text-foreground hover:bg-red-600 hover:text-white' 
                                : 'bg-foreground text-background hover:bg-accent hover:text-white'}`}
                        >
                            {isFollowing ? <><UserMinus size={14} className="mr-2" /> Disconnect</> : <><UserPlus size={14} className="mr-2" /> Connect</>}
                        </Button>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={handleMessageClick}
                                disabled={isInitializingChat}
                                className="flex-1 h-10 rounded-none font-mono text-xs uppercase border-border hover:border-accent hover:bg-accent hover:text-white transition-all group"
                            >
                                {isInitializingChat ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : isFollowing && followsMe ? (
                                  <>
                                    <MessageSquare size={14} className="mr-2" /> Msg
                                  </>
                                ) : (
                                  <>
                                    <Lock size={14} className="mr-2 text-muted-foreground group-hover:text-white" /> Msg
                                  </>
                                )}
                            </Button>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 w-10 p-0 rounded-none border-border hover:bg-secondary">
                                    <MoreHorizontal size={16} />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none border-border bg-background min-w-[140px]">
                                <DropdownMenuItem onClick={handleShareProfile} className="text-xs font-mono cursor-pointer focus:bg-secondary">
                                    <Share2 size={14} className="mr-2" /> Share Node
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem onClick={() => setIsReportOpen(true)} className="text-xs font-mono text-red-500 cursor-pointer focus:bg-red-500/10 focus:text-red-500">
                                    <Flag size={14} className="mr-2" /> Flag Node
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </>
                 ) : (
                    <div className="flex md:flex-col gap-2 w-full md:w-36">
                        <Button 
                            onClick={() => router.push('/profile')} 
                            className="flex-1 h-10 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-none font-mono text-xs uppercase tracking-wider"
                        >
                            Edit Profile
                        </Button>
                        {/* Share button for owner */}
                        <Button 
                            onClick={handleShareProfile}
                            className="flex-1 md:flex-none h-10 bg-transparent hover:bg-accent/10 text-foreground border border-border hover:border-accent rounded-none font-mono text-xs uppercase tracking-wider"
                        >
                            <Share2 size={16} />
                        </Button>
                    </div>
                 )}
            </div>

        </div>
      </div>

      {/* --- MESSAGE GATE MODAL --- */}
      <Dialog open={isMessageGateOpen} onOpenChange={setIsMessageGateOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-background p-0 rounded-none gap-0 shadow-2xl">
            <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 uppercase font-mono tracking-tighter text-foreground">
                    <Lock size={18} className="text-accent" /> Connection Required
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Handshake required to initialize messaging frequency.
                </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Direct communication is only available between <span className="text-foreground font-bold">Mutual Connections</span> to ensure network security.
                </p>
                <div className="bg-secondary/10 border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                        <span className={isFollowing ? "text-foreground" : "text-muted-foreground"}>You follow @{user.username}</span>
                        <span className={isFollowing ? "text-green-500" : "text-red-500"}>[{isFollowing ? "OK" : "NO"}]</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                        <span className={followsMe ? "text-foreground" : "text-muted-foreground"}>@{user.username} follows you</span>
                        <span className={followsMe ? "text-green-500" : "text-red-500"}>[{followsMe ? "OK" : "NO"}]</span>
                    </div>
                </div>
            </div>
            <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex flex-col sm:flex-row gap-2">
                {!isFollowing && (
                    <Button onClick={handleFollowToggle} className="flex-1 bg-foreground text-background rounded-none font-mono text-xs uppercase h-10">Connect Now</Button>
                )}
                <DialogClose asChild>
                    <Button variant="outline" className="flex-1 border-border rounded-none font-mono text-xs uppercase h-10">Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REPORT DIALOG --- */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background p-0 rounded-none gap-0 shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500 uppercase font-mono tracking-tighter">
              <AlertTriangle size={18} /> Incident Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason} className="gap-2">
              <ReportOption id="spam" label="Spam / Malicious" />
              <ReportOption id="harassment" label="Harassment" />
              <ReportOption id="fake" label="Impersonation" />
            </RadioGroup>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Log Details</Label>
              <Textarea 
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the violation..." 
                className="bg-secondary/5 border-border rounded-none focus-visible:ring-accent min-h-[100px] text-sm font-mono leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-none border-border font-mono text-xs uppercase h-10 px-4">Abort</Button>
            </DialogClose>
            <Button 
              onClick={handleReportSubmit} 
              disabled={isSubmitting} 
              className="bg-red-600 hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-10 px-4"
            >
              {isSubmitting ? <Loader2 className="animate-spin size={14} "/> : "Transmit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SocialButton({ icon: Icon, href }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-8 h-8 flex items-center justify-center border border-border bg-background hover:border-accent hover:text-accent transition-all duration-200"
    >
      <Icon size={14} />
    </a>
  );
}

function ReportOption({ id, label }) {
  return (
    <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
      <RadioGroupItem value={id} id={id} className="text-accent border-muted-foreground" />
      <Label htmlFor={id} className="text-xs font-mono uppercase cursor-pointer flex-1 tracking-wider">{label}</Label>
    </div>
  );
}