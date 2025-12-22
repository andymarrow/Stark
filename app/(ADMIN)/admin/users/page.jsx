"use client";
import { MoreHorizontal, Shield, Ban, CheckCircle, Mail, Key } from "lucide-react";
import Image from "next/image";
import AdminTable, { AdminRow, AdminCell } from "../_components/AdminTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- MOCK USERS ---
const USERS = [
  { id: "usr_001", name: "Sarah Drasner", email: "sarah@example.com", role: "admin", status: "active", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
  { id: "usr_002", name: "Alex Chen", email: "alex@stark.net", role: "creator", status: "active", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" },
  { id: "usr_003", name: "Spam Bot 3000", email: "bot@spam.com", role: "user", status: "banned", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
  { id: "usr_004", name: "Jane Doe", email: "jane@design.co", role: "creator", status: "pending", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
];

export default function UserManagementPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Database</h1>
            <p className="text-zinc-500 font-mono text-xs">TOTAL_RECORDS: {USERS.length}</p>
        </div>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Find user..." 
                className="bg-black border border-white/10 text-xs font-mono text-white h-9 pl-3 pr-3 w-48 focus:border-red-600 focus:outline-none"
            />
            <Button className="h-9 bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-xs uppercase">
                Export CSV
            </Button>
        </div>
      </div>

      {/* The Table */}
      <AdminTable headers={["User Identity", "Role", "Status", "Joined", "Actions"]}>
        {USERS.map((user) => (
            <AdminRow key={user.id}>
                {/* Identity */}
                <AdminCell>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 relative rounded-full overflow-hidden border border-white/10">
                            <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-zinc-200">{user.name}</div>
                            <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
                        </div>
                    </div>
                </AdminCell>

                {/* Role */}
                <AdminCell mono>
                    <span className={`px-2 py-1 border text-[10px] uppercase ${user.role === 'admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 'border-zinc-700 text-zinc-400'}`}>
                        {user.role}
                    </span>
                </AdminCell>

                {/* Status */}
                <AdminCell mono>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : user.status === 'banned' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="uppercase">{user.status}</span>
                    </div>
                </AdminCell>

                {/* Date */}
                <AdminCell mono className="text-zinc-500">
                    2024-12-20
                </AdminCell>

                {/* Actions */}
                <AdminCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                                <MoreHorizontal size={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black border-white/10 rounded-none text-zinc-300">
                            <DropdownMenuLabel className="font-mono text-xs uppercase text-zinc-600">User Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono">
                                <Mail className="mr-2 h-3 w-3" /> Email User
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-xs font-mono">
                                <Key className="mr-2 h-3 w-3" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-red-900/20 text-red-500 focus:text-red-400 cursor-pointer text-xs font-mono">
                                <Ban className="mr-2 h-3 w-3" /> Ban Account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </AdminCell>
            </AdminRow>
        ))}
      </AdminTable>

    </div>
  );
}