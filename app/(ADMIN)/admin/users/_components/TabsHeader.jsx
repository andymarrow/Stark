"use client";
import { LayoutDashboard, ShieldAlert, Mail, Medal } from "lucide-react";

export default function TabsHeader({ activeTab, setActiveTab, reportCount }) {
  return (
    <div className="flex border-b border-white/10 bg-zinc-900/20">
        <TabButton 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={LayoutDashboard}
        />
        
        {/* NEW PROTOCOLS TAB */}
        <TabButton 
            label="Protocols" 
            active={activeTab === 'protocols'} 
            onClick={() => setActiveTab('protocols')} 
            icon={Medal}
        />

        <TabButton 
            label={`Reports (${reportCount})`} 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
            alert={reportCount > 0} 
            icon={ShieldAlert}
        />

        <TabButton 
            label="Comm. Channel" 
            active={activeTab === 'comm'} 
            onClick={() => setActiveTab('comm')} 
            icon={Mail}
        />
    </div>
  );
}

function TabButton({ label, active, onClick, alert, icon: Icon }) {
    return (
        <button 
            onClick={onClick}
            className={`
                px-6 py-4 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2
                ${active 
                    ? "border-red-500 text-white bg-white/5" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"}
            `}
        >
            {Icon && <Icon size={14} className={active ? "text-red-500" : ""} />}
            {label}
            {alert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
        </button>
    )
}