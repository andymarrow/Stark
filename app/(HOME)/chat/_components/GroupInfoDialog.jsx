"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Users, UserPlus, X, Shield, Image as ImageIcon, Link as LinkIcon, 
  FileVideo, Search, Edit3, Camera, LogOut, Trash2, Copy, Check, Loader2, Mail
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";

const TABS = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'gifs', label: 'GIFs', icon: FileVideo }, 
    { id: 'links', label: 'Links', icon: LinkIcon },
];

export default function GroupInfoDialog({ isOpen, onClose, conversation }) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('members');
  const [data, setData] = useState({ members: [], media: [], gifs: [], links: [] });
  const [loading, setLoading] = useState(true);
  
  // Admin Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    avatar_url: ""
  });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const isOwner = user?.id && (
    conversation?.owner_id === user.id || 
    conversation?.ownerId === user.id
  );

  // --- SYNC STATE ---
  useEffect(() => {
      if (conversation && !isEditing) {
          setEditForm({
            title: conversation.title || conversation.name || "",
            description: conversation.description || "",
            avatar_url: conversation.avatar_url || conversation.avatar || ""
          });
      }
  }, [conversation, isEditing]);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (isOpen && conversation?.id) fetchData();
  }, [isOpen, conversation]);

  // --- GLOBAL SEARCH DEBOUNCE ---
  useEffect(() => {
    if (!isOwner || !searchQuery || activeTab !== 'members') {
        setGlobalSearchResults([]);
        return;
    }

    // Only search globally if query length is sufficient
    if (searchQuery.length < 3) return;

    const delayDebounceFn = setTimeout(async () => {
        setIsSearchingGlobal(true);
        try {
            // Search profiles that are NOT already in the group
            // Note: This is a simplified logic. Ideally, we filter out existing members in JS or SQL.
            const { data: users } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, settings')
                .ilike('username', `%${searchQuery}%`)
                .limit(5);
            
            // Filter out users already in the group
            const existingIds = new Set(data.members.map(m => m.profile.id));
            const filtered = (users || []).filter(u => !existingIds.has(u.id));
            
            setGlobalSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearchingGlobal(false);
        }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isOwner, activeTab, data.members]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const { data: members } = await supabase
            .from('conversation_participants')
            .select('role, profile:profiles(id, username, avatar_url, bio)')
            .eq('conversation_id', conversation.id);

        const { data: media } = await supabase
            .from('messages')
            .select('id, text, created_at')
            .eq('conversation_id', conversation.id)
            .eq('type', 'image') 
            .order('created_at', { ascending: false });

        const { data: gifs } = await supabase
            .from('messages')
            .select('id, text, created_at')
            .eq('conversation_id', conversation.id)
            .eq('type', 'gif') 
            .order('created_at', { ascending: false });

        const { data: links } = await supabase
            .from('messages')
            .select('id, text, created_at')
            .eq('conversation_id', conversation.id)
            .eq('type', 'text')
            .ilike('text', '%http%') 
            .order('created_at', { ascending: false });

        setData({ 
            members: members || [], 
            media: media || [], 
            gifs: gifs || [], 
            links: links || [] 
        });
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
        const { error } = await supabase
            .from('conversations')
            .update({ 
                title: editForm.title, 
                description: editForm.description, 
                avatar_url: editForm.avatar_url 
            })
            .eq('id', conversation.id);
        
        if (error) throw error;
        
        toast.success("Node Info Updated");
        setIsEditing(false);
        router.refresh(); 

    } catch (error) {
        toast.error("Update Failed");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsEditing(true); // Lock editing mode
    const toastId = toast.loading("Uploading...");
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/group-${conversation.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        
        // Update Local & DB
        setEditForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
        await supabase
            .from('conversations')
            .update({ avatar_url: data.publicUrl })
            .eq('id', conversation.id);

        toast.dismiss(toastId);
        toast.success("Avatar Updated");

    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Upload Failed");
    }
  };

  const handleAddUser = async (targetUser) => {
    // 1. Check User Settings
    // NOTE: 'settings' jsonb column: { auto_add: boolean }
    const autoAdd = targetUser.settings?.auto_add !== false; // Default to true if undefined

    try {
        if (autoAdd) {
            // Direct Add
            await supabase.from('conversation_participants').insert({ 
                conversation_id: conversation.id, 
                user_id: targetUser.id, 
                status: 'active', 
                role: 'member' 
            });
            toast.success(`@${targetUser.username} added to node`);
            // Update local list
            fetchData();
            setSearchQuery(""); // Clear search
        } else {
            // Send Invite
            await supabase.from('notifications').insert({ 
                receiver_id: targetUser.id, 
                sender_id: user.id, 
                type: 'system', 
                message: `Invited you to join node: ${conversation.title}`, 
                link: `/chat?id=${conversation.id}` // In a real app, this might go to an invite page
            });
            toast.info(`Invite signal sent to @${targetUser.username}`);
            setSearchQuery("");
        }
    } catch (error) {
        toast.error("Operation Failed");
    }
  };

  const handleLeaveOrDelete = async () => {
    if (isOwner) {
        if (confirm("WARNING: Delete channel and all history?")) {
            await supabase.from('conversations').delete().eq('id', conversation.id);
            toast.success("Node Destroyed");
            router.push('/chat');
            onClose();
        }
    } else {
        if (confirm("Disconnect from this node?")) {
            await supabase.from('conversation_participants').delete().eq('conversation_id', conversation.id).eq('user_id', user.id);
            toast.success("Disconnected");
            router.push('/chat');
            onClose();
        }
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/chat?id=${conversation.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Uplink Copied");
  };

  // --- FILTER LOGIC FOR MEMBERS ---
  const displayedMembers = isOwner && searchQuery && globalSearchResults.length > 0
    ? data.members // If searching globally as admin, still show existing members below results? Or hide? Let's keep showing them.
    : data.members.filter(m => m.profile?.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border border-border p-0 gap-0 rounded-none sm:max-w-[500px] h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
        
        {/* --- HEADER --- */}
        <div className="relative bg-zinc-950 border-b border-border shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors">
                <X size={16} />
            </button>

            <div className="p-6 pt-10 flex flex-col items-center text-center">
                
                {/* Avatar */}
                <div className="relative group mb-4">
                    <div className="relative w-24 h-24 rounded-full border-2 border-white/10 bg-zinc-900 overflow-hidden shadow-2xl">
                        {editForm.avatar_url ? (
                            <Image src={editForm.avatar_url} alt="Group" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                <Users size={32} />
                            </div>
                        )}
                    </div>
                    {isOwner && (
                        <div 
                            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            onClick={() => {
                                setIsEditing(true);
                                fileInputRef.current?.click();
                            }}
                        >
                            <Camera size={24} className="text-white" />
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                    )}
                </div>

                {/* Info / Edit Mode */}
                {isEditing ? (
                    <div className="w-full space-y-4 px-6 animate-in fade-in zoom-in-95">
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground">Designation</label>
                            <Input 
                                value={editForm.title} 
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                                className="bg-secondary/10 border-white/10 text-center font-bold text-lg h-10 rounded-none focus-visible:ring-accent"
                                placeholder="Node Title"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase text-muted-foreground">Protocol Description</label>
                            <Textarea 
                                value={editForm.description} 
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                                className="bg-secondary/10 border-white/10 text-center text-xs text-muted-foreground min-h-[80px] rounded-none focus-visible:ring-accent resize-none"
                                placeholder="Description..."
                            />
                        </div>
                        <div className="flex gap-2 justify-center pt-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 text-xs rounded-none uppercase">Cancel</Button>
                            <Button size="sm" onClick={handleUpdateProfile} className="h-8 text-xs bg-accent hover:bg-accent/90 rounded-none uppercase px-6"><Check size={12} className="mr-1"/> Save Config</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 justify-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">{editForm.title}</h2>
                            {isOwner && (
                                <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-accent transition-colors">
                                    <Edit3 size={14} />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-zinc-400 max-w-xs mt-2 leading-relaxed">
                            {editForm.description || "No description provided."}
                        </p>
                        
                        <div className="mt-6 flex items-center justify-center gap-6">
                            <StatBadge label="Agents" value={data.members.length} />
                            <div className="w-px h-4 bg-white/10" />
                            <StatBadge label="Assets" value={data.media.length + data.gifs.length} />
                            <div className="w-px h-4 bg-white/10" />
                            <StatBadge label="Links" value={data.links.length} />
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button 
                                onClick={copyLink}
                                className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all px-4 py-1.5 rounded-full text-[10px] font-mono uppercase text-zinc-300"
                            >
                                <Copy size={12} /> {conversation?.is_public ? "Public Link" : "Secure Invite"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b border-border bg-zinc-950 shrink-0">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}
                    `}
                >
                    <tab.icon size={14} /> {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                    )}
                </button>
            ))}
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative bg-zinc-950/50">
            
            {activeTab === 'members' && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="sticky top-0 z-10 -mx-2 px-2 pb-2 bg-transparent">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                className="w-full bg-zinc-900 border border-white/10 pl-9 pr-3 h-10 text-xs text-white font-mono focus:border-accent outline-none placeholder:text-zinc-600 transition-colors"
                                placeholder={isOwner ? "Search global directory..." : "Filter members..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearchingGlobal && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 size={12} className="animate-spin text-accent" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GLOBAL RESULTS (Admin Only) */}
                    {isOwner && searchQuery && globalSearchResults.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-[10px] font-mono uppercase text-accent mb-2 px-2">Global Directory</h4>
                            <div className="space-y-1">
                                {globalSearchResults.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-2 bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                                                <Image src={u.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="User" width={32} height={32} className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">@{u.username}</p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {u.settings?.auto_add !== false ? "Auto-Add Enabled" : "Invite Required"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleAddUser(u)} 
                                            className="h-7 text-[10px] uppercase font-mono rounded-none bg-zinc-800 hover:bg-accent text-white border border-white/10"
                                        >
                                            {u.settings?.auto_add !== false ? <><UserPlus size={12} className="mr-1"/> Add</> : <><Mail size={12} className="mr-1"/> Invite</>}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* EXISTING MEMBERS */}
                    <div>
                        {(isOwner && searchQuery) && <h4 className="text-[10px] font-mono uppercase text-zinc-500 mb-2 px-2">Current Agents</h4>}
                        <div className="space-y-1">
                            {displayedMembers.map((m) => (
                                <div 
                                    key={m.profile.id} 
                                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-sm group transition-colors"
                                >
                                    <div 
                                        className="flex items-center gap-3 cursor-pointer"
                                        onClick={() => window.open(`/profile/${m.profile.username}`, '_blank')}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                                            <Image src={m.profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="Avatar" width={32} height={32} className="object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-none flex items-center gap-1 text-zinc-200 group-hover:text-white transition-colors">
                                                {m.profile.username}
                                                {m.role === 'owner' && <Shield size={10} className="text-accent" />}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">{m.role}</p>
                                        </div>
                                    </div>
                                    {isOwner && m.profile.id !== user.id && (
                                        <button 
                                            onClick={() => {
                                                if(confirm(`Remove @${m.profile.username}?`)) {
                                                    supabase.from('conversation_participants').delete().eq('conversation_id', conversation.id).eq('user_id', m.profile.id).then(() => {
                                                        toast.success("Agent Removed");
                                                        fetchData();
                                                    });
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 p-2 transition-all" 
                                            title="Eject Agent"
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {displayedMembers.length === 0 && (
                                <p className="text-xs text-zinc-600 text-center py-4 font-mono">No matching agents found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MEDIA TAB */}
            {activeTab === 'media' && (
                <div className="grid grid-cols-3 gap-1">
                    {data.media.map((item) => (
                        <div key={item.id} className="aspect-square relative bg-zinc-900 overflow-hidden border border-white/5 group cursor-zoom-in">
                            <Image src={item.text} alt="Media" fill className="object-cover transition-transform group-hover:scale-105" />
                        </div>
                    ))}
                    {data.media.length === 0 && <EmptyState label="No visual assets" />}
                </div>
            )}

            {/* GIFs TAB */}
            {activeTab === 'gifs' && (
                <div className="grid grid-cols-2 gap-2">
                    {data.gifs.map((item) => (
                        <div key={item.id} className="aspect-video relative bg-zinc-900 overflow-hidden rounded-sm border border-white/5">
                            <img src={item.text} className="w-full h-full object-cover" alt="GIF" />
                        </div>
                    ))}
                    {data.gifs.length === 0 && <EmptyState label="No animated assets" />}
                </div>
            )}

            {/* LINKS TAB */}
            {activeTab === 'links' && (
                <div className="space-y-2">
                    {data.links.map((item) => (
                        <div 
                            key={item.id} 
                            className="p-3 bg-zinc-900/50 border border-white/5 rounded-sm flex gap-3 items-center hover:bg-zinc-900 hover:border-accent/30 cursor-pointer transition-colors group" 
                            onClick={() => window.open(item.text, '_blank')}
                        >
                            <div className="p-2 bg-accent/10 text-accent rounded-full shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                                <LinkIcon size={14} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-mono text-zinc-300 truncate group-hover:text-accent transition-colors">{item.text}</p>
                                <span className="text-[9px] text-zinc-600 block mt-0.5 font-mono">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {data.links.length === 0 && <EmptyState label="No uplinks established" />}
                </div>
            )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 border-t border-border bg-zinc-950 shrink-0">
            <Button 
                variant="ghost" 
                onClick={handleLeaveOrDelete}
                className="w-full text-red-500 hover:text-white hover:bg-red-600 font-mono text-xs uppercase h-10 rounded-none border border-red-900/30 transition-all"
            >
                {isOwner ? <><Trash2 size={14} className="mr-2" /> Delete Node</> : <><LogOut size={14} className="mr-2" /> Disconnect</>}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

function StatBadge({ label, value }) {
    return (
        <div className="text-center">
            <div className="text-lg font-bold text-white leading-none">{value}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-mono mt-1">{label}</div>
        </div>
    )
}

function EmptyState({ label }) {
    return (
        <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <Search size={24} className="opacity-20" />
            <span className="text-xs font-mono uppercase">{label}</span>
        </div>
    )
}