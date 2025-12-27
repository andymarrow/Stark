"use client";
import { useState, useEffect } from "react";
import { MoreHorizontal, Shield, Ban, Mail, Key, ShieldAlert, CheckCircle2, User, Trash2 } from "lucide-react";
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

  // Add Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  

  // Update Fetch Logic
  const fetchUsers = async () => {
    setLoading(true);
    
    // Calculate Range
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' }) // Get count
        .order('created_at', { ascending: false })
        .range(from, to); // Apply range
    
    if (error) {
        toast.error("Failed to load users");
    } else {
        setUsers(data);
        setTotalCount(count || 0); // Set total
    }
    setLoading(false);
  };

  // Re-fetch on page change
  useEffect(() => {
    fetchUsers();
  }, [page]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // --- 2. ACTIONS ---
  const toggleAdminRole = async (user) => {
    const newRole = user.role === 'admin' ? 'creator' : 'admin';
    toast.promise(
        async () => {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
            if (error) throw error;
            fetchUsers();
        },
        { loading: "Updating role...", success: `User is now ${newRole}`, error: "Failed" }
    );
  };

  const toggleBan = async (user) => {
    const isBanned = user.role === 'banned';
    const newRole = isBanned ? 'creator' : 'banned';
    
    if (!confirm(isBanned ? "Unban User?" : "Ban User?")) return;

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    if (!error) {
        toast.success(isBanned ? "User Active" : "User Banned");
        fetchUsers();
    } else {
        toast.error("Action Failed");
    }
  };

  const deleteUser = async (user) => {
      if (prompt(`Type DELETE to remove ${user.username}`) !== 'DELETE') return;
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (!error) {
          toast.success("User Deleted");
          fetchUsers();
      } else {
          toast.error("Failed");
      }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Database</h1>
            <p className="text-zinc-500 font-mono text-xs">TOTAL_RECORDS: {users.length}</p>
        </div>
        <div className="flex gap-2">
            <input type="text" placeholder="Find user..." className="bg-black border border-white/10 text-xs font-mono text-white h-9 pl-3 pr-3 w-48 focus:border-red-600 focus:outline-none" />
            <Button className="h-9 bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase">Export CSV</Button>
        </div>
      </div>

      <div className="bg-black border border-white/10 flex flex-col"> 
      {/* The Table */}
            <AdminTable headers={["User Identity", "Role", "Status", "Joined", "Actions"]}>
                {users.map((user) => (
                    <AdminRow key={user.id} className="cursor-pointer">
                        
                        {/* Identity */}
                        <AdminCell onClick={() => setSelectedUser(user)}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 relative rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                                    <Image src={user.avatar_url || "/placeholder.jpg"} alt={user.username} fill className="object-cover" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-200">{user.full_name || "Unknown"}</div>
                                    <div className="text-xs text-zinc-500 font-mono">@{user.username}</div>
                                </div>
                            </div>
                        </AdminCell>

                        {/* Role */}
                        <AdminCell mono onClick={() => setSelectedUser(user)}>
                            <span className={`px-2 py-1 border text-[10px] uppercase ${user.role === 'admin' ? 'border-red-500/50 text-red-400 bg-red-900/20 font-bold' : user.role === 'banned' ? 'border-zinc-700 text-zinc-500 line-through' : 'border-zinc-700 text-zinc-400'}`}>
                                {user.role}
                            </span>
                        </AdminCell>

                        {/* Status */}
                        <AdminCell mono onClick={() => setSelectedUser(user)}>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'banned' ? 'bg-red-600' : 'bg-green-500'}`} />
                                <span className={`uppercase ${user.role === 'banned' ? 'text-red-600' : 'text-green-500'}`}>
                                    {user.role === 'banned' ? 'SUSPENDED' : 'ACTIVE'}
                                </span>
                            </div>
                        </AdminCell>

                        {/* Date */}
                        <AdminCell mono className="text-zinc-500" onClick={() => setSelectedUser(user)}>
                            {new Date(user.created_at).toLocaleDateString()}
                        </AdminCell>

                        {/* Actions */}
                        <AdminCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none text-zinc-300 w-48">
                                    <DropdownMenuLabel className="font-mono text-xs uppercase text-zinc-600">User Actions</DropdownMenuLabel>
                                    
                                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono" onClick={() => setSelectedUser(user)}>
                                        <Shield className="mr-2 h-3 w-3" /> View Dossier
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono" onClick={() => toggleAdminRole(user)}>
                                        {user.role === 'admin' ? <><User className="mr-2 h-3 w-3" /> Revoke Admin</> : <><ShieldAlert className="mr-2 h-3 w-3" /> Make Admin</>}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/10" />

                                    <DropdownMenuItem className="focus:bg-orange-900/20 text-orange-500 cursor-pointer text-xs font-mono" onClick={() => toggleBan(user)}>
                                        <Ban className="mr-2 h-3 w-3" /> {user.role === 'banned' ? 'Unban User' : 'Ban User'}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="focus:bg-red-900/20 text-red-500 cursor-pointer text-xs font-mono" onClick={() => deleteUser(user)}>
                                        <Trash2 className="mr-2 h-3 w-3" /> Delete Data
                                    </DropdownMenuItem>

                                </DropdownMenuContent>
                            </DropdownMenu>
                        </AdminCell>
                    </AdminRow>
                ))}
            </AdminTable>
      {/* NEW PAGINATION */}
            <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
            />
      
      </div>

      {/* Detail Modal with Refresh Callback */}
      <UserDetailModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onUpdate={fetchUsers} // Pass refetch function
      />

    </div>
  );
}