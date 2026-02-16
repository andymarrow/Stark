"use client";
import { useState } from "react";
import { Key, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JudgeLogin({ onVerify, isVerifying, contestTitle }) {
  const [code, setCode] = useState("");

  const handleAction = () => {
    // Trim the code right before sending to prevent whitespace errors
    onVerify(code.trim());
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-accent/10 text-accent mx-auto flex items-center justify-center border border-accent/20 rounded-none mb-6">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Judge Access</h1>
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest">
                Protocol: {contestTitle || 'Initializing...'}
            </p>
        </div>

        <div className="bg-card border border-border p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Secure Access Code</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <Input 
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && code.length >= 4 && handleAction()}
                            placeholder="Enter Code (e.g. AB12XY)"
                            className="pl-10 h-12 rounded-none bg-background border-border focus:border-accent font-mono text-lg tracking-[0.3em]"
                        />
                    </div>
                </div>

                <Button 
                    onClick={handleAction}
                    disabled={isVerifying || code.trim().length < 4}
                    className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-none font-mono uppercase tracking-widest text-xs"
                >
                    {isVerifying ? <Loader2 className="animate-spin" /> : "Authenticate"}
                </Button>
            </div>
        </div>

        <p className="text-center text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
            Encrypted Session // Jury_Internal_Use_Only
        </p>
      </div>
    </div>
  );
}