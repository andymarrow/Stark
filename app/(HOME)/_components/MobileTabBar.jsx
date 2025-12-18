"use client";
import { Home, Compass, PlusSquare, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  { id: "home", icon: Home, label: "Home", href: "/" },
  { id: "explore", icon: Compass, label: "Explore", href: "/explore" },
  { id: "create", icon: PlusSquare, label: "Create", href: "/create", isAction: true }, // Special styling for create
  { id: "chat", icon: MessageSquare, label: "Chat", href: "/chat" },
  { id: "profile", icon: User, label: "Profile", href: "/profile" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link 
              key={tab.id} 
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute -top-[1px] left-0 right-0 h-[2px] bg-accent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <div className={`flex flex-col items-center gap-1 transition-colors duration-200 
                ${isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"}
                ${tab.isAction ? "text-foreground" : ""}
              `}>
                
                {/* Special Styling for "Create" Button if desired, or keep uniform */}
                {tab.isAction ? (
                   <div className="bg-accent/10 p-2 text-accent">
                        <Icon strokeWidth={isActive ? 2.5 : 2} size={24} />
                   </div>
                ) : (
                    <Icon strokeWidth={isActive ? 2.5 : 2} size={24} />
                )}
                
                <span className="text-[10px] font-medium tracking-wide">
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}