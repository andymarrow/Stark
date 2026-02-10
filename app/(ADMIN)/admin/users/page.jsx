"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  MoreHorizontal, Shield, Ban, Trash2, ShieldAlert, 
  User, Search, Loader2, RefreshCw 
} from "lucide-react";
import Image from "next/image";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import UserDetailModal from "./_components/UserDetailModal"; 
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/Pagination";

const ITEMS_PER_PAGE = 10; 

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
        // 1. Build Query
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' }) 
            .order('created_at', { ascending: false })
            .range(from, to);

        // 2. Apply Search Filter if exists
        if (searchTerm) {
            query = query.or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        }

        const { data: usersData, count, error } = await query;
        if (error) throw error;

        const userIds = usersData.map(u => u.id);

        if (userIds.length > 0) {
            // 3. Fetch Risk Stats
            const [userRepRes, projRepRes, commRepRes] = await Promise.all([
                supabase.from('reports').select('target_user_id').in('target_user_id', userIds),
                supabase.from('reports').select('project:projects!inner(owner_id)').in('project.owner_id', userIds),
                supabase.from('reports').select('comment:comments!inner(user_id)').in('comment.user_id', userIds)
            ]);

            const processed = usersData.map(u => {
                const uReports = userRepRes.data?.filter(r => r.target_user_id === u.id).length || 0;
                const pReports = projRepRes.data?.filter(r => r.project?.owner_id === u.id).length || 0;
                const cReports = commRepRes.data?.filter(r => r.comment?.user_id === u.id).length || 0;
                return {
                    ...u,
                    reportStats: { total: uReports + pReports + cReports, user: uReports, project: pReports, comment: cReports }
                };
            });
            setUsers(processed);
        } else {
            setUsers([]);
        }
        setTotalCount(count || 0);
    } catch (err) {
        console.error(err);
        toast.error("Failed to load user database");
    } finally {
        setLoading(false);
    }
  }, [page, searchTerm]);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        setPage(1); // Reset to first page on search
        fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle page changes
  useEffect(() => {
    fetchUsers();
  }, [page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // --- ACTIONS ---

  const toggleAdminRole = async (user) => {
    const newRole = user.role === 'admin' ? 'creator' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (!error) {
        toast.success(`User set to ${newRole}`);
        fetchUsers();
    }
  };

  const toggleBan = async (user) => {
    const isBanned = user.role === 'banned';
    const newRole = isBanned ? 'creator' : 'banned';
    if (!confirm(isBanned ? "Unban User?" : "Ban User?")) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (!error) {
        toast.success(isBanned ? "User Re-activated" : "User Banned");
        fetchUsers();
    }
  };

  const deleteUser = async (user) => {
      const confirmText = prompt(`Type "PURGE" to permanently delete @${user.username} and all their data.`);
      if (confirmText !== 'PURGE') return;

      toast.loading("Initiating total system wipe...", { id: 'delete-user' });
      
      try {
          // CALL THE SQL FUNCTION WE CREATED IN STEP 1
          const { error } = await supabase.rpc('delete_user_entirely', { 
              target_user_id: user.id 
          });

          if (error) throw error;

          toast.success("User and all associated data purged.", { id: 'delete-user' });
          fetchUsers();
      } catch (err) {
          console.error(err);
          toast.error("Purge Protocol Failed", { id: 'delete-user' });
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Database</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                Nodes_In_Registry: <span className="text-white font-bold">{totalCount}</span>
            </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                    type="text" 
                    placeholder="Search Identity..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black border border-white/10 text-xs font-mono text-white h-10 pl-10 pr-3 focus:border-red-600 focus:outline-none transition-colors" 
                />
            </div>
            <Button onClick={() => fetchUsers()} className="h-10 w-10 p-0 bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-400">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
        </div>
      </div>

      <div className="bg-black border border-white/10"> 
            <AdminTable headers={["User Identity", "Role", "Risk Profile", "Status", "Joined", "Actions"]}>
                {loading && users.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></td></tr>
                ) : users.length > 0 ? (
                    users.map((user) => (
                        <AdminRow key={user.id} className="cursor-pointer">
                            <AdminCell onClick={() => setSelectedUser(user)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 relative rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                                        <Image src={user.avatar_url || "/placeholder.jpg"} alt="av" fill className="object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-zinc-200 truncate">{user.full_name || "Unknown"}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">@{user.username}</div>
                                    </div>
                                </div>
                            </AdminCell>

                            <AdminCell mono onClick={() => setSelectedUser(user)}>
                                <span className={`px-2 py-0.5 border text-[10px] uppercase ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10 font-bold' : 'border-zinc-800 text-zinc-500'}`}>
                                    {user.role}
                                </span>
                            </AdminCell>

                            <AdminCell mono onClick={() => setSelectedUser(user)}>
                                {user.reportStats?.total > 0 ? (
                                    <div className="flex gap-2 text-[10px] font-bold">
                                        <span className="text-red-400">R:{user.reportStats.total}</span>
                                    </div>
                                ) : (
                                    <span className="text-green-500/30 text-[10px]">CLEAN</span>
                                )}
                            </AdminCell>

                            <AdminCell mono onClick={() => setSelectedUser(user)}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'banned' ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`} />
                                    <span className={`text-[10px] uppercase ${user.role === 'banned' ? 'text-red-600' : 'text-green-500'}`}>
                                        {user.role === 'banned' ? 'BANNED' : 'ACTIVE'}
                                    </span>
                                </div>
                            </AdminCell>

                            <AdminCell mono className="text-zinc-600 text-[10px]">
                                {new Date(user.created_at).toLocaleDateString()}
                            </AdminCell>

                            <AdminCell>
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none text-zinc-300 w-48 z-[100]">
                                        <DropdownMenuLabel className="font-mono text-[10px] uppercase text-zinc-600 px-3 py-2">System_Directives</DropdownMenuLabel>
                                        
                                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" onClick={() => setSelectedUser(user)}>
                                            <Shield className="mr-2 h-3.5 w-3.5 text-blue-400" /> View Dossier
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono py-2" onClick={() => toggleAdminRole(user)}>
                                            <ShieldAlert className="mr-2 h-3.5 w-3.5 text-purple-400" /> 
                                            {user.role === 'admin' ? "Revoke Admin Status" : "Grant Admin Status"}
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator className="bg-white/10" />

                                        <DropdownMenuItem className="focus:bg-orange-950 text-orange-500 cursor-pointer text-xs font-mono py-2" onClick={() => toggleBan(user)}>
                                            <Ban className="mr-2 h-3.5 w-3.5" /> {user.role === 'banned' ? 'Unban Identity' : 'Ban Identity'}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="focus:bg-red-900 text-white cursor-pointer text-xs font-mono py-2" onClick={() => deleteUser(user)}>
                                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Records
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </AdminCell>
                        </AdminRow>
                    ))
                ) : (
                    <tr><td colSpan={6} className="p-20 text-center text-zinc-600 font-mono text-xs italic">NO_MATCHING_IDENTITIES_FOUND</td></tr>
                )}
            </AdminTable>
            
            <div className="p-4 border-t border-white/5 bg-zinc-900/20">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} isLoading={loading} />
            </div>
      </div>

      <UserDetailModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} onUpdate={fetchUsers} />
    </div>
  );
}