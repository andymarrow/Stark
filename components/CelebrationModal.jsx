"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, ArrowRight } from "lucide-react";
import AchievementCardPreview from "@/app/(ADMIN)/admin/achievements/_components/AchievementCardPreview";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function CelebrationModal({ badges = [], isOpen, onClose, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => setCurrentIndex(0), 500); // Reset after close animation
    }
  }, [isOpen]);

  // Trigger Confetti whenever the currentIndex changes (meaning a new badge is shown)
  useEffect(() => {
    if (isOpen && badges.length > 0) {
      const duration = 2500;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ef4444', '#ffffff', '#333333'] // Stark Theme Colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ef4444', '#ffffff', '#333333']
        });

        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isOpen, currentIndex, badges.length]);

  if (!badges || badges.length === 0) return null;

  const currentBadge = badges[currentIndex];
  const isLastBadge = currentIndex === badges.length - 1;

  const handleNext = () => {
      if (!isLastBadge) {
          setCurrentIndex(prev => prev + 1);
      } else {
          onClose();
      }
  };

  const handleShare = () => {
      // Safely construct the user's public profile URL
      const username = user?.user_metadata?.username;
      const url = username 
        ? `${window.location.origin}/profile/${username}`
        : window.location.href; // Fallback if no username exists
      
      navigator.clipboard.writeText(url);
      toast.success("Profile Link Copied!", { description: "Share your new protocol with the network."});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-transparent border-none p-0 shadow-none flex flex-col items-center justify-center overflow-visible z-[100] outline-none">
        
        <AnimatePresence mode="wait">
            <motion.div 
                key={`badge-${currentIndex}`} // Forces re-animation when index changes
                className="w-full flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
            >
                
                {/* 1. CINEMATIC BACKGROUND GLOW */}
                <div 
                    className="absolute inset-0 blur-[100px] rounded-full z-0 opacity-40 dark:opacity-30"
                    style={{ background: currentBadge.visual_style?.glow_color || '#ef4444' }}
                />

                {/* 2. THE BADGE REVEAL */}
                <div className="relative z-10 mb-8 perspective-1000">
                    <div className="animate-float"> 
                        {/* CSS Trick: Target the specific margin-top class of the label to hide it and prevent double-text */}
                        <div className="[&_.mt-6]:hidden">
                            <AchievementCardPreview 
                                badge={currentBadge} 
                                size="lg" 
                            />
                        </div>
                    </div>
                </div>

                {/* 3. THE CARD CONTENT (THEMED) */}
                <div className="bg-background/95 backdrop-blur-xl border border-border p-8 rounded-2xl w-full text-center relative z-20 shadow-2xl">
                    
                    {/* Badge Counter / Tag */}
                    {badges.length > 1 ? (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary border border-border text-foreground text-[10px] font-mono font-bold uppercase tracking-widest rounded-full shadow-sm">
                            Unlock {currentIndex + 1} of {badges.length}
                        </div>
                    ) : (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                            New Protocol Unlocked
                        </div>
                    )}

                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter mt-4 mb-2">
                        {currentBadge.name}
                    </h2>
                    
                    <p className="text-sm text-muted-foreground font-light leading-relaxed mb-8">
                        "{currentBadge.description}"
                    </p>

                    <div className="flex gap-3 justify-center">
                        <Button 
                            onClick={handleShare}
                            variant="outline" 
                            className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-mono text-xs uppercase"
                        >
                            <Share2 size={14} className="mr-2" /> Share
                        </Button>
                        
                        <Button 
                            onClick={handleNext}
                            className="bg-foreground text-background hover:bg-accent hover:text-white font-mono text-xs uppercase min-w-[120px] transition-colors"
                        >
                            {isLastBadge ? "Dismiss" : <>Next <ArrowRight size={14} className="ml-2" /></>}
                        </Button>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>

      </DialogContent>
    </Dialog>
  );
}