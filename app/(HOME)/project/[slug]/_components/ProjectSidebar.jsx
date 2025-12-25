"use client";
import { useState, useEffect, useRef } from "react";
import { Github, Globe, Star, Eye, Calendar, Edit3, Flag, AlertTriangle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
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
  const { user } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Report Form State
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");

  // Like Logic State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(project.stats.stars || 0);

  // View Count State
  const [viewCount, setViewCount] = useState(project.stats.views || 0);
  
  // Ref to ensure we don't count twice in React Strict Mode
  const hasCountedRef = useRef(false);

  // Check if user liked this project on load
  useEffect(() => {
    if (user && project.id) {
      const checkLike = async () => {
        const { data } = await supabase
          .from('project_likes')
          .select('*')
          .eq('project_id', project.id)
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setIsLiked(true);
      };
      checkLike();
    }
    setLikesCount(project.stats.stars || 0);
  }, [user, project.id, project.stats.stars]);

  // --- VIEW COUNTING LOGIC ---
  useEffect(() => {
    const incrementView = async () => {
      // 1. Prevent double counting in Strict Mode
      if (hasCountedRef.current) return;
      hasCountedRef.current = true;

      // --- DISABLED OWNER CHECK FOR TESTING ---
      // We commented this out so you can see the view count go up
      /*
      if (user?.id && user.id === project.author.id) {
        console.log("👀 Owner viewing own project - View NOT counted.");
        return;
      }
      */

      // 2. Optimistic UI update: Increment immediately so user sees it
      setViewCount(prev => prev + 1);

      // 3. Database update
      const { error } = await supabase.rpc('increment_project_view', { 
        project_id: project.id 
      });

      if (error) {
        console.error("❌ Failed to increment view in DB:", error);
      } else {
        console.log("✅ View counted in DB (Owner check disabled)");
      }
    };

    if(project?.id) {
        incrementView();
    }
    
  }, [project.id, user?.id, project.author.id]);

  const toggleLike = async () => {
    if (!user) {
      toast.error("Authentication Required", { description: "Please login to star projects." });
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;
    const newIsLiked = !isLiked;

    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (newIsLiked) {
        const { error } = await supabase
          .from('project_likes')
          .insert({ user_id: user.id, project_id: project.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', project.id);
        if (error) throw error;
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast.error("Action Failed", { description: "Could not update star status." });
    }
  };

  // --- FUNCTIONAL REPORT SUBMISSION ---
  const handleReportSubmit = async () => {
    if (!user) {
      toast.error("Authentication Required", { description: "Please login to report content." });
      return;
    }

    setIsSubmittingReport(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          project_id: project.id,
          reason: reportReason,
          details: reportDetails,
        });

      if (error) throw error;

      toast.success("Report Submitted", { 
        description: "Thank you. Our moderation team has been alerted." 
      });
      
      // Reset form and close
      setReportDetails("");
      setIsReportOpen(false);

    } catch (error) {
      toast.error("Submission Failed", { description: error.message });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const createdDate = new Date(project.created_at || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* 1. The Quality Score Panel */}
      <div className="bg-secondary/10 border border-border p-5 relative group">
        <button 
          onClick={() => setIsReportOpen(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 transition-colors p-1 opacity-50 group-hover:opacity-100"
          title="Report Project"
        >
          <Flag size={14} />
        </button>

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
        {project.source_link && (
          <a href={project.source_link} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-mono text-sm border border-transparent rounded-none">
              <Github className="mr-2 h-4 w-4" />
              View Source Code
            </Button>
          </a>
        )}
        
        {project.demo_link ? (
          <a href={project.demo_link} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 bg-transparent hover:bg-accent/10 text-foreground font-mono text-sm border border-border hover:border-accent rounded-none transition-colors">
              <Globe className="mr-2 h-4 w-4" />
              Live Demo
            </Button>
          </a>
        ) : (
          <Button disabled className="w-full h-12 bg-transparent text-muted-foreground font-mono text-sm border border-border rounded-none opacity-50 cursor-not-allowed">
            <Globe className="mr-2 h-4 w-4" />
            No Live Demo
          </Button>
        )}

        {user?.id === project.author.id && (
          <Link href={`/project/${project.slug || project.id}/edit`} className="w-full">
            <Button variant="outline" className="w-full h-12 bg-secondary/5 hover:bg-secondary/20 text-muted-foreground hover:text-foreground font-mono text-xs border border-dashed border-border hover:border-foreground rounded-none transition-colors uppercase tracking-widest">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Configuration
            </Button>
          </Link>
        )}
      </div>

      {/* 3. Tech Stack Grid */}
      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// TECH_STACK</h3>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech, i) => (
            <div key={i} className="flex items-center border border-border bg-background px-3 py-1.5 hover:border-foreground transition-colors cursor-default">
              <span className="text-xs font-medium">{tech.name || tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Stats Row */}
      <div className="grid grid-cols-3 gap-2 py-4 border-y border-border border-dashed select-none">
        <div 
          onClick={toggleLike}
          className={`text-center p-2 cursor-pointer transition-colors group ${isLiked ? 'bg-accent/10' : 'hover:bg-secondary/20'}`}
        >
          <Star className={`w-4 h-4 mx-auto mb-1 transition-colors ${isLiked ? 'fill-accent text-accent' : 'text-muted-foreground group-hover:text-foreground'}`} />
          <div className={`text-lg font-bold ${isLiked ? 'text-accent' : 'text-foreground'}`}>{likesCount}</div>
          <div className="text-[9px] font-mono text-muted-foreground uppercase">STARS</div>
        </div>

        <StatBox icon={Eye} label="VIEWS" value={viewCount} />
        <StatBox icon={Calendar} label="CREATED" value={createdDate} />
      </div>

      {/* 5. Author Card */}
      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// CREATED_BY</h3>
        <Link 
          href={`/profile/${project.author.username}`}
          className="flex items-center gap-3 p-3 border border-border bg-background hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300 group"
        >
          <div className="relative w-10 h-10 bg-secondary border border-transparent group-hover:border-accent/50 transition-colors">
            <Image src={project.author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="Author" fill className="object-cover" />
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

      {/* 5. Author & Collaborators Card */}
      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// TEAM</h3>
        <div className="flex flex-col gap-2">
            
            {/* Main Author */}
            <CreatorCard 
                user={project.author} 
                role="Owner" 
            />

            {/* Collaborators */}
            {project.collaborators && project.collaborators.map(collab => (
                <CreatorCard 
                    key={collab.id} 
                    user={collab} 
                    role="Collaborator" 
                />
            ))}

        </div>
      </div>

      {/* 6. Footer Actions (Report Trigger) */}
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
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="gap-2">
                <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                  <RadioGroupItem value="malware" id="malware" className="text-accent border-muted-foreground" />
                  <Label htmlFor="malware" className="text-sm font-medium cursor-pointer flex-1">Malicious Code / Virus</Label>
                </div>
                <div className="flex items-center space-x-2 border border-border p-3 hover:bg-secondary/10 cursor-pointer transition-colors">
                  <RadioGroupItem value="broken" id="broken" className="text-accent border-muted-foreground" />
                  <Label htmlFor="broken" className="text-sm font-medium cursor-pointer flex-1">Broken Link / Fake Demo</Label>
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
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the issue (e.g. 'Demo link redirects to ad site')..." 
                className="bg-secondary/5 border-border rounded-none focus-visible:ring-accent min-h-[80px] text-sm"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-none border-border hover:bg-secondary">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleReportSubmit} 
              disabled={isSubmittingReport}
              className="bg-red-600 hover:bg-red-700 text-white rounded-none min-w-[120px]"
            >
              {isSubmittingReport ? <Loader2 className="animate-spin" size={16} /> : "Submit Report"}
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
  );
}

// Sub-component for consistent styling
function CreatorCard({ user, role }) {
    return (
        <Link 
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 p-3 border border-border bg-background hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300 group"
        >
          <div className="relative w-10 h-10 bg-secondary border border-transparent group-hover:border-accent/50 transition-colors shrink-0">
            <Image 
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                alt={user.name} 
                fill 
                className="object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold truncate group-hover:text-accent transition-colors">{user.name}</h4>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">{role}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
          {user.isForHire && (
            <div className="flex flex-col items-end gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Available for hire" />
            </div>
          )}
        </Link>
    )
}