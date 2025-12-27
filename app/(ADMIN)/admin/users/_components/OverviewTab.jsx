"use client";
import { FileCode, ThumbsUp, Activity, Mail, Users, UserPlus } from "lucide-react";
import Link from "next/link";

export default function OverviewTab({ stats, recentProjects, setActiveTab }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Projects" value={stats?.projects || 0} icon={FileCode} />
            <StatCard label="Total Likes" value={stats?.likes || 0} icon={ThumbsUp} />
            <StatCard label="Followers" value={stats?.followers || 0} icon={Users} />
            <StatCard label="Following" value={stats?.following || 0} icon={UserPlus} />
            <StatCard label="Risk Score" value={`${stats?.riskScore || 0}%`} icon={Activity} color={stats?.riskScore > 50 ? "red" : "green"} />
            <div className="p-4 bg-zinc-900/20 border border-white/10 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-zinc-900/40 transition-colors col-span-1 md:col-span-3 lg:col-span-1" onClick={() => setActiveTab('comm')}>
                <Mail size={20} className="text-zinc-400 mb-2" />
                <span className="text-[10px] font-mono uppercase text-zinc-500">Contact User</span>
            </div>
        </div>

        <div className="border border-white/10">
            <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xs font-mono text-zinc-400 uppercase">Recent Submissions</h3>
            </div>
            <div className="divide-y divide-white/5">
                {recentProjects.length > 0 ? recentProjects.map((post) => (
                    <Link 
                        key={post.slug} 
                        href={`/project/${post.slug}`} 
                        target="_blank" 
                        className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <FileCode size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                            <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </Link>
                )) : (
                    <div className="p-4 text-xs font-mono text-zinc-500 text-center">NO_ACTIVITY_LOGGED</div>
                )}
            </div>
        </div>
    </div>
  );
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