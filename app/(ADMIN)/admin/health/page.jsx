"use client";
import { useState, useEffect } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import HealthMetricsGrid from "./_components/HealthMetricsGrid";
import TrafficChart from "./_components/TrafficChart";
import NodeStatusGrid from "./_components/NodeStatusGrid";
import { Button } from "@/components/ui/button";

export default function SystemHealthPage() {
  const [counts, setCounts] = useState({ users: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: projects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        
        setCounts({ 
            users: users || 0, 
            projects: projects || 0 
        });
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Activity className="text-green-500" /> System Diagnostics
            </h1>
            <p className="text-zinc-500 font-mono text-xs">STATUS: ONLINE | REGION: US-EAST-1</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="h-8 bg-black text-zinc-400 border-white/10 hover:text-white">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/10 border border-green-900/50 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-mono text-green-500 font-bold">LIVE</span>
            </div>
        </div>
      </div>

      {/* 1. Real Database Metrics */}
      <HealthMetricsGrid userCount={counts.users} projectCount={counts.projects} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Main Traffic Graph (Simulated) */}
        <div className="lg:col-span-2">
            <TrafficChart />
        </div>

        {/* 3. Server Status (Mocked Infrastructure) */}
        <div className="lg:col-span-1">
            <NodeStatusGrid />
        </div>

      </div>

    </div>
  );
}