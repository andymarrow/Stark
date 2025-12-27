export default function TabsHeader({ activeTab, setActiveTab, reportCount }) {
  return (
    <div className="flex border-b border-white/10 bg-zinc-900/20">
        <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton label={`Reports (${reportCount})`} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} alert={reportCount > 0} />
        <TabButton label="Comm. Channel" active={activeTab === 'comm'} onClick={() => setActiveTab('comm')} />
    </div>
  );
}

function TabButton({ label, active, onClick, alert }) {
    return (
        <button 
            onClick={onClick}
            className={`
                px-6 py-3 text-xs font-mono uppercase tracking-widest border-b-2 transition-all flex items-center gap-2
                ${active 
                    ? "border-red-500 text-white bg-white/5" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}
            `}
        >
            {label}
            {alert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
        </button>
    )
}