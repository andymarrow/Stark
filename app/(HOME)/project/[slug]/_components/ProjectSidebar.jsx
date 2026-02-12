"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Github, 
  Globe, 
  Star, 
  Eye, 
  Calendar, 
  Edit3, 
  Flag, 
  AlertTriangle, 
  Loader2,
  Youtube,
  Figma,
  Play,
  ExternalLink,
  Award,
  Zap,
  CheckCircle,
  Users // Added for the header icon
} from "lucide-react";
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
import { getAvatar } from "@/constants/assets";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { registerView } from "@/app/actions/viewAnalytics"; 

export default function ProjectSidebar({ project }) {
  const { user } = useAuth();
  
  // --- COLLABORATOR STATE ---
  const [collaborators, setCollaborators] = useState([]);

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
  
  // --- RANKING STATE ---
  const [rankPercentile, setRankPercentile] = useState(null);
  const [loadingRank, setLoadingRank] = useState(true);

  // Ref to ensure we don't count twice in React Strict Mode
  const hasCountedRef = useRef(false);

  // --- 0. FETCH COLLABORATORS & STATUS ---
  useEffect(() => {
    const fetchTeam = async () => {
        // We fetch directly from DB to get the 'status' (pending/accepted)
        const { data, error } = await supabase
            .from('collaborations')
            .select(`
                status, 
                user:profiles!user_id(*)
            `)
            .eq('project_id', project.id);

        if (!error && data) {
            // Flatten the data so we have the user object + their status
            const formatted = data.map(item => {
                if (!item.user) return null;
                return {
                    ...item.user,
                    collaborationStatus: item.status // 'pending' or 'accepted'
                };
            }).filter(Boolean);
            
            setCollaborators(formatted);
        } else if (project.collaborators) {
             // Fallback to props if DB fetch fails, assuming accepted
             setCollaborators(project.collaborators.map(c => ({...c, collaborationStatus: 'accepted'})));
        }
    };

    fetchTeam();
  }, [project.id, project.collaborators]);


  // 1. Check if user liked this project on load
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

  // 2. --- VIEW COUNTING LOGIC ---
  useEffect(() => {
    const incrementView = async () => {
      if (hasCountedRef.current) return;
      
      if (user?.id === project.author.id) return;

      hasCountedRef.current = true;
      const res = await registerView('project', project.id);
      if (res?.success) {
          // View successfully registered in analytics ledger
      }
    };

    if(project?.id) incrementView();
  }, [project.id, user, project.author.id]);

  // 3. --- DYNAMIC RANK CALCULATION ---
  useEffect(() => {
    const calculateGlobalRank = async () => {
        try {
            setLoadingRank(true);
            
            // Fetch total published projects count
            const { count: totalProjects } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published');

            // Fetch count of projects with a strictly higher quality score
            const { count: higherRanked } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published')
                .gt('quality_score', project.qualityScore);

            if (totalProjects > 0) {
                // Calculation: (Number of projects better than this / Total projects) * 100
                const percentile = ((higherRanked || 0) / totalProjects) * 100;
                setRankPercentile(percentile);
            }
        } catch (error) {
            console.error("Rank Engine Error:", error);
        } finally {
            setLoadingRank(false);
        }
    };

    if (project?.qualityScore !== undefined) {
        calculateGlobalRank();
    }
  }, [project.qualityScore]);

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
      toast.success("Report Submitted", { description: "Moderators have been alerted." });
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

  // --- UI RENDERER: RANK BADGE ---
  const renderRankBadge = () => {
    if (loadingRank) return "Analyzing System Index...";
    
    // Top 5% logic
    if (rankPercentile !== null && rankPercentile <= 5) {
        const displayPercent = Math.max(1, Math.ceil(rankPercentile));
        return (
            <span className="flex items-center gap-1.5 text-accent animate-in fade-in slide-in-from-left-2 duration-700">
                <Award size={12} className="fill-accent/20" />
                TOP {displayPercent}% OF GLOBAL DEPLOYMENTS
            </span>
        );
    }

    // High Quality (Top 20%)
    if (rankPercentile !== null && rankPercentile <= 20) {
        return (
            <span className="flex items-center gap-1.5 text-blue-500">
                <Zap size={12} className="fill-blue-500/20" />
                HIGH-VELOCITY ASSET
            </span>
        );
    }

    // Default status for everyone else
    return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle size={12} />
            VERIFIED SYSTEM SUBMISSION
        </span>
    );
  };

  const renderProjectActions = () => {
    const projectType = project.type?.toLowerCase();

    if (projectType === 'video') {
      return (
        <a href={project.source_link} target="_blank" rel="noopener noreferrer">
          <Button className="w-full h-14 bg-[#FF0000] hover:bg-[#CC0000] text-white font-mono text-sm border border-transparent rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
            <Youtube className="mr-2 h-5 w-5" />
            Watch on YouTube
          </Button>
        </a>
      );
    }

    if (projectType === 'design') {
      return (
        <div className="grid gap-3">
          <a href={project.source_link} target="_blank" rel="noopener noreferrer">
            <Button className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-mono text-sm border border-transparent rounded-none">
              <Figma className="mr-2 h-4 w-4" />
              View Design File
            </Button>
          </a>
          
          {project.demo_link ? (
            <a href={project.demo_link} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-12 bg-transparent hover:bg-accent/10 text-foreground font-mono text-sm border border-border hover:border-accent rounded-none transition-colors">
                <Play className="mr-2 h-4 w-4" />
                View Prototype
              </Button>
            </a>
          ) : (
            <Button disabled className="w-full h-12 bg-transparent text-muted-foreground font-mono text-sm border border-border rounded-none opacity-50 cursor-not-allowed">
              <ExternalLink className="mr-2 h-4 w-4" />
              No Prototype
            </Button>
          )}
        </div>
      );
    }

    return (
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
            <Button variant="outline" className="w-full h-12 bg-transparent hover:bg-accent/10 text-foreground font-mono text-sm border border-border hover:border-accent hover:text-accent rounded-none transition-colors">
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
      </div>
    );
  };

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
          <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${project.qualityScore}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 font-mono uppercase tracking-tighter">
            {renderRankBadge()}
        </p>
      </div>

      {/* 2. Key Actions */}
      <div className="space-y-3">
        {renderProjectActions()}

        {user?.id === project.author.id && (
          <Link href={`/project/${project.slug || project.id}/edit`} className="w-full block">
            <Button variant="outline" className="w-full h-12 mt-3 bg-secondary/5 hover:bg-secondary/20 text-muted-foreground hover:text-foreground font-mono text-xs border border-dashed border-border hover:border-foreground rounded-none transition-colors uppercase tracking-widest">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Configuration
            </Button>
          </Link>
        )}
      </div>

      {/* 3. Team Section (UPDATED) */}
      <div className="space-y-6">
        
        {/* Creator */}
        {project.author && (
            <div>
               <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">// CREATED_BY</h3>
               <CreatorCard user={project.author} role="Owner" />
            </div>
        )}

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <div>
            <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest flex items-center gap-2">
               // COLLABORATORS 
               <span className="flex items-center gap-1 text-[9px] bg-secondary px-1.5 py-0.5 rounded-sm text-muted-foreground">
                  <Users size={10} /> {collaborators.length}
               </span>
            </h3>
            <div className="flex flex-col gap-2">
                {collaborators.map((collab, index) => (
                    <CreatorCard 
                        key={collab.id || index} 
                        user={collab} 
                        role="Collaborator" 
                        status={collab.collaborationStatus} // Pass status prop
                    />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Tech Stack Grid */}
      <div>
        <h3 className="text-xs font-mono text-muted-foreground uppercase mb-4 tracking-widest">
          // {project.type?.toLowerCase() === 'video' ? 'TOOLKIT' : 'TECH_STACK'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech, i) => (
            <div key={i} className="flex items-center border border-border bg-background px-3 py-1.5 hover:border-foreground transition-colors cursor-default">
              <span className="text-xs font-medium">{tech.name || tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Stats Row */}
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

      {/* 6. Footer Actions */}
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
                placeholder="Describe the issue..." 
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

// --- UPDATED CREATOR CARD WITH STATUS INDICATORS ---
function CreatorCard({ user, role, status }) {
    if (!user) return null;
    const displayName = user.name || user.full_name || user.username || "Anonymous";

    // Status Logic
    const isPending = status === 'pending';
    const showStatus = role === 'Collaborator' && status;

    return (
        <Link 
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 p-3 border border-border bg-background hover:border-accent hover:shadow-[4px_4px_0px_0px_rgba(var(--accent),0.1)] transition-all duration-300 group"
        >
          <div className="relative w-10 h-10 bg-secondary border border-transparent group-hover:border-accent/50 transition-colors shrink-0">
            <Image src={getAvatar(user)} alt={displayName} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
                <h4 className="text-sm font-bold truncate group-hover:text-accent transition-colors">{displayName}</h4>
                <div className="flex items-center gap-2">
                    {/* Role Label */}
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{role}</span>
                </div>
            </div>
            
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                
                {/* STATUS INDICATOR (Visible for Collaborators) */}
                {showStatus && (
                    <div className="flex items-center gap-1.5" title={isPending ? "Invitation Pending" : "Active Collaborator"}>
                        {isPending && <span className="text-[8px] font-mono text-amber-500 uppercase">PENDING</span>}
                        <span 
                            className={`
                                w-2 h-2 rounded-full 
                                ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}
                            `} 
                        />
                    </div>
                )}
            </div>
          </div>

          {/* Hire Indicator (Only if not a pending collaborator to avoid clutter) */}
          {user.isForHire && !isPending && (
            <div className="flex flex-col items-end gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Available for hire" />
            </div>
          )}
        </Link>
    )
}