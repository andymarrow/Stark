"use client";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

export default function OverviewTab({ contest }) {
  const content = typeof contest.description === 'object' ? contest.description.text : contest.description;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Cover Art */}
        <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase">Cover Asset</h4>
            <div className="relative aspect-video w-full border border-white/10 bg-zinc-900">
                <Image src={contest.cover_image || "/placeholder.jpg"} alt="cover" fill className="object-cover" />
            </div>
        </div>

        {/* Prizes Audit */}
        <div className="space-y-2">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase">Prize Pool Audit</h4>
            <div className="border border-white/10 bg-zinc-900/20 p-4 space-y-2">
                {(contest.prizes || []).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-zinc-300 border-b border-white/5 pb-1 last:border-0">
                        <span>#{p.rank} {p.title}</span>
                        <span className="font-mono text-accent">{p.reward}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Content Read */}
        <div className="md:col-span-2 space-y-2">
            <h4 className="text-[10px] font-mono text-zinc-500 uppercase">Description Content</h4>
            <div className="border border-white/10 bg-zinc-900/20 p-6 max-h-[300px] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{content || "No content."}</ReactMarkdown>
                </div>
            </div>
        </div>

    </div>
  );
}