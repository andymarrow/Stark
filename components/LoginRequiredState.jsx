"use client";
import Image from "next/image";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginRequiredState({ message = "This frequency is encrypted.", description = "Identify yourself to access the network." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* The Cute Character */}
      <div className="relative w-64 h-64 mb-8 group">
        <div className="absolute inset-0 bg-accent/20 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative w-full h-full drop-shadow-2xl transition-transform duration-500 hover:scale-105 hover:-rotate-2">
            {/* Assuming loginfirst.png is in your public folder */}
            <Image 
                src="/loginfirst.png" 
                alt="Login Required" 
                fill 
                className="object-contain"
                priority
            />
        </div>
      </div>

      {/* The "Stark" Industrial Wrapper around the Cute Image */}
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/20 border border-dashed border-border rounded-full text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <Lock size={10} /> Access_Denied // 401
        </div>

        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          {message}
        </h2>
        
        <p className="text-muted-foreground font-mono text-xs md:text-sm leading-relaxed max-w-sm mx-auto">
          {description}
        </p>

        <div className="pt-6">
            <Link href="/login">
                <Button className="h-12 px-8 bg-accent hover:bg-accent/90 text-white rounded-none font-mono uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                    Initialize Session <ArrowRight size={14} className="ml-2" />
                </Button>
            </Link>
        </div>
      </div>

    </div>
  );
}