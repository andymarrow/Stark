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

// FIX: Added 'onUpdate' prop
export default function UserDetailModal({ user, isOpen, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview"); 
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [profileReports, setProfileReports] = useState([]);
  const [projectReports, setProjectReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchDeepData = async () => {
      setLoading(true);
      try {
        // ... (Keep existing fetch logic exactly the same) ...
        const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
        const { data: projectsData } = await supabase.from('projects').select('id, likes_count, created_at, title, slug, status').eq('owner_id', user.id).order('created_at', { ascending: false });
        const totalLikes = projectsData?.reduce((acc, p) => acc + (p.likes_count || 0), 0) || 0;
        const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
        const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
        const { data: profReports } = await supabase.from('reports').select('*').eq('target_user_id', user.id).is('project_id', null).order('created_at', { ascending: false });
        
        const userProjectIds = projectsData?.map(p => p.id) || [];
        let projReports = [];
        if (userProjectIds.length > 0) {
            const { data } = await supabase.from('reports').select(`*, project:projects(title, slug, id)`).in('project_id', userProjectIds).order('created_at', { ascending: false });
            projReports = data || [];
        }

        setStats({
            projects: projectCount || 0,
            likes: totalLikes,
            followers: followersCount || 0,
            following: followingCount || 0,
            reports: (profReports?.length || 0) + (projReports?.length || 0),
            riskScore: Math.min(100, ((profReports?.length || 0) + (projReports?.length || 0)) * 15)
        });

        setRecentProjects(projectsData?.slice(0, 5) || []);
        setProfileReports(profReports || []);
        setProjectReports(projReports || []);

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
      const action = isBanned ? "Unban" : "Ban";
      const newRole = isBanned ? 'creator' : 'banned';

      if (!confirm(`Are you sure you want to ${action} this user?`)) return;

      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
      
      if (!error) { 
          toast.success(`User ${action}ned`); 
          if (onUpdate) onUpdate(); // Refresh Parent List
          onClose(); 
      } else {
          toast.error("Action Failed");
      }
  };

  const handleDeleteUser = async () => {
      const confirmText = prompt("Type 'DELETE' to confirm permanent deletion. This destroys all data.");
      if (confirmText !== 'DELETE') return;

      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      
      if (!error) { 
          toast.success("User Deleted"); 
          if (onUpdate) onUpdate(); // Refresh Parent List
          onClose(); 
      } else {
          toast.error("Deletion Failed");
      }
  };

  const handleTakedownProject = async (id, title) => {
      if (!confirm(`Remove "${title}"?`)) return;
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) {
          toast.success("Project Removed");
          setProjectReports(prev => prev.filter(r => r.project_id !== id));
          if (onUpdate) onUpdate(); // Optional: Refresh stats if project count matters
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
      <DialogContent className="max-w-4xl w-[95vw] bg-black border border-white/10 p-0 gap-0 rounded-none overflow-hidden max-h-[90vh] flex flex-col">
        
        <ModalHeader user={user} />
        <TabsHeader activeTab={activeTab} setActiveTab={setActiveTab} reportCount={stats?.reports || 0} />

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-black">
            {loading ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-white" /></div>
            ) : (
                <>
                    {activeTab === 'overview' && <OverviewTab stats={stats} recentProjects={recentProjects} setActiveTab={setActiveTab} />}
                    {activeTab === 'reports' && <ReportsTab profileReports={profileReports} projectReports={projectReports} onTakedown={handleTakedownProject} />}
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