// app/(HOME)/profile/_components/SettingsForm.jsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "next-themes"; // Import Theme Hook
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  User, Lock, Bell, Globe, Github, Twitter, Linkedin, 
  Loader2, MapPin, CheckCircle2, AlertTriangle, 
  Sun, Moon, Monitor, Palette, Megaphone,
  Wallet, Zap, Star, StarOff, Eye // NEW IMPORTS FOR RUP
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { COUNTRIES } from "@/constants/options";
import { createStripeConnectLink } from "@/app/actions/stripeConnect";

export default function SettingsForm({ user, onUpdate }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  
  // Username Validation States
  const [usernameStatus, setUsernameStatus] = useState("idle"); 
  const [usernameError, setUsernameError] = useState("");

  // Initialize state with DB data
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "", 
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    socials: {
        github: user?.socials?.github || "",
        twitter: user?.socials?.twitter || "",
        linkedin: user?.socials?.linkedin || ""
    },
    is_for_hire: user?.is_for_hire || false,
    settings: {
        show_announcements: true,
        ...user?.settings
    }
  });

  // --- FINANCIAL TELEMETRY STATE (RUP) ---
  const [providers, setProviders] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState({}); 
  const [showFinancialTelemetry, setShowFinancialTelemetry] = useState(false);

  // Ensure theme component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Providers and Existing Links on mount
  useEffect(() => {
    const fetchFinancials = async () => {
      // 1. Get active providers (Stripe, Gursha)
      const { data: provs } = await supabase.from('payment_providers').select('*').eq('is_active', true);
      setProviders(provs || []);

      if (user) {
        // 2. Get user's existing links
        const { data: links } = await supabase.from('creator_payment_links').select('*').eq('user_id', user.id);
        const linkMap = {};
        links?.forEach(l => {
          linkMap[l.provider_id] = { handle: l.provider_handle, is_primary: l.is_primary };
        });
        setPaymentLinks(linkMap);

        // 3. Get Privacy Toggle state
        const { data: profile } = await supabase.from('profiles').select('show_financial_telemetry').eq('id', user.id).single();
        if (profile) setShowFinancialTelemetry(profile.show_financial_telemetry);
      }
    };
    fetchFinancials();
  }, [user]);

  // Alphabetize countries
  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

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
            setUsernameError("This identity handle is already claimed.");
        } else {
            setUsernameStatus("available");
            setUsernameError("");
        }
    } catch (err) {
        console.error(err);
    }
  }, [user?.username]);

  // Debounce the check
  useEffect(() => {
    const timer = setTimeout(() => {
        if (formData.username !== user?.username) {
            checkUsernameAvailability(formData.username);
        }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, checkUsernameAvailability, user?.username]);

  // Keep state in sync
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
            socials: {
                github: user.socials?.github || "",
                twitter: user.socials?.twitter || "",
                linkedin: user.socials?.linkedin || ""
            },
            is_for_hire: user.is_for_hire || false,
            settings: {
                show_announcements: true,
                ...user.settings
            }
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

  const handleSettingChange = (key, value) => {
    setFormData(prev => ({
        ...prev,
        settings: {
            ...prev.settings,
            [key]: value
        }
    }));
  };

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

  const ensureAbsoluteUrl = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

  const handleSave = async () => {
    if (usernameStatus === "taken") {
        toast.error("Invalid Username", { description: "Please choose an available identity handle." });
        return;
    }

    setIsSaving(true);
    try {
        const cleanUsername = formData.username.toLowerCase().trim().replace(/\s+/g, '_');
        
        const cleanedSocials = {
            github: ensureAbsoluteUrl(formData.socials.github),
            twitter: ensureAbsoluteUrl(formData.socials.twitter),
            linkedin: ensureAbsoluteUrl(formData.socials.linkedin)
        };
        
        const cleanedWebsite = ensureAbsoluteUrl(formData.website);

        // 1. Database Update (Profile)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                username: cleanUsername,
                bio: formData.bio,
                location: formData.location,
                website: cleanedWebsite,
                socials: cleanedSocials,
                is_for_hire: formData.is_for_hire,
                settings: formData.settings,
                show_financial_telemetry: showFinancialTelemetry, // NEW RUP UPDATE
            })
            .eq('id', user.id);

        if (profileError) {
            if (profileError.code === '23505') throw new Error("Database Conflict: Username already exists.");
            throw profileError;
        }

        // 2. Database Update (Resource Uplinks)
        await supabase.from('creator_payment_links').delete().eq('user_id', user.id);
        
        const validLinksToInsert = Object.entries(paymentLinks)
            .filter(([_, linkData]) => linkData.handle && linkData.handle.trim() !== '')
            .map(([providerId, linkData]) => ({
                user_id: user.id,
                provider_id: providerId,
                provider_handle: linkData.handle.trim(),
                is_primary: linkData.is_primary
            }));

        if (validLinksToInsert.length > 0) {
            const { error: linksError } = await supabase.from('creator_payment_links').insert(validLinksToInsert);
            if (linksError) throw linksError;
        }

        toast.success("Settings Saved", { description: "Your configuration has been deployed." });
        
        setFormData(prev => ({
            ...prev,
            website: cleanedWebsite,
            socials: cleanedSocials
        }));

        if (onUpdate) onUpdate();

    } catch (error) {
        console.error(error);
        toast.error("Save Failed", { description: error.message });
    } finally {
        setIsSaving(false);
    }
};

  if (!mounted) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 0. Interface Theme */}
      <section className="space-y-6">
        <SectionHeader icon={Palette} title="Interface Theme" description="Customize your visual environment." />
        
        <div className="grid grid-cols-3 gap-3">
            <ThemeOption isActive={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Light" />
            <ThemeOption isActive={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Dark" />
            <ThemeOption isActive={theme === 'system'} onClick={() => setTheme('system')} icon={Monitor} label="System" />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 1. Public Profile Settings */}
      <section className="space-y-6">
        <SectionHeader icon={User} title="Public Profile" description="This is how others see you on the platform." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Display Name" value={formData.full_name} onChange={(e) => handleInputChange("full_name", e.target.value)} />
            
            <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex justify-between">
                    Username (Identity Handle)
                    {usernameStatus === "checking" && <span className="text-[9px] animate-pulse">CHECKING...</span>}
                    {usernameStatus === "available" && <span className="text-[9px] text-green-500">AVAILABLE</span>}
                </label>
                <div className={`flex items-center border bg-background transition-colors ${usernameStatus === "taken" ? 'border-red-500' : 'border-border focus-within:border-accent'}`}>
                    <div className="px-3 py-2 bg-secondary/10 border-r border-border text-sm text-muted-foreground font-mono">@</div>
                    <input 
                        type="text" 
                        value={formData.username} 
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm font-mono"
                    />
                    <div className="pr-3">
                        {usernameStatus === "available" && <CheckCircle2 size={14} className="text-green-500" />}
                        {usernameStatus === "taken" && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                </div>
                {usernameError && <p className="text-[10px] font-mono text-red-500 uppercase tracking-tighter">{usernameError}</p>}
            </div>

            <div className="md:col-span-2">
                <InputGroup label="Bio" value={formData.bio} onChange={(e) => handleInputChange("bio", e.target.value)} isTextArea />
            </div>
            
            <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex justify-between">
                    Location
                    {useCustomLocation && <button onClick={() => setUseCustomLocation(false)} className="text-[9px] text-accent hover:underline cursor-pointer">Select from List</button>}
                </label>
                
                {useCustomLocation ? (
                    <div className="flex items-center border border-border bg-background focus-within:border-accent transition-colors">
                        <div className="px-3 py-2 bg-secondary/10 border-r border-border text-sm text-muted-foreground"><MapPin size={14} /></div>
                        <input 
                            type="text" value={formData.location} onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="Type your city/country..." className="flex-1 bg-transparent border-none outline-none p-3 h-10 text-sm" autoFocus
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            value={formData.location} onChange={handleLocationSelect}
                            className="w-full appearance-none bg-background border border-border px-3 h-10 text-sm focus:border-accent outline-none rounded-none transition-colors"
                        >
                            <option value="">Select Country / Region...</option>
                            {sortedCountries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            <option disabled>──────────</option>
                            <option value="OTHER">Other / Not Listed...</option>
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>
                )}
            </div>

            <InputGroup label="Portfolio URL" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 2. Social Connections */}
      <section className="space-y-6">
        <SectionHeader icon={Globe} title="Connections" description="Link your accounts for auto-verification." />
        <div className="space-y-4">
            <SocialInput icon={Github} label="GitHub" value={formData.socials.github} onChange={(e) => handleSocialChange("github", e.target.value)} placeholder="github.com/username" />
            <SocialInput icon={Twitter} label="Twitter" value={formData.socials.twitter} onChange={(e) => handleSocialChange("twitter", e.target.value)} placeholder="twitter.com/handle" />
            <SocialInput icon={Linkedin} label="LinkedIn" value={formData.socials.linkedin} onChange={(e) => handleSocialChange("linkedin", e.target.value)} placeholder="linkedin.com/in/handle" />
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* --- NEW: RESOURCE UPLINKS --- */}
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <SectionHeader 
            icon={Wallet} 
            title="Resource Uplinks" 
            description="Configure gateways to receive network fuel from supporters. Select up to 3 primary protocols." 
        />
        
        <div className="space-y-6 max-w-2xl">
            {/* Privacy Toggle */}
            <ToggleRow 
                label="Public Financial Telemetry" 
                description="Display your total gathered resources publicly on your dossier." 
                checked={showFinancialTelemetry}
                onCheckedChange={setShowFinancialTelemetry}
                icon={Eye}
            />

            {/* Provider Matrix */}
            <div className="grid grid-cols-1 gap-4">
                {providers.map(provider => {
                    const link = paymentLinks[provider.id] || { handle: '', is_primary: false };
                    const isPrimary = link.is_primary;
                    const primaryCount = Object.values(paymentLinks).filter(l => l.is_primary && l.handle).length;

                    return (
                        <div key={provider.id} className={`p-5 border transition-all duration-300 ${link.handle ? 'border-accent/50 bg-accent/[0.02] shadow-[4px_4px_0px_0px_rgba(220,38,38,0.1)]' : 'border-border bg-secondary/5'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-foreground">
                                    <Zap size={16} className={link.handle ? "text-accent" : "text-muted-foreground"} />
                                    {provider.name} 
                                    <span className="text-[10px] font-mono text-muted-foreground ml-2 px-2 py-0.5 border border-border bg-background">
                                        Tax: {provider.fee_percentage}%
                                    </span>
                                </h4>
                                
                                <button 
                                    onClick={() => {
                                        if (!link.handle) return toast.error("Configuration Required", { description: "Enter a handle first to set as Primary."});
                                        if (!isPrimary && primaryCount >= 3) return toast.error("Slot Limit Reached", { description: "Max 3 primary uplinks allowed."});
                                        setPaymentLinks(prev => ({
                                            ...prev,
                                            [provider.id]: { ...link, is_primary: !isPrimary }
                                        }));
                                    }}
                                    className={`flex items-center gap-2 text-[10px] font-mono uppercase px-3 py-1.5 border transition-all
                                        ${isPrimary 
                                            ? 'bg-accent text-white border-accent shadow-sm' 
                                            : 'bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground'}
                                    `}
                                >
                                    {isPrimary ? <Star size={12} className="fill-current" /> : <StarOff size={12} />}
                                    {isPrimary ? 'Primary Active' : 'Set Primary'}
                                </button>
                            </div>

                            {/* Input / Connection Area */}
{provider.id === 'stripe' ? (
    <div className="mt-4 pt-4 border-t border-border border-dashed flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-50">
            Status: Initializing Protocol...
        </span>
        <Button 
            disabled
            className="h-9 rounded-none font-mono text-[10px] uppercase tracking-widest bg-secondary text-muted-foreground border border-border cursor-not-allowed"
        >
            <Lock size={12} className="mr-2" /> Coming Soon
        </Button>
    </div>
) : (
    /* Standard Text Input for Gursha / Others */
    <div className="flex items-center border border-border bg-background focus-within:border-accent transition-colors">
        <div className="px-4 py-2.5 bg-secondary/10 border-r border-border text-xs text-muted-foreground font-mono uppercase tracking-widest">
            ID / Handle
        </div>
        <input 
            type="text" 
            value={link.handle}
            onChange={(e) => {
                const newHandle = e.target.value;
                setPaymentLinks(prev => ({
                    ...prev,
                    [provider.id]: { 
                        handle: newHandle, 
                        is_primary: newHandle ? link.is_primary : false 
                    }
                }));
            }}
            placeholder={`Enter your ${provider.name} username...`}
            className="flex-1 bg-transparent border-none outline-none p-3 h-11 text-xs font-mono placeholder:text-muted-foreground/30 text-foreground"
        />
    </div>
)}
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      <div className="h-[1px] bg-border border-t border-dashed w-full" />

      {/* 3. Preferences */}
      <section className="space-y-6">
        <SectionHeader icon={Bell} title="Preferences" description="Manage system behavior." />
        <div className="space-y-4 max-w-xl">
            <ToggleRow 
                label="Email Notifications" 
                description="Receive network digests and new reports from your connections." 
                checked={formData.settings.email_notifications !== false} 
                onCheckedChange={(val) => handleSettingChange("email_notifications", val)}
            />
            <ToggleRow 
                label="For Hire Status" 
                description="Show the 'Open to Work' badge on your profile." 
                checked={formData.is_for_hire}
                onCheckedChange={(val) => handleInputChange("is_for_hire", val)}
            />
            <ToggleRow 
                label="System Broadcasts" 
                description="Show global announcements and countdown banners." 
                checked={formData.settings.show_announcements}
                onCheckedChange={(val) => handleSettingChange("show_announcements", val)}
                icon={Megaphone}
            />
        </div>
      </section>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md py-4 border-t border-border flex justify-end gap-4 z-10">
        <Button variant="outline" className="rounded-none border-border hover:text-foreground hover:bg-secondary" onClick={() => onUpdate && onUpdate()}>
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

function ToggleRow({ label, description, checked, defaultChecked, onCheckedChange, icon: Icon }) {
    return (
        <div className="flex items-center justify-between p-4 border border-border bg-secondary/5">
            <div className="flex gap-3">
               {Icon && <div className="text-muted-foreground mt-0.5"><Icon size={16} /></div>}
               <div>
                   <h4 className="text-sm font-bold">{label}</h4>
                   <p className="text-xs text-muted-foreground">{description}</p>
               </div>
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

function ThemeOption({ isActive, onClick, icon: Icon, label }) {
    return (
        <button 
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center gap-2 p-4 border transition-all duration-300
                ${isActive 
                    ? "bg-accent text-white border-accent shadow-md" 
                    : "bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-secondary/10"}
            `}
        >
            <Icon size={24} />
            <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
        </button>
    )
}