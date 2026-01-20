"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Save, Trash2, Edit3, 
  Megaphone, Clock, X, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AnnouncementEditor from "./_components/AnnouncementEditor"; 
import AdminMediaManager from "./_components/AdminMediaManager"; 
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/app/_context/AuthContext";

// --- CUSTOM DATE PICKER (From Contest Page) ---
const DateTimePicker = ({ label, value, onChange }) => {
  const inputRef = useRef(null);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase text-muted-foreground">{label}</label>
      <div 
        className="relative group cursor-pointer"
        onClick={() => inputRef.current?.showPicker()} 
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-red-600 transition-colors pointer-events-none">
          <Calendar size={14} />
        </div>
        <Input 
          ref={inputRef}
          type="datetime-local" 
          value={value}
          onChange={onChange}
          className="pl-9 rounded-none bg-black border-white/10 text-white text-xs cursor-pointer font-mono h-10 focus:border-red-600" 
        />
        {!value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Clock size={12} className="text-red-500 animate-pulse" />
            </div>
        )}
      </div>
    </div>
  );
};

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "update",
    content: {}, 
    media: [], 
    tags: [],
    scheduled_for: new Date(),
    banner_expires_at: null,
    comments_allowed: true,
    status: "published"
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  const resetForm = () => {
    setFormData({
        title: "",
        category: "update",
        content: {},
        media: [],
        tags: [],
        scheduled_for: new Date(),
        banner_expires_at: null,
        comments_allowed: true,
        status: "published"
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
        title: item.title,
        category: item.category,
        content: item.content,
        media: item.media || [],
        tags: item.tags || [],
        scheduled_for: new Date(item.scheduled_for),
        banner_expires_at: item.banner_expires_at ? new Date(item.banner_expires_at) : null,
        comments_allowed: item.comments_allowed,
        status: item.status
    });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return toast.error("Title required");

    const payload = {
        ...formData,
        admin_id: user.id,
        updated_at: new Date()
    };

    let error;
    if (editingItem) {
        const { error: err } = await supabase.from('announcements').update(payload).eq('id', editingItem.id);
        error = err;
    } else {
        const { error: err } = await supabase.from('announcements').insert(payload);
        error = err;
    }

    if (error) {
        console.error(error);
        toast.error("Failed to save");
    } else {
        toast.success("Broadcast Sent");
        setIsEditorOpen(false);
        resetForm();
        fetchItems();
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Purge this transmission?")) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchItems();
    toast.success("Deleted");
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="text-red-600" /> Broadcast Console
        </h1>
        <Button 
            onClick={() => { resetForm(); setIsEditorOpen(true); }}
            className="bg-red-600 hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase"
        >
            <Plus size={14} className="mr-2" /> New Transmission
        </Button>
      </div>

      {/* List */}
      <div className="border border-white/10 bg-black">
        <div className="grid grid-cols-12 gap-4 p-3 border-b border-white/10 bg-zinc-900/50 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Schedule</div>
            <div className="col-span-2 text-right">Actions</div>
        </div>
        {items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-5 font-bold text-zinc-200 truncate flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase">{item.category}</span>
                </div>
                <div className="col-span-2">
                    <span className={`text-[10px] px-2 py-0.5 border uppercase ${
                        item.status === 'published' ? 'border-green-900 text-green-500 bg-green-900/20' : 
                        'border-yellow-900 text-yellow-500 bg-yellow-900/20'
                    }`}>
                        {item.status}
                    </span>
                </div>
                <div className="col-span-3 text-xs font-mono text-zinc-500 flex flex-col">
                    <span>GO: {format(new Date(item.scheduled_for), "MMM dd, HH:mm")}</span>
                    {item.banner_expires_at && <span className="text-red-900">EXP: {format(new Date(item.banner_expires_at), "MMM dd, HH:mm")}</span>}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white"><Edit3 size={14}/></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-900/20 text-zinc-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
            </div>
        ))}
      </div>

      {/* Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl w-full bg-black border border-white/10 p-0 gap-0 h-[90vh] flex flex-col">
            <DialogHeader className="p-6 border-b border-white/10 bg-zinc-900/50">
                <DialogTitle className="text-xl font-bold font-mono uppercase tracking-widest text-white flex items-center gap-2">
                    {editingItem ? "Edit Signal" : "New Signal"}
                </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Meta Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-mono text-zinc-500 uppercase">Headline</Label>
                        <Input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="bg-black border-white/10 text-white rounded-none focus:border-red-600 h-12" 
                            placeholder="v2.0 System Update"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-mono text-zinc-500 uppercase">Category</Label>
                        <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full h-12 bg-black border border-white/10 text-white text-sm px-3 focus:outline-none focus:border-red-600"
                        >
                            <option value="update">System Update</option>
                            <option value="event">Event / Hackathon</option>
                            <option value="hiring">Hiring / Jobs</option>
                            <option value="alert">Critical Alert</option>
                            <option value="countdown">Live Countdown</option>
                            <option value="exciting">Exciting / Fun</option>
                        </select>
                    </div>
                </div>

                {/* 2. Visual Assets (Carousel) */}
                <div className="space-y-2">
                    <Label className="text-xs font-mono text-zinc-500 uppercase">Visual Assets (Carousel)</Label>
                    <AdminMediaManager 
                        media={formData.media} 
                        onChange={(m) => setFormData({...formData, media: m})} 
                    />
                </div>

                {/* 3. Editor */}
                <div className="space-y-2">
                    <Label className="text-xs font-mono text-zinc-500 uppercase">Transmission Content</Label>
                    <AnnouncementEditor 
                        content={formData.content} 
                        onChange={(json) => setFormData({...formData, content: json})}
                    />
                </div>

                {/* 4. Scheduling */}
                <div className="p-4 border border-white/10 bg-zinc-900/20 space-y-4">
                    <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                        <Clock size={14} className="text-red-600" /> Temporal Controls
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Go Live Date */}
                        <DateTimePicker 
                            label="Go Live Date (UTC)"
                            value={formatDateForInput(formData.scheduled_for)}
                            onChange={(e) => setFormData({...formData, scheduled_for: new Date(e.target.value)})}
                        />

                        {/* Banner Expiry */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Banner Expiry (Optional)</Label>
                                {formData.banner_expires_at && (
                                    <button 
                                        onClick={() => setFormData({...formData, banner_expires_at: null})} 
                                        className="text-[10px] text-red-500 hover:underline font-mono uppercase"
                                    >
                                        CLEAR
                                    </button>
                                )}
                            </div>
                            <DateTimePicker 
                                label="Set Expiry"
                                value={formatDateForInput(formData.banner_expires_at)}
                                onChange={(e) => setFormData({...formData, banner_expires_at: new Date(e.target.value)})}
                            />
                        </div>

                    </div>
                </div>

                {/* 5. Toggles */}
                <div className="flex flex-col md:flex-row md:items-center gap-8 p-4 bg-zinc-900/20 border border-white/10">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="comments" 
                            checked={formData.comments_allowed}
                            onCheckedChange={(c) => setFormData({...formData, comments_allowed: c})}
                            className="data-[state=checked]:bg-red-600"
                        />
                        <Label htmlFor="comments" className="text-zinc-300">Allow Comments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="status" 
                            checked={formData.status === 'published'}
                            onCheckedChange={(c) => setFormData({...formData, status: c ? 'published' : 'draft'})}
                            className="data-[state=checked]:bg-green-600"
                        />
                        <Label htmlFor="status" className="text-zinc-300">Publish Immediately</Label>
                    </div>
                </div>

            </div>

            <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono uppercase tracking-widest min-w-[140px]">
                    <Save size={14} className="mr-2" /> Save Protocol
                </Button>
            </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}