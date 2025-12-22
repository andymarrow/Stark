"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Activity, 
  Terminal, 
  LogOut,
  Settings
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { label: "User Management", icon: Users, href: "/admin/users" },
  { label: "Moderation Queue", icon: ShieldAlert, href: "/admin/moderation", badge: "3" },
  { label: "System Health", icon: Activity, href: "/admin/health" },
  { label: "Audit Logs", icon: Terminal, href: "/admin/logs" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full text-zinc-400">
      
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 bg-red-600 flex items-center justify-center font-bold text-xs text-black">S</div>
            <span className="font-mono font-bold tracking-widest text-sm">ADMIN_CORE</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
                <Link 
                    key={item.href} 
                    href={item.href}
                    className={`
                        flex items-center justify-between px-3 py-2 text-sm font-mono transition-all group
                        ${isActive 
                            ? "bg-white/10 text-white border-l-2 border-red-600" 
                            : "hover:bg-white/5 hover:text-zinc-200 border-l-2 border-transparent"}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <item.icon size={16} />
                        <span>{item.label}</span>
                    </div>
                    {item.badge && (
                        <span className="text-[10px] bg-red-600/20 text-red-500 px-1.5 py-0.5 border border-red-600/30">
                            {item.badge}
                        </span>
                    )}
                </Link>
            )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-3 py-2 text-sm font-mono text-zinc-500 hover:text-red-500 transition-colors w-full">
            <LogOut size={16} />
            <span>Secure Logout</span>
        </button>
      </div>

    </div>
  );
}