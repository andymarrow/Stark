"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "../_components/AuthShell";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API
    setTimeout(() => {
        setIsLoading(false);
        setIsSubmitted(true);
    }, 1500);
  };

  return (
    <AuthShell 
        title="Account Recovery" 
        subtitle="Initiate password reset protocol."
    >
        {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-mono uppercase text-muted-foreground ml-1">Registered Email</label>
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

                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 bg-foreground hover:bg-accent text-background hover:text-white rounded-none font-mono uppercase tracking-widest text-xs transition-all"
                >
                    {isLoading ? "Transmitting..." : "Send Recovery Link"}
                </Button>

                <div className="text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={12} /> Return to Login
                    </Link>
                </div>
            </form>
        ) : (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto rounded-full">
                    <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Link Sent</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Check your inbox. A secure entry link has been dispatched to your provided address.
                    </p>
                </div>
                <Link href="/login">
                    <Button variant="outline" className="h-10 rounded-none border-border font-mono text-xs uppercase">
                        Return to Login
                    </Button>
                </Link>
            </div>
        )}
    </AuthShell>
  );
}