"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Megaphone, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [userSettings, setUserSettings] = useState(null);
  
  // Timer State for Countdown
  const [timeLeft, setTimeLeft] = useState("");

  // 1. Fetch User Settings (to check opt-out)
  useEffect(() => {
    const fetchSettings = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('settings').eq('id', user.id).single();
        if (data) setUserSettings(data.settings);
    };
    fetchSettings();
  }, [user]);

  // 2. Fetch Active Announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
        // Fetch published announcements that haven't expired
        // Note: We fetch scheduled ones too if they are "future" (for countdowns)
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('status', 'published')
            .or(`banner_expires_at.is.null,banner_expires_at.gt.${new Date().toISOString()}`)
            .order('scheduled_for', { ascending: false });

        if (error || !data) return;

        // Filter out dismissed ones from localStorage
        const dismissedIds = JSON.parse(localStorage.getItem('stark_dismissed_banners') || '[]');
        const active = data.filter(a => !dismissedIds.includes(a.id));
        
        setAnnouncements(active);
    };

    fetchAnnouncements();
  }, []);

  // 3. Auto-Rotate Logic (Pause on Hover)
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 8000); // 8 seconds per slide
    return () => clearInterval(interval);
  }, [announcements.length]);

  // 4. Countdown Logic
  useEffect(() => {
    const current = announcements[currentIndex];
    if (!current) return;

    const targetDate = new Date(current.scheduled_for);
    const now = new Date();

    // Only run timer if it's a FUTURE event
    if (targetDate > now) {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                setTimeLeft("LIVE NOW");
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(timer);
    } else {
        setTimeLeft(null); // It's already happened/standard post
    }
  }, [currentIndex, announcements]);

  // --- HANDLERS ---

  const handleDismiss = (e) => {
    e.stopPropagation();
    const current = announcements[currentIndex];
    if (!current) return;

    // Save to LocalStorage
    const dismissedIds = JSON.parse(localStorage.getItem('stark_dismissed_banners') || '[]');
    localStorage.setItem('stark_dismissed_banners', JSON.stringify([...dismissedIds, current.id]));

    // Remove from State
    const newAnnouncements = announcements.filter(a => a.id !== current.id);
    setAnnouncements(newAnnouncements);
    
    // Reset index if needed
    if (newAnnouncements.length === 0) setIsVisible(false);
    else setCurrentIndex(0);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  // --- RENDER CONDITIONS ---

  // 1. User Opted Out
  if (userSettings?.show_announcements === false) return null;

  // 2. No Active Banners
  if (!isVisible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isCountdown = timeLeft !== null;

  return (
    <div className="relative bg-zinc-900 dark:bg-zinc-950 text-white border-b border-zinc-800 overflow-hidden h-12 md:h-10 z-50">
      
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20 animate-pulse pointer-events-none" />

      <div className="container mx-auto h-full flex items-center justify-between px-4 relative z-10">
        
        {/* Left: Navigation (Only if multiple) */}
        <div className="flex items-center gap-2 w-12 flex-shrink-0">
            {announcements.length > 1 && (
                <>
                    <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors"><ChevronLeft size={14} /></button>
                    <span className="text-[9px] font-mono text-zinc-500 select-none">{currentIndex + 1}/{announcements.length}</span>
                    <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors"><ChevronRight size={14} /></button>
                </>
            )}
        </div>

        {/* Center: Content (Clickable) */}
        <Link href={`/announcements?id=${current.id}`} className="flex-1 flex items-center justify-center gap-3 overflow-hidden group cursor-pointer h-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 whitespace-nowrap"
                >
                    {/* Badge / Category */}
                    <span className={`
                        text-[9px] font-mono uppercase px-2 py-0.5 rounded-sm border
                        ${isCountdown 
                            ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                    `}>
                        {isCountdown ? 'LIVE EVENT' : current.category}
                    </span>

                    {/* Title */}
                    <span className="text-xs md:text-sm font-medium truncate">
                        {current.title}
                    </span>

                    {/* Countdown Timer or CTA */}
                    {isCountdown ? (
                        <div className="flex items-center gap-1.5 text-red-400 font-mono text-xs font-bold">
                            <Clock size={12} />
                            <span>{timeLeft}</span>
                        </div>
                    ) : (
                        <span className="hidden md:flex items-center gap-1 text-[10px] text-zinc-500 group-hover:text-red-400 transition-colors uppercase font-mono tracking-wider">
                            Read More <ArrowRight size={10} />
                        </span>
                    )}
                </motion.div>
            </AnimatePresence>
        </Link>

        {/* Right: Dismiss */}
        <div className="w-12 flex justify-end flex-shrink-0">
            <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>

      </div>
    </div>
  );
}