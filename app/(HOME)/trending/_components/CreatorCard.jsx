"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { UserPlus, UserCheck, Star, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";

export default function CreatorCard({ creator }) {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle avatar fallback
  const avatarUrl = creator.avatar || creator.avatar_url;
  const isMe = currentUser?.id === creator.id;

  // 1. Check Initial Follow Status
  useEffect(() => {
    if (currentUser && creator.id && !isMe) {
      const checkStatus = async () => {
        const { data } = await supabase
          .from('follows')
          .select('follower_id') // minimal select
          .eq('follower_id', currentUser.id)
          .eq('following_id', creator.id)
          .maybeSingle();
        
        if (data) setIsFollowing(true);
      };
      checkStatus();
    }
  }, [currentUser, creator.id, isMe]);

  // 2. Handle Click
  const handleFollowClick = async (e) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation(); // Stop bubbling

    if (!currentUser) {
      toast.error("Authentication Required", { description: "Please login to connect." });
      return;
    }

    if (isMe) return;

    // Optimistic Update
    const previousState = isFollowing;
    setIsFollowing(!previousState);
    setIsLoading(true);

    try {
      if (!previousState) {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: creator.id });
        if (error) throw error;
        toast.success(`Connected with @${creator.username}`);
      } else {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', creator.id);
        if (error) throw error;
        toast.info(`Disconnected from @${creator.username}`);
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(previousState);
      toast.error("Connection Failed", { description: "Could not update network status." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/profile/${creator.username}`} className="group block h-full">
      <div className="h-full border border-border bg-card p-5 hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300 flex flex-col justify-between">
        
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 border border-border bg-secondary overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt={creator.name} fill className="object-cover" />
                        ) : (
                            <span className="text-sm font-mono font-bold text-muted-foreground group-hover:text-foreground">
                                {creator.username ? creator.username.charAt(0).toUpperCase() : <User size={16} />}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate group-hover:text-accent transition-colors">
                            {creator.name || creator.username}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">@{creator.username}</p>
                    </div>
                </div>
                {creator.isForHire && (
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" title="Hiring" />
                )}
            </div>

            {/* Mini Portfolio Preview */}
            <div className="grid grid-cols-3 gap-1 mb-4 h-16">
                {(creator.topProjects || []).slice(0, 3).map((img, i) => (
                    <div key={i} className="relative w-full h-full bg-secondary border border-transparent group-hover:border-border transition-colors">
                        {img ? (
                            <Image src={img} alt="work" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full bg-secondary/50" />
                        )}
                    </div>
                ))}
                {(!creator.topProjects || creator.topProjects.length === 0) && (
                    <div className="col-span-3 w-full h-full bg-secondary/20 flex items-center justify-center border border-dashed border-border">
                        <span className="text-[9px] font-mono text-muted-foreground">NO_DATA</span>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Stats & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border border-dashed text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1">
                <Star size={10} />
                <span>{creator.stats?.likes || 0} Likes</span>
            </div>
            
            {/* Functional Connect Button */}
            {!isMe && (
                <button 
                    onClick={handleFollowClick}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 transition-all z-20 relative px-2 py-1 -mr-2
                        ${isFollowing 
                            ? "text-accent font-bold" 
                            : "text-foreground hover:text-accent hover:bg-secondary/50"}`}
                >
                    {isLoading ? (
                        <Loader2 size={10} className="animate-spin" />
                    ) : isFollowing ? (
                        <>
                            <UserCheck size={12} />
                            <span>Linked</span>
                        </>
                    ) : (
                        <>
                            <UserPlus size={12} />
                            <span>Connect</span>
                        </>
                    )}
                </button>
            )}
        </div>

      </div>
    </Link>
  );
}