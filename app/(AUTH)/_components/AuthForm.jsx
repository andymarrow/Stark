"use client";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthForm({ view = "login" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false); // New state
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username, 
              username: username.toLowerCase().replace(/\s+/g, '_')
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
          }
        });

        if (error) throw error;

        if (data.session) {
            router.push("/onboarding");
        } else {
            setIsEmailSent(true); // Transition UI to "Check Email"
            toast.success("Verification Link Dispatched");
        }
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/profile");
        router.refresh();
      }
    } catch (error) {
      toast.error("Access Denied", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: SUCCESS/PENDING UI ---
  if (isEmailSent) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center py-4">
        <div className="w-16 h-16 bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto rounded-none mb-4">
            <Mail className="text-accent animate-bounce" size={32} />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold font-mono uppercase tracking-tighter text-foreground">Awaiting_Verification</h3>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed max-w-[280px] mx-auto">
                We've sent a secure key to <span className="text-foreground">{email}</span>. 
                <br /><br />
                <span className="text-accent font-bold">STUCK?</span> Use Social Auth below to bypass the email queue—we'll link your account automatically.
            </p>
        </div>
        <Button 
            variant="outline" 
            onClick={() => setIsEmailSent(false)}
            className="h-10 rounded-none border-border font-mono text-[10px] uppercase tracking-widest"
        >
            Try different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Keep your existing form inputs here) ... */}
        {/* Username (Signup Only) */}
        {view === "signup" && (
            <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-muted-foreground ml-1">Username</label>
                <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input 
                        type="text" 
                        placeholder="stark_user" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <Link href="/forgot-password" className="text-[10px] text-accent hover:underline font-mono">
                        FORGOT_KEY?
                    </Link>
                )}
            </div>
            <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

        <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-none font-mono uppercase tracking-widest text-xs shadow-lg mt-6 group"
        >
            {isLoading ? <span className="animate-pulse">Processing...</span> : 
            <span className="flex items-center gap-2">
                {view === 'login' ? 'Access System' : 'Initialize Account'} 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>}
        </Button>
    </form>
  );
}