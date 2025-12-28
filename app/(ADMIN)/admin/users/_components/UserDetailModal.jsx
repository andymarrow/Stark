"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { sendAdminEmail } from "@/app/actions/adminEmail";
import { Loader2 } from "lucide-react";

// Components
import ModalHeader from "./ModalHeader";
import TabsHeader from "./TabsHeader";
import OverviewTab from "./OverviewTab";
import ReportsTab from "./ReportsTab";
import CommTab from "./CommTab";
import ModalFooter from "./ModalFooter";

export default function UserDetailModal({ user, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview"); 
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  
  // Categorized Reports
  const [profileReports, setProfileReports] = useState([]);
  const [projectReports, setProjectReports] = useState([]);
  const [commentReports, setCommentReports] = useState([]); // New state for comment reports

  const [loading, setLoading] = useState(true);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // --- 1. ANTI-FREEZE MECHANISM ---
  // Forces body unlock when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchDeepData = async () => {
      setLoading(true);
      try {
        // 1. Basic Stats (Projects, Likes)
        const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
        const { data: projectsData } = await supabase.from('projects').select('id, likes_count, created_at, title, slug, status').eq('owner_id', user.id).order('created_at', { ascending: false });
        const totalLikes = projectsData?.reduce((acc, p) => acc + (p.likes_count || 0), 0) || 0;
        
        // 2. Follows
        const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
        const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

        // 3. FETCH ALL REPORTS TARGETING THIS USER
        // We fetch ALL reports, then filter them in JS to avoid complex joins in one go
        // Logic:
        // - Direct Profile Reports (target_user_id = user.id)
        // - Project Reports (project.owner_id = user.id)
        // - Comment Reports (comment.user_id = user.id)

        const { data: allReports } = await supabase
          .from('reports')
          .select(`
            *,
            reporter:profiles!reporter_id(username),
            project:projects(id, title, slug, owner_id),
            comment:comments(id, content, user_id)
          `)
          .order('created_at', { ascending: false });

        // Filter Manually to ensure accuracy
        const userProfReports = [];
        const userProjReports = [];
        const userCommReports = [];

        (allReports || []).forEach(r => {
            if (r.target_user_id === user.id && !r.project_id && !r.comment_id) {
                userProfReports.push(r);
            }
            if (r.project && r.project.owner_id === user.id) {
                userProjReports.push(r);
            }
            if (r.comment && r.comment.user_id === user.id) {
                userCommReports.push(r);
            }
        });

        setStats({
            projects: projectCount || 0,
            likes: totalLikes,
            followers: followersCount || 0,
            following: followingCount || 0,
            reports: userProfReports.length + userProjReports.length + userCommReports.length,
            riskScore: Math.min(100, (userProfReports.length * 20) + (userProjReports.length * 10) + (userCommReports.length * 5))
        });

        setRecentProjects(projectsData?.slice(0, 5) || []);
        
        // Set Categorized Reports
        setProfileReports(userProfReports);
        setProjectReports(userProjReports);
        setCommentReports(userCommReports);

      } catch (error) {
        console.error("Admin Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeepData();
  }, [isOpen, user]);

  // --- ACTIONS ---
  const handleBanUser = async () => {
      const isBanned = user.role === 'banned';
      const newRole = isBanned ? 'creator' : 'banned';
      if (!confirm(`Are you sure you want to ${isBanned ? "Unban" : "Ban"} this user?`)) return;

      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      if (!error) { 
          toast.success(`User ${isBanned ? "Unbanned" : "Banned"}`); 
          if (onUpdate) onUpdate(); 
          onClose(); 
      } else toast.error("Action Failed");
  };

  const handleDeleteUser = async () => {
      const confirmText = prompt("Type 'DELETE' to confirm permanent deletion. This destroys all data.");
      if (confirmText !== 'DELETE') return;
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (!error) { 
          toast.success("User Deleted"); 
          if (onUpdate) onUpdate(); 
          onClose(); 
      } else toast.error("Deletion Failed");
  };

  const handleTakedownProject = async (id) => {
      if (!confirm(`Remove Project?`)) return;
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) {
          toast.success("Project Removed");
          setProjectReports(prev => prev.filter(r => r.project_id !== id));
          if (onUpdate) onUpdate();
      }
  };

  const handleTakedownComment = async (id) => {
      if (!confirm(`Remove Comment?`)) return;
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (!error) {
          toast.success("Comment Removed");
          setCommentReports(prev => prev.filter(r => r.comment_id !== id));
      }
  };

  const handleSendEmail = async () => {
      if (!emailSubject || !emailBody) { toast.error("Missing Content"); return; }
      setSendingEmail(true);
      const res = await sendAdminEmail(user.email, emailSubject, emailBody);
      if (res.success) { toast.success("Sent"); setEmailSubject(""); setEmailBody(""); setActiveTab("overview"); }
      else { toast.error("Failed"); }
      setSendingEmail(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] bg-black border border-white/10 p-0 gap-0 rounded-none overflow-hidden max-h-[90vh] flex flex-col z-[100]">
        
        <ModalHeader user={user} />
        <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} reportCount={stats?.reports || 0} />

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-black">
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-white" /></div>
            ) : (
                <>
                    {activeTab === 'overview' && <OverviewTab stats={stats} recentProjects={recentProjects} setActiveTab={setActiveTab} />}
                    
                    {activeTab === 'reports' && (
                        <ReportsTab 
                            profileReports={profileReports} 
                            projectReports={projectReports} 
                            commentReports={commentReports} // Passed new prop
                            onTakedownProject={handleTakedownProject}
                            onTakedownComment={handleTakedownComment} // Passed handler
                        />
                    )}
                    
                    {activeTab === 'comm' && <CommTab emailSubject={emailSubject} setEmailSubject={setEmailSubject} emailBody={emailBody} setEmailBody={setEmailBody} handleSendEmail={handleSendEmail} sendingEmail={sendingEmail} />}
                </>
            )}
        </div>

        <ModalFooter 
            user={user} 
            onBan={handleBanUser} 
            onDelete={handleDeleteUser} 
            isBanned={user.role === 'banned'} 
        />

      </DialogContent>
    </Dialog>
  );
}