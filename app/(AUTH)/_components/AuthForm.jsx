"use client";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AuthForm({ view = "login" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        // router.push('/dashboard')
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Name Input (Signup Only) */}
      {view === "signup" && (
        <div className="space-y-1">
            <label className="text-xs font-mono uppercase text-muted-foreground ml-1">Username</label>
            <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <Input 
                    type="text" 
                    placeholder="stark_user" 
                    className="pl-10 h-12 rounded-none border-border bg-secondary/5 focus-visible:ring-accent transition-all"
                    required
                />
            </div>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1">
        <label className="text-xs font-mono uppercase text-muted-foreground ml-1">Email Address</label>
        <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
                type="email" 
                placeholder="dev@stark.net" 
                className="pl-10 h-12 rounded-none border-border bg-secondary/5 focus-visible:ring-accent transition-all"
                required
            />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
            <label className="text-xs font-mono uppercase text-muted-foreground ml-1">Password</label>
            {view === "login" && (
                <Link href="/forgot-password" class="text-[10px] text-accent hover:underline font-mono">
                    FORGOT_KEY?
                </Link>
            )}
        </div>
        <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="pl-10 pr-10 h-12 rounded-none border-border bg-secondary/5 focus-visible:ring-accent transition-all"
                required
            />
            <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-none font-mono uppercase tracking-widest text-xs shadow-lg mt-6 group"
      >
        {isLoading ? (
            <span className="animate-pulse">Authenticating...</span>
        ) : (
            <span className="flex items-center gap-2">
                {view === 'login' ? 'Access System' : 'Initialize Account'} 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
        )}
      </Button>

    </form>
  );
}