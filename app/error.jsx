"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Home, AlertTriangle, Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Error({ error, reset }) {
  const [errorLog, setErrorLog] = useState("");

  useEffect(() => {
    // Simulate generating a crash log based on the real error
    const timestamp = new Date().toISOString();
    const log = `> FATAL_EXCEPTION_AT_${timestamp}\n> CORE_DUMP_INITIATED...\n> ERROR_CODE: 0x500_INTERNAL_SERVER_ERROR\n> MESSAGE: "${error.message || "Unknown critical failure"}"\n> STACK_TRACE_HASH: ${Math.random().toString(36).substring(7).toUpperCase()}\n> SYSTEM_HALTED.`;
    setErrorLog(log);
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden text-red-500 font-mono selection:bg-red-500 selection:text-white">
      
      {/* 1. Alarm Background Pulse */}
      <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10" />

      <div className="container relative z-20 max-w-2xl px-4 flex flex-col items-center">
        
        {/* 2. Visual Header */}
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-8"
        >
            <div className="w-24 h-24 border-2 border-red-500 flex items-center justify-center mb-6 bg-red-500/10">
                <AlertTriangle size={48} className="animate-[bounce_1s_infinite]" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-center mb-2 text-white">
                SYSTEM <span className="text-red-600">CRASH</span>
            </h1>
            <p className="text-sm tracking-[0.2em] uppercase opacity-70">
                Critical Process Died
            </p>
        </motion.div>

        {/* 3. The Crash Log (Terminal) */}
        <div className="w-full bg-zinc-950 border border-red-900/50 p-4 mb-8 relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
            <div className="flex justify-between items-center mb-2 border-b border-red-900/30 pb-2">
                <div className="flex items-center gap-2 text-xs">
                    <Terminal size={12} />
                    <span>diagnostic_log.txt</span>
                </div>
                <button 
                    onClick={() => navigator.clipboard.writeText(errorLog)}
                    className="text-[10px] hover:text-white flex items-center gap-1 uppercase"
                >
                    <Copy size={10} /> Copy Log
                </button>
            </div>
            <pre className="text-xs md:text-sm text-red-400 whitespace-pre-wrap break-all leading-relaxed">
                {errorLog}
                <span className="animate-pulse inline-block w-2 h-4 bg-red-500 align-middle ml-1" />
            </pre>
        </div>

        {/* 4. Recovery Options */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button 
                onClick={() => reset()} 
                className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white rounded-none font-mono uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
            >
                <RotateCcw size={16} className="mr-2" />
                Attempt Reboot
            </Button>
            
            <Button 
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="h-14 px-8 border-red-900/50 text-red-500 hover:bg-red-950/50 hover:text-red-400 rounded-none font-mono uppercase tracking-widest text-xs bg-transparent"
            >
                <Home size={16} className="mr-2" />
                Safe Mode (Home)
            </Button>
        </div>

        <div className="mt-12 text-[10px] uppercase text-red-900/60 font-mono text-center">
            Error Reference: {error.digest || "NULL_POINTER"}
        </div>

      </div>
    </div>
  );
}