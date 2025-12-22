"use client";
import { useState } from "react";
import { ArrowRight, Terminal } from "lucide-react";

export default function InteractiveCommit() {
  const [input, setInput] = useState("");
  const [committed, setCommitted] = useState(false);

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase();
    setInput(val);
    if (val === "I AGREE") {
        setCommitted(true);
    }
  };

  return (
    <div className="py-24 bg-secondary/5 border-t border-border">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        
        <Terminal size={48} className="mx-auto mb-6 text-muted-foreground" />
        
        <h2 className="text-3xl font-bold mb-4">Join the Resistance.</h2>
        <p className="text-muted-foreground font-mono text-sm mb-12">
            Type "I AGREE" below to commit your support to the Code-First movement.
        </p>

        <div className="relative">
            {committed ? (
                <div className="bg-green-500/10 border border-green-500 text-green-500 p-8 font-mono text-lg animate-in zoom-in duration-300">
                    <div className="text-4xl mb-2">✓</div>
                    COMMIT_HASH: 8f2a9e... ACCEPTED
                </div>
            ) : (
                <div className="relative group">
                    <input 
                        type="text" 
                        value={input}
                        onChange={handleInput}
                        placeholder="Type 'I AGREE'..."
                        className="w-full h-20 bg-background border-2 border-border text-center text-2xl font-mono uppercase tracking-[0.5em] focus:border-accent focus:outline-none transition-all placeholder:tracking-normal placeholder:text-muted-foreground/30"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                        <ArrowRight size={24} />
                    </div>
                </div>
            )}
        </div>

        <div className="mt-12 text-xs font-mono text-muted-foreground">
            Current Signatures: <span className="text-foreground font-bold">14,203</span>
        </div>

      </div>
    </div>
  );
}