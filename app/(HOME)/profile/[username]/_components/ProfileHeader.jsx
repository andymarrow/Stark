"use client";
import Image from "next/image";
import { MapPin, Link as LinkIcon, Calendar, MessageSquare, UserPlus, Twitter, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfileHeader({ user }) {
  return (
    <div className="w-full bg-background border border-border relative overflow-hidden group">
      
      {/* 1. Background Pattern */}
      {/* Moved z-index lower and adjusted position to not interfere */}
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
          {/* Status Indicator */}
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
                
                {/* Socials - Moved here so they don't float and overlap randomly */}
                <div className="flex gap-2">
                    <SocialButton icon={Github} href={user.socials.github} />
                    <SocialButton icon={Twitter} href={user.socials.twitter} />
                    <SocialButton icon={Linkedin} href={user.socials.linkedin} />
                </div>
            </div>

            <p className="text-sm md:text-base leading-relaxed max-w-2xl text-foreground/80 font-light">
                {user.bio}
            </p>

            {/* Metadata Row */}
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
            
            {/* FIXED HOVER STATE: Explicitly setting text-white on hover so it doesn't disappear */}
            <Button variant="outline" className="flex-1 md:w-36 h-11 rounded-none font-mono text-xs uppercase tracking-wider border-border hover:border-accent hover:bg-accent hover:text-white bg-transparent shadow-none transition-all">
                <MessageSquare size={14} className="mr-2" />
                Message
            </Button>
        </div>

      </div>
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