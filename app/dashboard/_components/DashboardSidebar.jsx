"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs"; // <--- Imports
import { navigation } from "@/data/mockDashboard";
import { ChevronDown, Sparkles, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DashboardSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState({});
  const { isLoaded, user } = useUser(); // <--- Get User
  const { signOut } = useClerk();       // <--- Get SignOut

  const toggleGroup = (name) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      
      {/* 1. Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-900">
        <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles size={16} fill="currentColor" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                OmniOptimize
            </span>
        </Link>
      </div>

      {/* 2. Navigation Items */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navigation.map((item) => {
            const isActive = pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openGroups[item.name];

            return (
                <div key={item.name}>
                    {hasChildren ? (
                        <button
                            onClick={() => toggleGroup(item.name)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                isOpen || isActive 
                                    ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900" 
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </div>
                            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                        </button>
                    ) : (
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                isActive 
                                    ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20" 
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    )}

                    <AnimatePresence>
                        {hasChildren && isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pl-9 pt-1 space-y-1">
                                    {item.children.map((child) => (
                                        <Link
                                            key={child.name}
                                            href={child.href}
                                            className={cn(
                                                "block px-3 py-2 text-sm rounded-md transition-colors border-l border-transparent",
                                                pathname === child.href
                                                    ? "text-brand-600 dark:text-brand-400 font-medium border-brand-200 dark:border-brand-800 bg-slate-50 dark:bg-slate-900/30"
                                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-200"
                                            )}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        })}
      </div>

      {/* 3. User Footer (Dynamic) */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900">
        {!isLoaded ? (
            <div className="flex justify-center p-2"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : user ? (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="bg-brand-500 text-white text-xs">
                        {user.firstName?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {user.fullName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                        {user.primaryEmailAddress?.emailAddress}
                    </p>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                    onClick={() => signOut(() => router.push("/"))}
                >
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        ) : (
            <div className="text-center text-xs text-slate-500">Guest</div>
        )}
      </div>

    </div>
  );
};

export default DashboardSidebar;