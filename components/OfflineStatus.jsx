"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-4 p-4 bg-zinc-950 border border-red-500/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-sm w-full md:w-auto"
        >
          {/* Animated Blinking Red Light */}
          <div className="relative flex items-center justify-center w-10 h-10 bg-red-900/20 border border-red-500/30 flex-shrink-0">
            <WifiOff className="text-red-500" size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-0.5">
              Connection Severed
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono">
              Reconnecting to Stark Net...
            </p>
          </div>

          {/* Manual Retry Spinner Visual */}
          <div className="animate-spin text-zinc-600">
            <RefreshCw size={16} />
          </div>

          {/* Decor Lines */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500/50 overflow-hidden">
             <div className="h-full w-1/2 bg-red-500 animate-[loading_2s_ease-in-out_infinite]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}