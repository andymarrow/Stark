"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import DashboardClient from "./DashboardClient";
import { checkContestAccess } from "@/app/actions/contestAccess";

export default function DashboardGuard({ contest, currentUser }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
        // Creator OR moderator. Checked server-side rather than by
        // comparing creator_id here, so the dashboard and the actions
        // behind it agree on who's allowed (see contestAccess.js).
        const access = await checkContestAccess(contest.id);
        // Keep the scan animation, but don't make the check wait on it.
        await new Promise((r) => setTimeout(r, 1200));
        if (cancelled) return;

        if (!access.canManage) {
            toast.error("Access Denied", {
                description: "Biometric mismatch. You do not run this node.",
                duration: 5000
            });
            router.push("/");
        } else {
            setIsCreator(access.isCreator);
            setIsVerified(true);
        }
        setIsChecking(false);
    };

    verify();
    return () => { cancelled = true; };
  }, [currentUser, contest, router]);

  if (isChecking) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="relative">
                    <div className="w-24 h-24 border-2 border-zinc-800 rounded-full flex items-center justify-center relative z-10 bg-black">
                        <Fingerprint size={48} className="text-zinc-500 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-2 border-accent rounded-full animate-ping opacity-20" />
                </div>
                
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">
                        Verifying Identity
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-accent">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Scanning Neural ID...</span>
                    </div>
                </div>

                <div className="w-64 h-1 bg-zinc-900 overflow-hidden mt-4">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-1/2 h-full bg-accent"
                    />
                </div>
            </motion.div>
        </div>
    );
  }

  if (!isVerified) return null; // Will redirect

  return <DashboardClient contest={contest} currentUser={currentUser} isCreator={isCreator} />;
}