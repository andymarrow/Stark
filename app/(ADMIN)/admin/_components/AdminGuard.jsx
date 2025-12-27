"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Loader2, ShieldBan } from "lucide-react";
import { toast } from "sonner";

export default function AdminGuard({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Wait for Auth Context
    if (authLoading) return;

    // 2. No User? Kick to login
    if (!user) {
        router.push("/login");
        return;
    }

    // 3. Check Role in Database (Source of Truth)
    const checkRole = async () => {
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !data || data.role !== 'admin') {
            throw new Error("Unauthorized");
        }

        // 4. Access Granted
        setIsAuthorized(true);
      } catch (err) {
        // 5. Access Denied
        console.error("Security Alert:", err);
        toast.error("SECURITY ALERT", { 
            description: "Unauthorized access attempt logged. Redirecting..." 
        });
        router.push("/profile"); // Kick back to safe zone
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, [user, authLoading, router]);

  // --- LOADING / VERIFYING STATE ---
  if (authLoading || checking) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-red-600 gap-4 z-50">
            <div className="relative">
                <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full animate-pulse" />
                <ShieldBan size={64} className="relative z-10" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-white" size={24} />
                <span className="font-mono text-xs uppercase tracking-[0.5em] text-white/50 animate-pulse">
                    Verifying Biometrics...
                </span>
            </div>
        </div>
    );
  }

  // If we get here and not authorized, return null (useEffect will redirect)
  if (!isAuthorized) return null;

  // Render Admin Content
  return <>{children}</>;
}