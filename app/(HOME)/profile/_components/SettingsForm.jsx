"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Bell, Globe, Github, Twitter, Linkedin, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { COUNTRIES } from "@/constants/options";

export default function SettingsForm({ user, onUpdate }) {
  const [isSaving, setIsSaving] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  // Initialize state with DB data
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "", // Read only usually
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    // Handle JSONB structure for socials
    socials: {
        github: user?.socials?.github || "",
        twitter: user?.socials?.twitter || "",
        linkedin: user?.socials?.linkedin || ""
    },
    is_for_hire: user?.is_for_hire || false
  });

  // Keep state in sync if parent fetches new data
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
            username: user.username || "",
            bio: user.bio || "",
            location: user.location || "",
            website: user.website || "",
            socials: {
                github: user.socials?.github || "",
                twitter: user.socials?.twitter || "",
                linkedin: user.socials?.linkedin || ""
            },
            is_for_hire: user.is_for_hire || false
        });
    }
  }, [user]);

  // --- HANDLERS ---

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (network, value) => {
    setFormData(prev => ({
        ...prev,
        socials: {
            ...prev.socials,
            [network]: value
        }
    }));
  };

  const handleLocationSelect = (e) => {
    const val = e.target.value;
    if (val === "OTHER") {
        setUseCustomLocation(true);
        setFormData(prev => ({ ...prev, location: "" })); // Clear for typing
    } else {
        setUseCustomLocation(false);
        setFormData(prev => ({ ...prev, location: val }));
    }
  };

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
                socials: formData.socials,
                is_for_hire: formData.is_for_hire,
                // username is usually not editable to prevent URL breaks, so we omit it here
            })
            .eq('id', user.id);

        if (error) throw error;

        toast.success("Settings Saved", { description: "Your configuration has been deployed." });
        
        // Refresh parent data
        if (onUpdate) onUpdate();

    } catch (error) {
        console.error(error);
        toast.error("Save Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 1. Public Profile Settings */}
      <section className="space-y-6">
        <SectionHeader icon={User} title="Public Profile" description="This is how others see you on the platform." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup 
                label="Display Name" 
                value={formData.full_name} 
                onChange={(e) => handleInputChange("full_name", e.target.value)} 
            />
            <InputGroup 
                label="Username" 
                value={formData.username} 
                prefix="@" 
                disabled 
            />
            <div className="md:col-span-2">
                <InputGroup 
                    label="Bio" 
                    value={formData.bio} 
                    onChange={(e) => handleInputChange("bio", e.target.value)} 
                    isTextArea 
                />
            </div>
            
            {/* LOCATION SELECTOR with Custom Fallback */}
            <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex justify-between">
                    Location
                    {useCustomLocation && (
                        <button 
                            onClick={() => setUseCustomLocation(false)} 
                            className="text-[9px] text-accent hover:underline cursor-pointer"
                        >
                            Select from List
                        </button>
                    )}
                </label>
                
                {useCustomLocation ? (
                    <div className="flex items-center border border-border bg-background focus-within:border-accent transition-colors">
                        <div className="px-3 py-2 bg-secondary/10 border-r border-border text-sm text-muted-foreground">
                            <MapPin size={14} />
                        </div>
                        <input 
                            type="text" 
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="Type your city/country..."
                            className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm"
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={formData.location}
                            onChange={handleLocationSelect}
                            className="w-full appearance-none bg-background border border-border px-3 h-10 text-sm focus:border-accent outline-none rounded-none transition-colors"
                        >
                            <option value="">Select Country / Region...</option>
                            {COUNTRIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                            <option disabled>──────────</option>
                            <option value="OTHER">Other / Not Listed...</option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            <InputGroup 
                label="Portfolio URL" 
                value={formData.website} 
                onChange={(e) => handleInputChange("website", e.target.value)} 
            />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 2. Social Connections */}
      <section className="space-y-6">
        <SectionHeader icon={Globe} title="Connections" description="Link your accounts for auto-verification." />
        <div className="space-y-4">
            <SocialInput 
                icon={Github} 
                label="GitHub" 
                value={formData.socials.github} 
                onChange={(e) => handleSocialChange("github", e.target.value)}
                placeholder="github.com/username"
            />
            <SocialInput 
                icon={Twitter} 
                label="Twitter" 
                value={formData.socials.twitter} 
                onChange={(e) => handleSocialChange("twitter", e.target.value)}
                placeholder="twitter.com/handle"
            />
            <SocialInput 
                icon={Linkedin} 
                label="LinkedIn" 
                value={formData.socials.linkedin} 
                onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                placeholder="linkedin.com/in/handle"
            />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 3. Preferences */}
      <section className="space-y-6">
        <SectionHeader icon={Bell} title="Preferences" description="Manage system behavior." />
        <div className="space-y-4 max-w-xl">
            {/* We don't have columns for notifications yet, so these are UI-only for now or mapped to local storage */}
            <ToggleRow label="Email Notifications" description="Receive weekly digests and major updates." defaultChecked={true} />
            
            <ToggleRow 
                label="For Hire Status" 
                description="Show the 'Open to Work' badge on your profile." 
                checked={formData.is_for_hire}
                onCheckedChange={(val) => handleInputChange("is_for_hire", val)}
            />
        </div>
      </section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md py-4 border-t border-border flex justify-end gap-4 z-10">
        <Button variant="outline" className="rounded-none border-border hover:bg-secondary" onClick={() => onUpdate && onUpdate()}>
            Reset
        </Button>
        <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-none bg-foreground text-background hover:bg-accent hover:text-white transition-colors min-w-[140px]"
        >
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Changes"}
        </Button>
      </div>

    </div>
  );
}

// --- Sub-Components ---

function SectionHeader({ icon: Icon, title, description }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="p-2 bg-secondary/20 border border-border text-foreground">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-none mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground font-light">{description}</p>
            </div>
        </div>
    )
}

function InputGroup({ label, value, onChange, prefix, disabled, isTextArea, placeholder }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{label}</label>
            <div className={`flex items-center border border-border bg-background focus-within:border-accent transition-colors ${disabled ? 'opacity-50' : ''}`}>
                {prefix && (
                    <div className="px-3 py-2 bg-secondary/10 border-r border-border text-sm text-muted-foreground font-mono">
                        {prefix}
                    </div>
                )}
                {isTextArea ? (
                    <textarea 
                        value={value}
                        onChange={onChange}
                        className="flex-1 bg-transparent border-none outline-none p-3 text-sm min-h-[100px]"
                    />
                ) : (
                    <input 
                        type="text" 
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm"
                    />
                )}
            </div>
        </div>
    )
}

function SocialInput({ icon: Icon, label, value, onChange, placeholder }) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 bg-secondary/10 border border-border">
                <Icon size={16} />
            </div>
            <div className="flex-1 relative group">
                <input 
                    type="text" 
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-background border-b border-border focus:border-accent outline-none py-2 text-sm transition-colors"
                />
                {value && value.length > 5 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-green-500 font-mono bg-green-500/10 px-2 py-0.5">
                        LINKED
                    </span>
                )}
            </div>
        </div>
    )
}

function ToggleRow({ label, description, checked, defaultChecked, onCheckedChange }) {
    return (
        <div className="flex items-center justify-between p-4 border border-border bg-secondary/5">
            <div>
                <h4 className="text-sm font-bold">{label}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch 
                checked={checked} 
                defaultChecked={defaultChecked} 
                onCheckedChange={onCheckedChange}
                className="data-[state=checked]:bg-accent" 
            />
        </div>
    )
}