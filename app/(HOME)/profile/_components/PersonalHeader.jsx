"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Edit3, Share2, MapPin, Link as LinkIcon, Calendar, Camera, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { COUNTRIES } from "@/app/constants/options";

export default function PersonalHeader({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  
  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
        // Check if user's location is in our list
        const isStandard = COUNTRIES.some(c => c.value === user.location);
        // If they have a location but it's not in our list, show the custom input mode
        if (user.location && !isStandard) {
            setUseCustomLocation(true);
        }

        setFormData({
            full_name: user.full_name || "",
            bio: user.bio || "",
            location: user.location || "",
            website: user.website || "",
            avatar_url: user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        });
    }
  }, [user]);

  // --- 1. HANDLE IMAGE UPLOAD ---
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: "Max size is 2MB." });
        return;
    }

    setIsUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('project-assets')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('project-assets')
            .getPublicUrl(fileName);

        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        toast.success("Image Uploaded", { description: "Don't forget to click Save Changes." });

    } catch (error) {
        console.error(error);
        toast.error("Upload Failed", { description: error.message });
    } finally {
        setIsUploading(false);
    }
  };

  // --- 2. SAVE PROFILE TO DB ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                avatar_url: formData.avatar_url,
            })
            .eq('id', user.id);

        if (error) throw error;

        toast.success("Profile Updated", { description: "Your digital identity has been synced." });
        setIsEditing(false);
        if (onUpdate) onUpdate(); 
        
    } catch (error) {
        toast.error("Update Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  // Helper to trigger the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper for Location Select
  const handleLocationSelect = (e) => {
    const val = e.target.value;
    if (val === "OTHER") {
        setUseCustomLocation(true);
        setFormData(prev => ({ ...prev, location: "" }));
    } else {
        setUseCustomLocation(false);
        setFormData(prev => ({ ...prev, location: val }));
    }
  };

  return (
    <div className="bg-background border-b border-border pb-8">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* 1. Cover / Banner Area */}
      <div className="h-32 w-full bg-secondary/30 border-b border-border relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        {/* Cover Image Edit Trigger (Future Feature) */}
        <button className="absolute top-4 right-4 bg-black/50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent">
            <Camera size={16} />
        </button>
      </div>

      <div className="container mx-auto px-4 -mt-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
            
            {/* Avatar with Edit Trigger */}
            <div 
                className="relative group cursor-pointer" 
                onClick={() => setIsEditing(true)}
            >
                <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-background bg-secondary relative overflow-hidden shadow-lg">
                    <Image 
                        src={formData.avatar_url} 
                        alt="Me" 
                        fill 
                        className="object-cover" 
                    />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-mono cursor-pointer">
                    EDIT
                </div>
            </div>

            {/* --- EDIT PROFILE DIALOG --- */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[500px] border-border bg-background p-0 rounded-none gap-0">
                    <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                        <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <Edit3 size={18} />
                            Edit Profile
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 space-y-6">
                        {/* Avatar Upload UI */}
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 border border-border">
                                {isUploading ? (
                                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                                        <Loader2 className="animate-spin text-muted-foreground" size={20} />
                                    </div>
                                ) : (
                                    <Image src={formData.avatar_url} alt="Preview" fill className="object-cover" />
                                )}
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={triggerFileInput} 
                                disabled={isUploading}
                                className="h-9 rounded-none border-dashed border-border hover:border-accent text-xs font-mono"
                            >
                                <UploadCloud size={14} className="mr-2" />
                                {isUploading ? "Uploading..." : "Change Avatar"}
                            </Button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase text-muted-foreground">Full Name</Label>
                                <Input 
                                    value={formData.full_name} 
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-mono uppercase text-muted-foreground">Bio</Label>
                                <textarea 
                                    value={formData.bio} 
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    className="flex min-h-[80px] w-full border border-border bg-secondary/10 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono uppercase text-muted-foreground flex justify-between">
                                        Location
                                        {useCustomLocation && (
                                            <button 
                                                onClick={() => setUseCustomLocation(false)} 
                                                className="text-[9px] text-accent hover:underline cursor-pointer"
                                            >
                                                List
                                            </button>
                                        )}
                                    </Label>
                                    
                                    {useCustomLocation ? (
                                        <Input 
                                            value={formData.location} 
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            placeholder="City, Country..."
                                            className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData.location}
                                                onChange={handleLocationSelect}
                                                className="w-full h-10 bg-secondary/10 border border-border px-3 text-sm focus:border-accent outline-none rounded-none appearance-none transition-colors"
                                            >
                                                <option value="">Select...</option>
                                                {COUNTRIES.map((c) => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                                <option disabled>──────</option>
                                                <option value="OTHER">Other...</option>
                                            </select>
                                            {/* Arrow Icon */}
                                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-mono uppercase text-muted-foreground">Website</Label>
                                    <Input 
                                        value={formData.website} 
                                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                                        className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            className="rounded-none border-border hover:bg-secondary"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving || isUploading}
                            className="bg-accent hover:bg-accent/90 text-white rounded-none"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Info (Display Mode) */}
            <div className="flex-1 w-full pt-2 md:pt-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            {user?.full_name || user?.email?.split('@')[0]}
                            {user?.is_for_hire && (
                                <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/50 px-2 py-0.5 font-mono tracking-wider uppercase">HIREABLE</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">@{user?.username}</p>
                        
                        <p className="mt-3 text-sm max-w-lg text-foreground/80 font-light">
                            {user?.bio || "No bio yet. Click edit to add one."}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-1"><MapPin size={12}/> {user?.location || "Unknown"}</div>
                            <div className="flex items-center gap-1"><LinkIcon size={12}/> {user?.website || "No Link"}</div>
                            <div className="flex items-center gap-1"><Calendar size={12}/> Joined {new Date(user?.created_at).getFullYear()}</div>
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Button 
                            onClick={() => setIsEditing(true)} 
                            className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground hover:border-accent hover:text-accent rounded-none font-mono text-xs uppercase tracking-wide"
                        >
                            <Edit3 size={14} className="mr-2" /> Edit Profile
                        </Button>
                        
                        <Button className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground hover:border-foreground rounded-none font-mono text-xs uppercase tracking-wide">
                            <Share2 size={14} className="mr-2" /> Share
                        </Button>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
}