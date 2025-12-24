"use client";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Using your toast system

export default function AuthForm({ view = "login" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Only for signup

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === "signup") {
        // --- SIGN UP LOGIC ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: username, // Passing metadata for our SQL trigger
              username: username.toLowerCase().replace(/\s+/g, '_')
            }
          }
        });

        if (error) throw error;

        toast.success("Identity Created", {
            description: "Please verify your email to activate the node."
        });
        
      } else {
        // --- LOG IN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Access Granted", {
            description: "Establishing secure connection..."
        });
        
        // Redirect to personal profile
        router.push("/profile");
      }

    } catch (error) {
      toast.error("Access Denied", {
          description: error.message || "Invalid credentials provided."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
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