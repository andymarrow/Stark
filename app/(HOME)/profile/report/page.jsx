"use client";
import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Minus, ArrowLeft, 
  Download, Activity, ShieldCheck, Zap, Eye, Star, RefreshCw,
  Rocket
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { GitCommit, Trophy, ArrowRight, Clock } from "lucide-react";

export default function WeeklyReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [topProject, setTopProject] = useState(null);

  // Mock data for the chart - To be replaced with real data in Phase 2
  const CHART_DATA = [
    { day: 'Mon', views: 120, stars: 5 },
    { day: 'Tue', views: 300, stars: 12 },
    { day: 'Wed', views: 200, stars: 8 },
    { day: 'Thu', views: 450, stars: 20 },
    { day: 'Fri', views: 400, stars: 15 },
    { day: 'Sat', views: 150, stars: 4 },
    { day: 'Sun', views: 100, stars: 2 },
  ];

  const fetchRealIntelligence = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // 1. Check Cache First (Unless manually forcing a refresh)
      const cacheKey = `strk_report_data_${user.id}`;
      if (!forceRefresh) {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setReportData(parsed.reportData);
          setTopProject(parsed.topProject);
          setLoading(false);
          return;
        }
      }
      
      // 2. Fetch real intelligence via RPC
      const { data: rpcData, error } = await supabase.rpc('get_weekly_node_stats', { 
          target_user_id: user.id 
      });

      if (error) throw error;

      // 3. Fetch Top Performing Asset as fallback
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, views, likes_count, slug')
        .eq('owner_id', user.id);

      const top = projects?.sort((a, b) => b.views - a.views)[0];
      
      setReportData(rpcData);
      setTopProject(top);

      // Save to cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        reportData: rpcData,
        topProject: top
      }));

    } catch (err) {
      console.error("Audit_Link_Failure:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRealIntelligence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Manual Refresh
  const handleRefresh = () => {
    if (!user) return;
    fetchRealIntelligence(true);
  };

  // Handle CSV Generation and Download
  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = [];
    
    // Header
    rows.push(["System Audit Report - Node Performance v2.4"]);
    rows.push(["Generated At", new Date().toLocaleString()]);
    rows.push([]);

    // 1. Growth Metrics
    rows.push(["--- GROWTH METRICS ---"]);
    rows.push(["Metric", "Value", "Velocity/Growth (%)"]);
    rows.push(["Weekly Traffic", reportData?.current_views || 0, reportData?.view_growth || 0]);
    rows.push(["New Protocols", reportData?.new_badges?.length || 0, "N/A"]);
    rows.push(["System Health", "99.8%", "+0.02"]);
    rows.push([]);

    // 2. Asset Performance & Sector Standing
    const peakTitle = reportData?.top_asset?.title || topProject?.title || "Awaiting_Data";
    const peakViews = reportData?.top_asset?.views || topProject?.views || 0;
    const peakLikes = reportData?.top_asset?.likes || topProject?.likes_count || 0;

    rows.push(["--- SECTOR & ASSET DATA ---"]);
    rows.push(["Clearance Level", reportData?.clearance_level || 0]);
    rows.push(["Percentile Standing", reportData?.percentile || 0]);
    rows.push(["Peak Asset Title", peakTitle]);
    rows.push(["Peak Asset Views", peakViews]);
    rows.push(["Peak Asset Stars", peakLikes]);
    rows.push([]);

    // 3. Traffic Matrix Data
    rows.push(["--- TRAFFIC MATRIX ---"]);
    rows.push(["Day", "Views", "Stars"]);
    CHART_DATA.forEach(d => {
      rows.push([d.day, d.views, d.stars]);
    });
    rows.push([]);

    // 4. Transmission Stream Data
    rows.push(["--- TRANSMISSION LOG ---"]);
    rows.push(["Event Type", "Details/Timestamp"]);
    if (reportData?.stream?.length > 0) {
      reportData.stream.forEach(event => {
        rows.push([event.type || "System_Event", event.title || event.description || "Activity Logged"]);
      });
    } else {
      rows.push(["Awaiting_Signals", "No Activity In Current Cycle"]);
    }

    // Process and Download
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `node_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Activity className="animate-spin text-accent" size={32} />
        <span className="font-mono text-xs uppercase tracking-widest text-foreground">Generating_Audit_Log...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
            <button onClick={() => router.back()} className="p-2 hover:bg-secondary border border-border transition-colors text-foreground">
                <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="rounded-none border-border font-mono text-[10px] uppercase hover:bg-accent hover:text-white transition-colors text-foreground"
                >
                    <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                    {isRefreshing ? "Syncing..." : "Refresh"}
                </Button>
                <Button 
                    variant="outline" 
                    onClick={handleExportCSV}
                    className="rounded-none border-border font-mono text-[10px] uppercase hover:bg-accent hover:text-white transition-colors text-foreground"
                >
                    <Download size={14} className="mr-2" /> Export_CSV
                </Button>
            </div>
        </div>

        {/* Senior Header: System Information */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-l-4 border-accent pl-6">
            <div>
                <span className="text-accent font-mono text-[10px] tracking-[0.4em] uppercase mb-2 block">
                    Classification: System_Audit_Report
                </span>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic text-foreground">
                    Node_Performance <span className="text-muted-foreground/30 text-2xl font-light">v2.4</span>
                </h1>
            </div>
            <div className="text-left md:text-right font-mono text-foreground">
                <p className="text-[10px] text-muted-foreground uppercase">Timestamp</p>
                <p className="text-xs">{new Date().toLocaleString()}</p>
            </div>
        </div>

        {/* 1. Growth Metrics (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border mb-12">
            <GrowthStat 
                label="Total Views (Last 7 Days)" 
                value={reportData?.current_views || 0} 
                growth={reportData?.view_growth || 0} 
                icon={Activity} 
                subText="vs last week"
            />
            <GrowthStat 
                label="Badges Earned" 
                value={reportData?.new_badges?.length || 0} 
                growth={null} 
                icon={Zap} 
                subText="No new badges this week"
                positiveSubtext="Earned this week"
            />
            <GrowthStat 
                label="Account Standing" 
                value="Optimal" 
                growth={0} // Forces neutral display
                icon={ShieldCheck} 
                subText="In good standing"
            />
        </div>

        {/* 2. Sector Standing & Peak Asset */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Sector Standing (Phase 4) */}
            <div className="p-8 border border-border bg-background relative">
                <PerformanceScale percentile={reportData?.percentile || 0} />
            </div>

            {/* Top Asset (Phase 4 refined) */}
            <div className="p-8 border border-border bg-secondary/5 flex flex-col justify-between group overflow-hidden relative">
                <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 block">Peak_Performance_Asset</span>
                    <h4 className="text-2xl font-bold uppercase tracking-tighter mb-1 text-foreground">
                        {reportData?.top_asset?.title || topProject?.title || "Awaiting_Data"}
                    </h4>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                            <Eye size={12} /> {reportData?.top_asset?.views || topProject?.views || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-accent">
                            <Star size={12} fill="currentColor" /> {reportData?.top_asset?.likes || topProject?.likes_count || 0}
                        </div>
                    </div>
                </div>

                <Link href={`/project/${reportData?.top_asset?.slug || topProject?.slug || ''}`} className="mt-8 relative z-10">
                    <Button className="w-full rounded-none bg-foreground text-background hover:bg-accent hover:text-white transition-all font-mono text-[10px] uppercase">
                        Re-Deploy_Exposure
                    </Button>
                </Link>
            </div>
        </div>

        {/* 3. Clearance Level & New Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            
            {/* Clearance Level Tracker */}
            <div className="lg:col-span-4 p-8 border border-border bg-secondary/5 flex flex-col justify-between relative overflow-hidden">
                <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mb-2 block">Clearance_Level</span>
                    <div className="text-6xl font-black italic text-foreground">{reportData?.clearance_level || 0}</div>
                </div>

                <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-foreground">
                        <span>Next_Tier_Progress</span>
                        <span>{Math.min(100, ((reportData?.clearance_level || 0) / 10) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-secondary">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((reportData?.clearance_level || 0) / 10) * 100)}%` }}
                            className="h-full bg-accent shadow-[0_0_10px_rgba(255,0,0,0.5)]" 
                        />
                    </div>
                </div>
            </div>

            {/* New Badges Grid */}
            <div className="lg:col-span-8">
                <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-accent" /> Protocols_Activated_This_Cycle
                </h3>
                
                {(reportData?.new_badges?.length || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportData.new_badges.map((badge, i) => (
                            <BadgeNode key={i} badge={badge} isNew={true} />
                        ))}
                    </div>
                ) : (
                    <div className="h-40 border border-dashed border-border flex items-center justify-center text-muted-foreground font-mono text-[10px] uppercase">
                        No_New_Protocols_Detected
                    </div>
                )}
            </div>

        </div>

        {/* 4. Transmission Log Stream */}
        <div className="border border-border bg-background relative mb-12">
                {/* Header: Clear and Descriptive */}
                <div className="p-6 border-b border-border bg-secondary/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 text-foreground">
                            <Activity size={16} className="text-accent" /> Weekly Activity Timeline
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
                            Tracking all major deployments and updates for this cycle
                        </p>
                    </div>
                    <span className="text-[10px] font-mono bg-secondary px-2 py-1 border border-border text-foreground">
                        {reportData?.stream?.length || 0} TOTAL_ACTIONS
                    </span>
                </div>

                <div className="p-6">
                    {reportData?.stream?.length > 0 ? (
                        <div className="flex flex-col">
                            {reportData.stream.map((event, i) => (
                                <TransmissionItem key={i} event={event} />
                            ))}
                        </div>
                    ) : (
                        /* Empty State: Descriptive and Encouraging */
                        <div className="py-16 text-center border border-dashed border-border bg-secondary/5 flex flex-col items-center gap-4">
                            <div className="p-3 bg-background border border-border rounded-full opacity-20 text-foreground">
                                <Rocket size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">Your timeline is quiet.</p>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                    You haven't posted any projects or updates this week. Start shipping to see your activity data here next cycle.
                                </p>
                            </div>
                            <Link href="/create">
                                <button className="text-[10px] font-mono text-accent hover:underline uppercase tracking-widest">
                                    + Deploy_New_Project
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer: Simplified */}
                <div className="p-4 bg-secondary/5 border-t border-border flex justify-between items-center px-6">
                    <span className="text-[9px] font-mono text-muted-foreground">STATUS: DATA_SYNC_COMPLETE</span>
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>
                </div>
            </div>

        {/* 5. Visualizations (Traffic Chart) */}
        <div className="bg-background border border-border overflow-hidden">
            {/* Header with Human-Readable Context */}
            <div className="p-6 border-b border-border bg-secondary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 text-foreground">
                        <Activity size={16} className="text-accent" /> Weekly Traffic Overview
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase mt-1">
                        Visualizing daily reach across all indexed project nodes
                    </p>
                </div>
                
                {/* Quick Insights Legend */}
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase">Avg_Daily</span>
                        <span className="text-xs font-bold text-foreground">185 Views</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-mono text-muted-foreground uppercase">Peak_Day</span>
                        <span className="text-xs font-bold text-accent">Thursday</span>
                    </div>
                </div>
            </div>

            {/* The Chart Canvas */}
            <div className="p-6 h-[350px] w-full relative">
                {/* Subtle Background Grid/Reference Label */}
                <div className="absolute top-10 right-10 opacity-10 pointer-events-none select-none">
                    <span className="text-4xl font-black font-mono text-foreground">ENGAGEMENT_DATA</span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        
                        <XAxis 
                            dataKey="day" 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        
                        <Tooltip 
                            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                            content={<CustomChartTooltip />} 
                        />
                        
                        <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="#ef4444" 
                            fillOpacity={1} 
                            fill="url(#colorViews)" 
                            strokeWidth={2}
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
        
      </div>
    </div>
  );
}

