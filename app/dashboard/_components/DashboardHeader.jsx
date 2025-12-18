"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic"; // 1. Import dynamic
import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeToggle from "@/components/Themetoggle";
import UserNav from "./UserNav";
import ProjectSwitcher from "./ProjectSwitcher";

// 2. Dynamically import Sidebar to break circular dependency with Layout
// we use ssr: true (default) or false depending if you want it in HTML. 
// Since it's inside a hidden sheet, standard dynamic is fine.
const DashboardSidebar = dynamic(() => import("./DashboardSidebar"));

const DashboardHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      
      {/* LEFT: Mobile Menu & Project Switcher */}
      <div className="flex items-center gap-4 w-full max-w-2xl">
        
        {/* MOBILE SIDEBAR TRIGGER */}
        <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2 -ml-2 text-slate-500">
                        <Menu className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px] border-r border-slate-200 dark:border-slate-800">
                    <DashboardSidebar /> 
                </SheetContent>
            </Sheet>
        </div>

        {/* Project Switcher */}
        <ProjectSwitcher className="w-[160px] md:w-[200px]" />
        
        <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

        {/* Search Bar (Hidden on Mobile) */}
        <div className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
                placeholder="Search..." 
                className="pl-10 h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-brand-500 w-full"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</span>
            </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        
        <div className="hidden sm:block">
            <ThemeToggle />
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-slate-500">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
        </Button>

        <UserNav />
      </div>

    </header>
  );
};

export default DashboardHeader;