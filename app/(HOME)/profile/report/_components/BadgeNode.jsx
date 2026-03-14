"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function BadgeNode({ badge, isNew }) {
  // Extract styles from DB or use defaults
  const style = badge.style || {
    glow_color: "shadow-zinc-500/20",
    border_color: "border-zinc-800",
    bg_gradient: "from-zinc-900 to-black"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-full p-4 border ${style.border_color} bg-gradient-to-br ${style.bg_gradient} ${style.glow_color} shadow-lg overflow-hidden group`}
    >
      {isNew && (
        <div className="absolute top-0 right-0 bg-accent text-white text-[8px] font-mono px-2 py-0.5 uppercase tracking-tighter z-10">
          New_Access
        </div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 relative flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
          <Image src={badge.image} alt={badge.name} fill className="object-contain" />
        </div>
        
        <div className="min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-tight truncate">{badge.name}</h4>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{badge.rarity}_Protocol</p>
        </div>
      </div>

      {/* Decorative corner */}
      <div className="absolute -bottom-1 -right-1 opacity-20">
        <ShieldCheck size={40} className="text-white" />
      </div>
    </motion.div>
  );
}