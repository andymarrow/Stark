"use client";
import { useState } from "react";
import { Github, Globe, Star, Eye, Calendar, Edit3, Flag, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link"; 
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ProjectSidebar({ project }) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");

  const handleReportSubmit = () => {
    // API Call would go here
    setIsReportOpen(false);
    alert("Project report submitted for review.");
  };

  return (
    <div className="space-y-8">
        
        {/* 1. The Quality Score Panel */}
        <div className="bg-secondary/10 border border-border p-5 relative group">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">// QUALITY_SCORE</span>
                <span className="text-4xl font-bold text-accent">{project.qualityScore}</span>
            </div>
            <div className="w-full h-1 bg-secondary mt-2">
                <div className="h-full bg-accent" style={{ width: `${project.qualityScore}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                Top 5% of submissions this week.
            </p>
        </div>

        {/* 2. Key Actions */}
        <div className="grid gap-3">
            <Button className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-mono text-sm border border-transparent rounded-none">
                <Github className="mr-2 h-4 w-4" />
                View Source Code
            </Button>
            
            <Button className="w-full h-12 bg-transparent hover:bg-accent/10 text-foreground font-mono text-sm border border-border hover:border-accent rounded-none transition-colors">
                <Globe className="mr-2 h-4 w-4" />
                Live Demo
            </Button>

            {/* Edit Project Button (Visible to Owner) */}
            <Link href={`/project/${project.slug || project.id}/edit`} className="w-full">
                <Button variant="outline" className="w-full h-12 bg-secondary/5 hover:bg-secondary/20 text-muted-foreground hover:text-foreground font-mono text-xs border border-dashed border-border hover:border-foreground rounded-none transition-colors uppercase tracking-widest">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Configuration
                </Button>
            </Link>
        </div>

        {/* 3. Tech Stack Grid */}
        <div>
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// TECH_STACK</h3>
            <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                    <div key={tech.name} className="flex items-center border border-border bg-background px-3 py-1.5 hover:border-foreground transition-colors cursor-default">
                        <span className="text-xs font-medium">{tech.name}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* 4. Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-border border-dashed">
            <StatBox icon={Star} label="STARS" value={project.stats.stars} />
            <StatBox icon={Eye} label="VIEWS" value="18.4k" />
            <StatBox icon={Calendar} label="CREATED" value="2024" />
        </div>

        {/* 5. Author Card */}
        <div>
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// CREATED_BY</h3>
            
            <Link 
                href={`/profile/${project.author.username}`}
                className="flex items-center gap-3 p-3 border border-border bg-background hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300 group"
            >
                <div className="relative w-10 h-10 bg-secondary border border-transparent group-hover:border-accent/50 transition-colors">
                    <Image src={project.author.avatar} alt="Author" fill className="object-cover" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold group-hover:text-accent transition-colors">{project.author.name}</h4>
                    <p className="text-xs text-muted-foreground">@{project.author.username}</p>
                </div>
                {project.author.isForHire && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Available for hire" />
                    </div>
                )}
            </Link>
        </div>

        {/* 6. Footer Actions (Report) */}
        <div className="pt-6 border-t border-border">
            <button 
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-red-500 transition-colors w-full justify-center group"
            >
                <Flag size={12} className="group-hover:fill-current" />
                <span className="uppercase font-mono tracking-wider">Report Issue</span>
            </button>
        </div>

        {/* --- REPORT DIALOG --- */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogContent className="sm:max-w-[425px] border-border bg-background p-0 rounded-none gap-0">
                <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                    <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2 text-red-500">
                        <AlertTriangle size={18} />
                        Report Project
                    </DialogTitle>
                    <DialogDescription className="text-xs font-mono text-muted-foreground mt-1">
                        Help us maintain quality. Reports are anonymous.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase text-muted-foreground">Reason for flagging</Label>
                        <RadioGroup defaultValue="spam" onValueChange={setReportReason} className="gap-2">
                            <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                                <RadioGroupItem value="malware" id="malware" className="text-accent border-muted-foreground" />
                                <Label htmlFor="malware" className="text-sm font-medium cursor-pointer flex-1">Malicious Code / Virus</Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                                <RadioGroupItem value="broken" id="broken" className="text-accent border-muted-foreground" />
                                <Label htmlFor="broken" className="text-sm font-medium cursor-pointer flex-1">Broken Link / Fake Demo</Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                                <RadioGroupItem value="copyright" id="copyright" className="text-accent border-muted-foreground" />
                                <Label htmlFor="copyright" className="text-sm font-medium cursor-pointer flex-1">Copyright Violation</Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                                <RadioGroupItem value="spam" id="spam" className="text-accent border-muted-foreground" />
                                <Label htmlFor="spam" className="text-sm font-medium cursor-pointer flex-1">Spam / Low Quality</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-mono uppercase text-muted-foreground">Additional Details</Label>
                        <Textarea 
                            placeholder="Describe the issue (e.g. 'Demo link redirects to ad site')..." 
                            className="bg-secondary/5 border-border rounded-none focus-visible:ring-accent min-h-[80px] text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-none border-border hover:bg-secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleReportSubmit} className="bg-red-600 hover:bg-red-700 text-white rounded-none">
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}

function StatBox({ icon: Icon, label, value }) {
    return (
        <div className="text-center p-2">
            <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-[9px] font-mono text-muted-foreground uppercase">{label}</div>
        </div>
    )
}