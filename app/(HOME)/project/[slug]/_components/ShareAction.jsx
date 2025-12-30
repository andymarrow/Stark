"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareAction() {
  const handleShare = () => {
    if (typeof window !== "undefined") {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link Copied", { 
            description: "Handshake URL copied to clipboard." 
        });
    }
  };

  return (
    <button 
        onClick={handleShare}
        className="flex items-center gap-2 hover:text-foreground transition-colors group"
    >
        <Share2 size={14} className="group-hover:text-accent transition-colors" />
        <span className="hidden sm:inline">Share</span>
    </button>
  );
}