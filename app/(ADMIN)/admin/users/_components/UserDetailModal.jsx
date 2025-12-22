"use client";
import { 
  X, Shield, Ban, Mail, Key, Activity, 
  FileCode, ThumbsUp, AlertTriangle, Calendar, ExternalLink 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link"; // Added Link import
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

// --- MOCK ANALYTICS DATA ---
const ACTIVITY_DATA = [
  { day: 'Mon', posts: 12, likes: 45, reports: 0 },
  { day: 'Tue', posts: 18, likes: 55, reports: 1 },
  { day: 'Wed', posts: 8, likes: 20, reports: 0 },
  { day: 'Thu', posts: 25, likes: 80, reports: 2 },
  { day: 'Fri', posts: 20, likes: 60, reports: 0 },
  { day: 'Sat', posts: 5, likes: 15, reports: 0 },
  { day: 'Sun', posts: 2, likes: 10, reports: 0 },
];

const RECENT_POSTS = [
    { id: 1, slug: "neural-dashboard-v2", title: "Neural Dashboard v2", date: "2h ago", status: "public" },
    { id: 2, slug: "go-redis-starter", title: "Go-Redis Starter", date: "1d ago", status: "public" },
    { id: 3, slug: "untitled-draft", title: "Untitled Draft", date: "3d ago", status: "private" },
    { id: 4, slug: "crypto-miner", title: "Crypto Miner (Suspicious)", date: "1w ago", status: "flagged" },
];

export default function UserDetailModal({ user, isOpen, onClose }) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] bg-black border border-white/10 p-0 gap-0 rounded-none overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header Section */}
        <div className="p-6 border-b border-white/10 bg-zinc-900/30 flex justify-between items-start">
            <div className="flex gap-5">
                <div className="relative w-20 h-20 border border-white/10 bg-zinc-900">
                    <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-black ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {user.name}
                        {user.role === 'admin' && <Shield size={16} className="text-purple-500" />}
                    </h2>
                    <p className="text-zinc-500 font-mono text-sm mb-2">{user.email}</p>
                    <div className="flex gap-2">
                        <Badge label={`ID: ${user.id}`} />
                        <Badge label={user.role} color="blue" />
                        <Badge label="PRO_PLAN" color="gold" />
                    </div>
                </div>
            </div>
            <DialogClose asChild>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </DialogClose>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Projects" value="42" icon={FileCode} />
                <StatCard label="Total Likes" value="8.5k" icon={ThumbsUp} />
                <StatCard label="Reports Received" value="3" icon={AlertTriangle} color="red" />
                <StatCard label="Risk Score" value="12%" icon={Activity} color="green" />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Activity Volume */}
                <div className="bg-zinc-900/20 border border-white/10 p-4">
                    <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4">Post & Engagement Volume</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ACTIVITY_DATA}>
                                <defs>
                                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="day" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="likes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLikes)" />
                                <Area type="monotone" dataKey="posts" stroke="#fff" fill="transparent" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-zinc-900/20 border border-white/10 p-4">
                    <h3 className="text-xs font-mono text-zinc-500 uppercase mb-4">Moderation Events</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ACTIVITY_DATA}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="day" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#222'}} content={<CustomTooltip />} />
                                <Bar dataKey="reports" fill="#ef4444" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Recent Activity List */}
            <div className="border border-white/10">
                <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xs font-mono text-zinc-400 uppercase">Recent Submissions</h3>
                    <button className="text-[10px] text-zinc-500 hover:text-white uppercase">View All</button>
                </div>
                <div className="divide-y divide-white/5">
                    {RECENT_POSTS.map((post) => (
                        <Link 
                            key={post.id} 
                            href={`/project/${post.slug}`} 
                            target="_blank" 
                            className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <FileCode size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">{post.title}</span>
                                    <ExternalLink size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                <span className={post.status === 'flagged' ? 'text-red-500' : ''}>{post.status.toUpperCase()}</span>
                                <span>{post.date}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/30 flex justify-between items-center">
            <div className="flex gap-2">
                <Button variant="outline" className="h-9 bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white text-xs font-mono rounded-none uppercase">
                    <Mail size={14} className="mr-2" /> Email
                </Button>
                <Button variant="outline" className="h-9 bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white text-xs font-mono rounded-none uppercase">
                    <Key size={14} className="mr-2" /> Reset Key
                </Button>
            </div>
            
            <Button className="h-9 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-600 hover:text-white rounded-none text-xs font-mono uppercase tracking-wider">
                <Ban size={14} className="mr-2" /> Ban User
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// --- SUB COMPONENTS ---

function Badge({ label, color }) {
    const style = color === 'blue' ? 'text-blue-400 border-blue-900/50 bg-blue-900/10' : 
                  color === 'gold' ? 'text-yellow-500 border-yellow-900/50 bg-yellow-900/10' : 
                  'text-zinc-500 border-zinc-800 bg-zinc-900';
    return (
        <span className={`text-[10px] px-2 py-0.5 border font-mono uppercase tracking-wider ${style}`}>
            {label}
        </span>
    )
}

function StatCard({ label, value, icon: Icon, color }) {
    const textColor = color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-500' : 'text-white';
    return (
        <div className="bg-zinc-900/20 border border-white/10 p-4 flex flex-col justify-between h-24">
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{label}</span>
                <Icon size={14} className="text-zinc-600" />
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
        </div>
    )
}

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-white/20 p-2 shadow-xl">
          <p className="text-[10px] font-mono text-zinc-400 mb-1">{label}</p>
          {payload.map((pld, index) => (
              <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: pld.stroke || pld.fill }} />
                  <p className="text-xs font-bold text-white">
                    {pld.value} <span className="text-zinc-500 font-mono text-[9px] uppercase">{pld.dataKey}</span>
                  </p>
              </div>
          ))}
        </div>
      );
    }
    return null;
}