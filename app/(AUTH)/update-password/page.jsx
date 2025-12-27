"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "../_components/AuthShell";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const { error } = await supabase.auth.updateUser({ 
            password: password 
        });

        if (error) throw error;

        toast.success("Password Updated", { description: "Your access key has been rotated." });
        router.push("/profile");

    } catch (error) {
        toast.error("Update Failed", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <AuthShell 
        title="New Credentials" 
        subtitle="Set a new secure password for your account."
    >
        <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-muted-foreground ml-1">New Password</label>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                    <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 rounded-none border-border bg-secondary/5 focus-visible:ring-accent transition-all"
                        required
                        minLength={6}
                    />
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-none font-mono uppercase tracking-widest text-xs shadow-lg"
            >
                {isLoading ? "Updating..." : "Confirm Change"}
            </Button>
        </form>
    </AuthShell>
  );
}