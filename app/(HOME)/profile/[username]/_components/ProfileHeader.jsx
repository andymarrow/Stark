"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  MapPin, Link as LinkIcon, Calendar, MessageSquare, UserPlus, 
  Twitter, Github, Linkedin, MoreHorizontal, Flag, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function ProfileHeader({ user }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");

  const handleReportSubmit = () => {
    // API Call here
    setIsReportOpen(false);
    alert("Report submitted. Our team will review this shortly.");
  };

  return (
    <div className="w-full bg-background border border-border relative overflow-hidden group">
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/30 rounded-bl-[100px] -mr-12 -mt-12 pointer-events-none z-0" />

      <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start relative z-10">
        
        {/* Avatar Section */}
        <div className="flex-shrink-0 relative">
          <div className="w-28 h-28 md:w-36 md:h-36 relative border border-border bg-secondary p-1">
            <div className="relative w-full h-full overflow-hidden">
                <Image 
                src={user.avatar} 
                alt={user.name} 
                fill 
                className="object-cover"
                />
            </div>
          </div>
          {user.isForHire && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border border-accent px-3 py-1 shadow-sm whitespace-nowrap z-20">
              <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                OPEN_TO_WORK
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 space-y-5 pt-2">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{user.name}</h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">@{user.username}</p>
                </div>
                
                <div className="flex gap-2">
                    <SocialButton icon={Github} href={user.socials.github} />
                    <SocialButton icon={Twitter} href={user.socials.twitter} />
                    <SocialButton icon={Linkedin} href={user.socials.linkedin} />
                </div>
            </div>

            <p className="text-sm md:text-base leading-relaxed max-w-2xl text-foreground/80 font-light">
                {user.bio}
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground uppercase tracking-wide">
                <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-accent" />
                    <span>{user.location}</span>
                </div>
                <div className="flex items-center gap-2">
                    <LinkIcon size={12} className="text-accent" />
                    <a href={user.website} target="_blank" className="hover:text-foreground underline decoration-dotted transition-colors">
                        {user.website.replace('https://', '')}
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-accent" />
                    <span>Joined {user.joinedDate}</span>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
            <Button className="flex-1 md:w-36 h-11 bg-foreground text-background hover:bg-foreground/90 rounded-none font-mono text-xs uppercase tracking-wider border border-transparent shadow-none">
                <UserPlus size={14} className="mr-2" />
                Follow
            </Button>
            
            <div className="flex gap-2 md:w-36">
                <Button variant="outline" className="flex-1 h-11 rounded-none font-mono text-xs uppercase tracking-wider border-border hover:border-accent hover:bg-accent hover:text-white bg-transparent shadow-none transition-all">
                    <MessageSquare size={14} className="mr-2" />
                    Msg
                </Button>
                
                {/* More Options Dropdown */}
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
                            <Flag size={14} className="mr-2" /> Report User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

      </div>

      {/* --- REPORT DIALOG --- */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background p-0 rounded-none gap-0">
            <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2 text-red-500">
                    <AlertTriangle size={18} />
                    Report User
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
                    This report will be reviewed by our moderation team.
                </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-4">
                <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Reason for report</Label>
                    <RadioGroup defaultValue="spam" onValueChange={setReportReason} className="gap-2">
                        <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer">
                            <RadioGroupItem value="spam" id="spam" className="text-accent border-muted-foreground" />
                            <Label htmlFor="spam" className="text-sm font-medium cursor-pointer flex-1">Spam or Advertising</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer">
                            <RadioGroupItem value="harassment" id="harassment" className="text-accent border-muted-foreground" />
                            <Label htmlFor="harassment" className="text-sm font-medium cursor-pointer flex-1">Harassment / Hate Speech</Label>
                        </div>
                        <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer">
                            <RadioGroupItem value="fake" id="fake" className="text-accent border-muted-foreground" />
                            <Label htmlFor="fake" className="text-sm font-medium cursor-pointer flex-1">Fake Account / Impersonation</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase text-muted-foreground">Additional Details</Label>
                    <Textarea 
                        placeholder="Please provide specific examples..." 
                        className="bg-secondary/5 border-border rounded-none focus-visible:ring-accent min-h-[100px] text-sm"
                    />
                </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
                <DialogClose asChild>
                    <Button variant="outline" className="rounded-none border-border hover:bg-secondary">Cancel</Button>
                </DialogClose>
                <Button onClick={handleReportSubmit} className="bg-red-600 hover:bg-red-700 text-white rounded-none">
                    Submit Report
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
            className="w-8 h-8 flex items-center justify-center border border-border bg-background hover:border-accent hover:text-accent transition-all duration-200"
        >
            <Icon size={14} />
        </a>
    )
}