function GrowthStat({ label, value, growth, icon: Icon, subText, positiveSubtext }) {
    const isPositive = growth > 0;
    const isNegative = growth < 0;
    const isNeutral = growth === 0 || growth === null;

    return (
        <div className="bg-background p-8 flex flex-col justify-between h-40 group hover:bg-secondary/5 transition-colors">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-[0.2em]">{label}</span>
                <Icon size={16} className="text-muted-foreground opacity-50" />
            </div>
            
            <div>
                <div className="text-4xl font-bold font-mono tracking-tighter mb-2 text-foreground">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {isNeutral && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
                            <Minus size={12} /> {subText || "No Change"}
                        </div>
                    )}
                    {isPositive && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-green-500 uppercase">
                            <TrendingUp size={12} /> +{growth.toFixed(1)}% {positiveSubtext || subText}
                        </div>
                    )}
                    {isNegative && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-red-500 uppercase">
                            <TrendingDown size={12} /> {growth.toFixed(1)}% {subText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function CustomChartTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-2 border-b border-border pb-1">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{label} Insight</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                        {payload[0].value} <span className="text-muted-foreground font-light ml-1">Total Views</span>
                    </p>
                    <p className="text-[9px] font-mono text-accent uppercase">
                        Status: Optimal_Flow
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

function BadgeNode({ badge, isNew }) {
  // Switched hardcoded defaults to standard Tailwind dynamic variables
  const style = badge.style || {
    glow_color: "shadow-sm",
    border_color: "border-border",
    bg_gradient: "from-secondary/40 to-background"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-full p-4 border ${style.border_color} bg-gradient-to-br ${style.bg_gradient} ${style.glow_color} overflow-hidden group`}
    >
      {isNew && (
        <div className="absolute top-0 right-0 bg-accent text-white text-[8px] font-mono px-2 py-0.5 uppercase tracking-tighter z-10">
          New_Access
        </div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 relative flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
          <Image src={badge.image} alt={badge.name} fill className="object-contain" />
        </div>
        
        <div className="min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-tight truncate text-foreground">{badge.name}</h4>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{badge.rarity}_Protocol</p>
        </div>
      </div>

      {/* Decorative corner - lowered opacity and mapped to theme */}
      <div className="absolute -bottom-1 -right-1 opacity-20">
        <ShieldCheck size={40} className="text-muted-foreground/30" />
      </div>
    </motion.div>
  );
}

function PerformanceScale({ percentile }) {
  const visualPos = 100 - percentile;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Sector_Standing</span>
            <h4 className="text-xl font-bold uppercase italic text-foreground">
                {percentile <= 5 ? "ELITE_NODE" : percentile <= 20 ? "HIGH_VELOCITY" : "ACTIVE_OPERATOR"}
            </h4>
        </div>
        <div className="text-right">
            <span className="text-2xl font-black text-accent">{visualPos.toFixed(0)}%</span>
            <span className="text-[10px] font-mono text-muted-foreground block uppercase">RANK_PROXIMITY</span>
        </div>
      </div>

      <div className="relative h-12 border border-border bg-secondary/5 overflow-hidden flex items-center px-4">
        {/* Dynamic Track grid adapting to theme border var */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_98%,hsl(var(--border))_98%)] bg-[size:10%_100%] pointer-events-none" />
        
        {/* The Slider background mapped to theme */}
        <div className="w-full h-1 bg-secondary relative">
            <motion.div 
                initial={{ left: 0 }}
                animate={{ left: `${visualPos}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-accent border-2 border-background shadow-[0_0_15px_rgba(255,0,0,0.5)] rotate-45"
            />
            {/* Average Marker */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 flex flex-col items-center">
                <div className="w-px h-2 bg-muted-foreground" />
                <span className="text-[8px] font-mono text-muted-foreground uppercase">SYS_AVG</span>
            </div>
        </div>
      </div>
      
      <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
         Analysis: Your node velocity is currently higher than <span className="text-foreground font-bold">{visualPos.toFixed(0)}%</span> of active creators in the network.
      </p>
    </div>
  );
}

const TYPE_CONFIG = {
    deployment: { icon: Rocket, color: "text-blue-500", label: "New Project Launched" },
    patch: { icon: GitCommit, color: "text-accent", label: "Project Updated" },
    arena: { icon: Trophy, color: "text-yellow-500", label: "Contest Joined" },
};

function TransmissionItem({ event }) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.patch;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 py-5 border-b border-border/50 last:border-0 group">
      {/* Icon with a simpler background */}
      <div className={`mt-1 p-2 bg-secondary/20 border border-border ${config.color} flex-shrink-0 transition-all`}>
        <Icon size={16} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock size={10} /> {new Date(event.created_at).toLocaleDateString()}
            </span>
        </div>
        
        {/* Descriptive Text */}
        <h4 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
            {event.label}
        </h4>
      </div>

      <div className="hidden md:flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <ArrowRight size={14} className="text-accent" />
      </div>
    </div>
  );
}