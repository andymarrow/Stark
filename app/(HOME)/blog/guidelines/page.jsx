// app/(HOME)/blog/guidelines/page.jsx
import Link from "next/link";
import { ArrowLeft, Flame, ShieldAlert, Terminal, FileCode, CheckCircle2, XOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Intelligence Guidelines | Stark",
  description: "Protocols and algorithms governing the Stark Intelligence Network.",
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 max-w-4xl animate-in fade-in duration-700">
        
        <div className="mb-12">
            <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground hover:text-foreground transition-colors mb-8">
                <ArrowLeft size={14} /> Return to Network
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 border border-accent/30 text-accent">
                    <Terminal size={24} />
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground">
                    Network Protocols
                </h1>
            </div>
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest border-l-2 border-accent pl-3">
                Version 1.0.4 // Access Level: Public
            </p>
        </div>

        <div className="space-y-12">
            
            {/* SECTION 1: THE ALGORITHM */}
            <section className="bg-secondary/5 border border-border p-6 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                
                <h2 className="text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                    <Flame size={20} className="text-accent" /> 1. The Hype Matrix (Algorithm)
                </h2>
                
                <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none font-sans text-foreground/80 leading-relaxed mb-8">
                    <p>
                        Stark does not use standard chronological feeds. To ensure the highest quality engineering documentation surfaces to the top, the <strong>Neural Indexer</strong> calculates visibility using a weighted formula. Passive consumption is rewarded less than active discourse.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="border border-border bg-background p-4">
                        <span className="text-[10px] text-muted-foreground uppercase block mb-2">Raw Traffic</span>
                        <div className="text-2xl font-bold text-foreground mb-1">1x</div>
                        <span className="text-[9px] uppercase tracking-widest text-zinc-500">Multiplier per View</span>
                    </div>
                    <div className="border border-accent/30 bg-accent/5 p-4 shadow-[inset_0_0_15px_rgba(220,38,38,0.05)]">
                        <span className="text-[10px] text-accent uppercase block mb-2">Endorsements</span>
                        <div className="text-2xl font-bold text-accent mb-1">5x</div>
                        <span className="text-[9px] uppercase tracking-widest text-accent/70">Multiplier per Star</span>
                    </div>
                    <div className="border border-green-500/30 bg-green-500/5 p-4">
                        <span className="text-[10px] text-green-500 uppercase block mb-2">Margin Signals</span>
                        <div className="text-lg font-bold text-green-500 mb-1 leading-tight">BOOSTED</div>
                        <span className="text-[9px] uppercase tracking-widest text-green-500/70">Inline Comments prioritize content</span>
                    </div>
                </div>
            </section>

            {/* SECTION 2: QUALITY STANDARDS */}
            <section className="bg-secondary/5 border border-border p-6 md:p-10">
                <h2 className="text-xl font-bold uppercase tracking-tight text-foreground flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                    <FileCode size={20} className="text-foreground" /> 2. Quality Standards
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-green-500 flex items-center gap-2 mb-4">
                            <CheckCircle2 size={14} /> Expected Formatting
                        </h4>
                        <ul className="space-y-3 text-xs font-sans text-foreground/80">
                            <li className="flex items-start gap-2">
                                <span className="text-accent mt-0.5">•</span> 
                                <strong>Code Blocks:</strong> Use the terminal syntax highlighter provided in the Dual-Pane Editor for all code snippets.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-accent mt-0.5">•</span> 
                                <strong>Attached Assets:</strong> Always provide a Cover Asset. Reports without covers are penalized in the visual matrix.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-accent mt-0.5">•</span> 
                                <strong>Tagging:</strong> Accurately classify your report using the Hash system (max 5 tags).
                            </li>
                        </ul>
                    </div>
                    
                    <div className="bg-background border border-border p-5">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Writer's Console Notice</h4>
                        <p className="text-[11px] font-sans text-foreground/70 leading-relaxed italic">
                            "The Dual-Pane Editor supports raw Markdown injection. You may copy documents directly from Obsidian, Notion, or GitHub Readme files into the right-side terminal. The visual console will compile the data automatically."
                        </p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: RESTRICTED CONTENT */}
            <section className="border border-red-500/20 bg-red-500/5 p-6 md:p-10">
                <h2 className="text-xl font-bold uppercase tracking-tight text-red-500 flex items-center gap-3 mb-6 border-b border-red-500/20 pb-4">
                    <ShieldAlert size={20} /> 3. Restricted Transmissions
                </h2>
                
                <p className="text-sm font-sans text-foreground/80 mb-6">
                    The Stark Network is actively moderated. Violations of these protocols will result in an immediate node blackout (account ban) without warning.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        "SEO Spam or Keyword Stuffing",
                        "AI-Generated 'Slop' without human editing",
                        "Malicious code or unverified execution links",
                        "Harassment via Margin Signals",
                        "Plagiarism without source attribution",
                        "Off-topic content (Keep it engineering/design focused)"
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-background border border-red-500/10 p-3 text-xs font-mono text-red-400">
                            <XOctagon size={14} className="shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </section>

        </div>

      </div>
    </div>
  );
}