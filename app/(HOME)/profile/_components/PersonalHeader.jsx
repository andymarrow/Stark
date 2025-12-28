"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Edit3, 
  Share2, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  Camera, 
  UploadCloud, 
  Loader2, 
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon
} from "lucide-react";
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
import { COUNTRIES } from "@/constants/options";

export default function PersonalHeader({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false); 
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  
  // Username Validation States
  const [usernameStatus, setUsernameStatus] = useState("idle"); 
  const [usernameError, setUsernameError] = useState("");

  // Refs for the hidden file inputs
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
    banner_url: "", 
  });

  // Alphabetize countries for the dropdown
  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
        const isStandard = COUNTRIES.some(c => c.value === user.location);
        if (user.location && !isStandard) {
            setUseCustomLocation(true);
        }

        setFormData({
            full_name: user.full_name || "",
            username: user.username || "",
            bio: user.bio || "",
            location: user.location || "",
            website: user.website || "",
            avatar_url: user.avatar_url || "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop",
            banner_url: user.banner_url || "", 
        });
    }
  }, [user]);

  // --- REAL-TIME USERNAME CHECKER ---
  const checkUsernameAvailability = useCallback(async (name) => {
    const cleanName = name.toLowerCase().trim().replace(/\s+/g, '_');
    
    if (cleanName === user?.username) {
        setUsernameStatus("idle");
        setUsernameError("");
        return;
    }

    if (cleanName.length < 3) {
        setUsernameStatus("taken");
        setUsernameError("Handle too short (min 3 chars)");
        return;
    }

    setUsernameStatus("checking");

    try {
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', cleanName)
            .maybeSingle();

        if (data) {
            setUsernameStatus("taken");
            setUsernameError("This handle is already claimed.");
        } else {
            setUsernameStatus("available");
            setUsernameError("");
        }
    } catch (err) {
        console.error(err);
    }
  }, [user?.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (formData.username !== user?.username && isEditing) {
            checkUsernameAvailability(formData.username);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability, user?.username, isEditing]);

  // --- AUTOSAVE HELPER ---
  const autoSaveUrl = async (field, url) => {
    const { error } = await supabase
        .from('profiles')
        .update({ [field]: url })
        .eq('id', user.id);
    
    if (error) throw error;
    if (onUpdate) onUpdate(); 
  };

  // --- 1. HANDLE AVATAR UPLOAD (AUTOSAVE) ---
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
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);

        await autoSaveUrl('avatar_url', publicUrl);
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        toast.success("Identity Icon Updated");
    } catch (error) {
        toast.error("Upload Failed");
    } finally {
        setIsUploading(false);
    }
  };

  // --- 2. HANDLE BANNER UPLOAD (AUTOSAVE) ---
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Max size is 5MB." });
        return;
    }

    setIsUploadingBanner(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `banners/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);

        await autoSaveUrl('banner_url', publicUrl);
        setFormData(prev => ({ ...prev, banner_url: publicUrl }));
        toast.success("Banner Deployed");
    } catch (error) {
        toast.error("Banner Failed");
    } finally {
        setIsUploadingBanner(false);
    }
  };

  // --- 3. SAVE PROFILE DATA ---
  const handleSave = async () => {
    if (usernameStatus === "taken") {
        toast.error("Invalid Handle", { description: "Please resolve handle conflict." });
        return;
    }

    setIsSaving(true);
    try {
        const cleanUsername = formData.username.toLowerCase().trim().replace(/\s+/g, '_');

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                username: cleanUsername,
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                avatar_url: formData.avatar_url,
                banner_url: formData.banner_url, 
            })
            .eq('id', user.id);

        if (error) {
            if (error.code === '23505') throw new Error("Username already exists.");
            throw error;
        }

        toast.success("Profile Updated");
        setIsEditing(false);
        if (onUpdate) onUpdate(); 
    } catch (error) {
        toast.error("Update Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerBannerInput = () => bannerInputRef.current?.click();

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
      
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />

      {/* 1. Cover / Banner Area */}
      <div className="h-40 md:h-48 w-full bg-secondary/30 border-b border-border relative overflow-hidden group">
        {formData.banner_url ? (
            <Image 
                src={formData.banner_url} 
                alt="User Banner" 
                fill 
                className="object-cover transition-opacity duration-700" 
                priority
            />
        ) : (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        )}
        
        <button 
            onClick={triggerBannerInput}
            disabled={isUploadingBanner}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-accent border border-white/10 shadow-lg flex items-center gap-2 z-20"
        >
            {isUploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden md:block">
                {isUploadingBanner ? "Uploading..." : "Sync_Banner"}
            </span>
        </button>

        {!formData.banner_url && (
            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] pointer-events-none select-none">
                 Recommended: 1500 x 500
            </div>
        )}
      </div>

      <div className="container mx-auto px-4 -mt-12">
        <div className="flex flex-col md:flex-row gap-6 items-start">
            
            <div className="relative group cursor-pointer z-10" onClick={() => triggerFileInput()}>
                <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-background bg-secondary relative overflow-hidden shadow-xl">
                    {isUploading ? (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" size={24} />
                        </div>
                    ) : (
                        <Image src={formData.avatar_url} alt="User Avatar" fill className="object-cover" />
                    )}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-mono font-bold tracking-tighter uppercase">
                    {isUploading ? "Syncing..." : "Update_Icon"}
                </div>
            </div>

            <div className="flex-1 w-full pt-2 md:pt-14">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 truncate uppercase">
                            {user?.full_name || user?.email?.split('@')[0]}
                            {user?.role === 'admin' && (
                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 font-mono tracking-wider uppercase font-bold border border-red-800 shrink-0">ADMIN</span>
                            )}
                            {user?.is_for_hire && (
                                <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/50 px-2 py-0.5 font-mono tracking-wider uppercase shrink-0">HIREABLE</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm">@{user?.username}</p>
                        <p className="mt-3 text-sm max-w-lg text-foreground/80 font-light leading-relaxed">{user?.bio || "No bio established."}</p>
                        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-1"><MapPin size={12}/> {user?.location || "Unknown"}</div>
                            <div className="flex items-center gap-1"><LinkIcon size={12}/> {user?.website || "No Link"}</div>
                            <div className="flex items-center gap-1"><Calendar size={12}/> Joined {new Date(user?.created_at).getFullYear()}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                        {user?.role === 'admin' && (
                            <Link href="/admin" className="basis-full md:basis-auto flex-1 md:flex-none">
                                <Button className="w-full h-10 bg-red-600 hover:bg-red-700 text-white border border-red-800 rounded-none font-mono text-xs uppercase shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                    <ShieldAlert size={14} className="mr-2" /> God Mode
                                </Button>
                            </Link>
                        )}
                        <Button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground hover:border-accent hover:text-accent rounded-none font-mono text-xs uppercase">
                            <Edit3 size={14} className="mr-2" /> Edit Profile
                        </Button>
                        <Button className="flex-1 md:flex-none h-10 bg-secondary/50 border border-border text-foreground rounded-none font-mono text-xs uppercase"><Share2 size={14} className="mr-2" /> Share</Button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- EDIT PROFILE DIALOG --- */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[500px] border-border bg-background p-0 rounded-none gap-0 shadow-2xl">
              <DialogHeader className="p-6 border-b border-border bg-secondary/5">
                  <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2 font-mono">
                      <Edit3 size={18} /> Update_Node_Identity
                  </DialogTitle>
              </DialogHeader>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Assets Grid */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Asset_Sync</Label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 relative h-16 border border-border bg-secondary/20 overflow-hidden">
                            {formData.banner_url ? <Image src={formData.banner_url} alt="B" fill className="object-cover opacity-50" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800 uppercase font-mono text-[9px]">No_Banner</div>}
                            <button onClick={triggerBannerInput} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-mono uppercase transition-opacity">Swap_Banner</button>
                        </div>
                        <div className="relative h-16 border border-border bg-secondary/20 overflow-hidden">
                             <Image src={formData.avatar_url} alt="A" fill className="object-cover" />
                             <button onClick={triggerFileInput} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-mono uppercase transition-opacity">Swap_Icon</button>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                      {/* USERNAME FIELD */}
                      <div className="space-y-1.5">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">
                              Identity Handle (Handle)
                              {usernameStatus === "checking" && <span className="text-zinc-500 animate-pulse">CHECKING...</span>}
                              {usernameStatus === "available" && <span className="text-green-500">AVAILABLE</span>}
                          </Label>
                          <div className={`flex items-center border bg-secondary/5 transition-colors ${usernameStatus === 'taken' ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
                            <div className="px-3 text-sm text-muted-foreground font-mono">@</div>
                            <input 
                                value={formData.username} 
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm font-mono" 
                            />
                            <div className="pr-3">
                                {usernameStatus === "available" && <CheckCircle2 size={14} className="text-green-500" />}
                                {usernameStatus === "taken" && <AlertTriangle size={14} className="text-red-500" />}
                            </div>
                          </div>
                          {usernameError && <p className="text-[9px] font-mono text-red-500 uppercase tracking-tighter">{usernameError}</p>}
                      </div>

                      <div className="space-y-2">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Display Name</Label>
                          <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent font-mono text-sm h-10" />
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Bio</Label>
                          <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="flex min-h-[80px] w-full border border-border bg-secondary/10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-none transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 text-foreground">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">Location {useCustomLocation && <button onClick={() => setUseCustomLocation(false)} className="text-[9px] text-accent hover:underline cursor-pointer">List</button>}</Label>
                              {useCustomLocation ? (
                                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="City, Country..." className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent font-mono text-xs h-10" autoFocus />
                              ) : (
                                  <div className="relative">
                                      <select 
                                        value={formData.location} 
                                        onChange={handleLocationSelect} 
                                        className="w-full h-10 bg-zinc-950 text-foreground border border-border px-3 text-xs font-mono focus:border-accent outline-none rounded-none appearance-none transition-colors"
                                      >
                                          <option value="" className="bg-zinc-900 text-zinc-500">Select...</option>
                                          {sortedCountries.map((c) => (
                                            <option key={c.value} value={c.value} className="bg-zinc-900 text-foreground">
                                                {c.label}
                                            </option>
                                          ))}
                                          <option disabled className="bg-zinc-950">──────</option>
                                          <option value="OTHER" className="bg-zinc-900 text-accent">Other...</option>
                                      </select>
                                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div className="space-y-2">
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Website</Label>
                              <Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="bg-secondary/10 border-border rounded-none focus-visible:ring-accent font-mono text-xs h-10" />
                          </div>
                      </div>
                  </div>
              </div>

              <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-none border-border hover:bg-secondary font-mono text-xs uppercase">Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving || isUploading || isUploadingBanner || usernameStatus === 'taken' || usernameStatus === 'checking'} className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase min-w-[120px]">
                      {isSaving ? "Syncing..." : "Save Changes"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}