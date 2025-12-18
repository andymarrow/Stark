"use client";
import React, { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  ArrowUpRight, ArrowDownRight, Activity, Users, MousePointer2, ShieldCheck, GitCommit, Loader2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { mockOverview } from "@/data/mockDashboard"; // Keeping your existing mock import

// --- MOCK DATA FOR CHARTS & COMMITS ---
const TRAFFIC_DATA = [
  { name: "Mon", visits: 4000, bounce: 2400 },
  { name: "Tue", visits: 3000, bounce: 1398 },
  { name: "Wed", visits: 2000, bounce: 9800 },
  { name: "Thu", visits: 2780, bounce: 3908 },
  { name: "Fri", visits: 1890, bounce: 4800 },
  { name: "Sat", visits: 2390, bounce: 3800 },
  { name: "Sun", visits: 3490, bounce: 4300 },
];

const MOCK_RECENT_COMMITS = [
    { _id: "101", message: "feat: add dark mode toggle", author: "jessica_dev", riskScore: 10, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { _id: "102", message: "fix: api rate limiting bug", author: "david_backend", riskScore: 85, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { _id: "103", message: "chore: update npm packages", author: "bot_sys", riskScore: 45, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { _id: "104", message: "style: landing page redesign", author: "sarah_ui", riskScore: 5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

export default function DashboardOverview() {
  // 1. Local State Simulation
  const [activeProject, setActiveProject] = useState({ _id: "demo", name: "E-Commerce V2" });
  const [recentCommits, setRecentCommits] = useState(undefined); // undefined triggers loading state

  // 2. Simulate Data Fetching
  useEffect(() => {
    const timer = setTimeout(() => {
        setRecentCommits(MOCK_RECENT_COMMITS);
    }, 1200); // 1.2s delay
    return () => clearTimeout(timer);
  }, []);

  // Helper to determine status based on Risk Score
  const getStatus = (score) => {
    if (score >= 80) return { label: 'Critical', color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    if (score >= 40) return { label: 'Warning', color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { label: 'Safe', color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h2>
            <p className="text-slate-500 dark:text-slate-400">
                Here's what's happening with <span className="font-semibold text-slate-900 dark:text-white">{activeProject.name}</span> today.
            </p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Last updated: Real-time</span>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockOverview.metrics.map((metric, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {metric.title}
                    </CardTitle>
                    {metric.title.includes("Visits") ? <Users className="h-4 w-4 text-slate-400" /> :
                     metric.title.includes("Session") ? <Activity className="h-4 w-4 text-slate-400" /> :
                     metric.title.includes("Bounce") ? <MousePointer2 className="h-4 w-4 text-slate-400" /> :
                     <ShieldCheck className="h-4 w-4 text-slate-400" />}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</div>
                    <div className="flex items-center text-xs mt-1">
                        {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />}
                        {metric.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />}
                        <span className={metric.trend === 'up' ? "text-green-500 font-medium" : metric.trend === 'down' ? "text-red-500 font-medium" : "text-slate-500"}>
                            {metric.change}
                        </span>
                        <span className="text-slate-400 ml-1">from last month</span>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* 3. Main Charts Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Traffic Chart */}
        <Card className="col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>Daily visitors vs. bounce rate.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={TRAFFIC_DATA}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
                            <Area type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* --- 4. COMMITS CARD --- */}
        <Card className="col-span-3 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <CardHeader>
                <CardTitle>Recent Code Commits</CardTitle>
                <CardDescription>
                    Real-time security scans from GitHub.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <div className="space-y-6">
                    {/* A. Loading State */}
                    {recentCommits === undefined && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mb-2 text-brand-500" />
                            <p className="text-xs">Syncing commits...</p>
                        </div>
                    )}

                    {/* B. Empty State */}
                    {recentCommits && recentCommits.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center">
                            <GitCommit className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">No commits scanned yet.</p>
                            <p className="text-xs mt-1">Push code to GitHub to trigger the AI agent.</p>
                        </div>
                    )}

                    {/* C. Data List */}
                    {recentCommits && recentCommits.slice(0, 5).map((commit, i) => {
                        const status = getStatus(commit.riskScore || 0);
                        return (
                            <div key={commit._id} className="flex items-start gap-4 group">
                                <div className="relative mt-1">
                                    <div className="z-10 relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-brand-500/50 transition-colors">
                                        <GitCommit className="h-4 w-4 text-slate-500" />
                                    </div>
                                    {/* Vertical Line */}
                                    {i !== recentCommits.length - 1 && (
                                        <div className="absolute left-4 top-8 h-12 w-px bg-slate-200 dark:bg-slate-800" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1 pb-2">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        {commit.message}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{commit.author}</span>
                                        <span>•</span>
                                        <span>
                                            {commit.createdAt 
                                                ? formatDistanceToNow(commit.createdAt, { addSuffix: true }) 
                                                : "Just now"}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {recentCommits && recentCommits.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/dashboard/code">
                            <Button variant="outline" size="sm" className="w-full text-xs">
                                View Full Scan History
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}