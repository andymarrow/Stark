"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  MessageSquare, 
  UserPlus, 
  UserMinus,
  Github, 
  Twitter, 
  Linkedin, 
  MoreHorizontal, 
  Flag, 
  AlertTriangle, 
  Loader2,
  Lock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
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
  
  // Connection States
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  
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
        
        // Parallel check: I follow them? + They follow me?
        const [iFollowReq, theyFollowReq] = await Promise.all([
          supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', user.id).maybeSingle(),
          supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', currentUser.id).maybeSingle()
        ]);

        setIsFollowing(!!iFollowReq.data);
        setFollowsMe(!!theyFollowReq.data);
        setIsCheckingConnection(false);
      };
      checkConnection();
    } else {
      setIsCheckingConnection(false);
    }
  }, [currentUser, user?.id]);

  // 2. Handle Messaging (Gated)
  const handleMessageClick = () => {
    if (!currentUser) return toast.error("Authentication Required");
    
    // Check for mutual link
    if (isFollowing && followsMe) {
      router.push(`/chat?u=${user.id}`);
    } else {
      setIsMessageGateOpen(true);
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
        toast.success(`Connection request sent to @${user.username}`);
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

  if (!user) return null;

  return (
    <div className="w-full bg-background border border-border relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/30 rounded-bl-[100px] -mr-12 -mt-12 pointer-events-none z-0" />

      <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start relative z-10">
        
        {/* Avatar Section */}
        <div className="flex-shrink-0 relative">
          <div className="w-28 h-28 md:w-36 md:h-36 relative border border-border bg-secondary p-1">
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

        {/* Info Section */}
        <div className="flex-1 min-w-0 space-y-5 pt-2">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground uppercase leading-none">
                {user.full_name || user.username}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-muted-foreground font-mono text-sm tracking-tighter">NODE_ID: @{user.username}</p>
                {isFollowing && followsMe && (
                  <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-1.5 font-mono flex items-center gap-1">
                    <ShieldCheck size={10} /> MUTUAL_LINK_ACTIVE
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

          <p className="text-sm md:text-base leading-relaxed max-w-2xl text-foreground/80 font-light italic">
            "{user.bio || 'No system biography provided.'}"
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground uppercase tracking-wide">
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
              <span>Active Since {new Date(user.created_at).getFullYear()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Button 
            onClick={handleFollowToggle}
            className={`flex-1 md:w-36 h-11 rounded-none font-mono text-xs uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
              ${isFollowing 
                ? 'bg-secondary text-foreground hover:bg-red-600 hover:text-white' 
                : 'bg-foreground text-background hover:bg-accent hover:text-white'}`}
          >
            {isFollowing ? <><UserMinus size={14} className="mr-2" /> Disconnect</> : <><UserPlus size={14} className="mr-2" /> Connect</>}
          </Button>
          
          <div className="flex gap-2 md:w-36">
            <Button 
                variant="outline" 
                onClick={handleMessageClick}
                className="flex-1 h-11 rounded-none font-mono text-xs uppercase border-border hover:border-accent hover:bg-accent hover:text-white transition-all group"
            >
              {isFollowing && followsMe ? <MessageSquare size={14} className="mr-2" /> : <Lock size={14} className="mr-2 text-muted-foreground group-hover:text-white" />}
              Msg
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 w-11 p-0 rounded-none border-border hover:bg-secondary">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none border-border bg-background">
                <DropdownMenuItem 
                  onClick={() => setIsReportOpen(true)} 
                  className="text-xs font-mono text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer rounded-none"
                >
                  <Flag size={14} className="mr-2" /> Flag Node
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* --- MESSAGE GATE MODAL --- */}
      <Dialog open={isMessageGateOpen} onOpenChange={setIsMessageGateOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-background p-0 rounded-none gap-0">
            <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 uppercase font-mono tracking-tighter">
                    <Lock size={18} className="text-accent" /> Channel Restricted
                </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    Messaging is only available between <span className="text-foreground font-bold">Mutual Connections</span> to prevent spam.
                </p>
                <div className="bg-secondary/10 border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                        <span className={isFollowing ? "text-foreground" : "text-muted-foreground"}>You follow @{user.username}</span>
                        <span className={isFollowing ? "text-green-500" : "text-red-500"}>[{isFollowing ? "VERIFIED" : "PENDING"}]</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                        <span className={followsMe ? "text-foreground" : "text-muted-foreground"}>@{user.username} follows you</span>
                        <span className={followsMe ? "text-green-500" : "text-red-500"}>[{followsMe ? "VERIFIED" : "PENDING"}]</span>
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
        <DialogContent className="sm:max-w-[425px] border-border bg-background p-0 rounded-none gap-0">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500 uppercase font-mono tracking-tighter">
              <AlertTriangle size={18} /> Incident Report
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1">
              File a formal report against @{user.username}.
            </DialogDescription>
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
                placeholder="Describe the violation here..." 
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
              {isSubmitting ? <Loader2 className="animate-spin size={14}" /> : "Transmit Report"}
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