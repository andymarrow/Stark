"use client";
import { useState, useRef } from "react";
import { Plus, Trash2, UploadCloud, Link as LinkIcon, Twitter, Linkedin, Instagram, Globe } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SponsorsTab({ contest }) {
  const [sponsors, setSponsors] = useState(contest.sponsors || []);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [newSponsor, setNewSponsor] = useState({ 
    name: "", 
    logo: null, 
    preview: null,
    links: { web: "", x: "", linkedin: "", instagram: "", stark: "" }
  });

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewSponsor(prev => ({ ...prev, logo: file, preview: URL.createObjectURL(file) }));
    }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name || !newSponsor.logo) {
        toast.error("Missing Data", { description: "Name and Logo are required." });
        return;
    }

    setIsSaving(true);
    try {
        const fileExt = newSponsor.logo.name.split('.').pop();
        const fileName = `sponsors/${contest.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('project-assets').upload(fileName, newSponsor.logo);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(fileName);

        const sponsorObj = { 
            name: newSponsor.name, 
            logo_url: publicUrl,
            links: newSponsor.links 
        };

        const updatedSponsors = [...sponsors, sponsorObj];

        const { error: dbError } = await supabase
            .from('contests')
            .update({ sponsors: updatedSponsors })
            .eq('id', contest.id);

        if (dbError) throw dbError;

        setSponsors(updatedSponsors);
        setNewSponsor({ name: "", logo: null, preview: null, links: { web: "", x: "", linkedin: "", instagram: "", stark: "" } });
        toast.success("Sponsor Added");

    } catch (error) {
        toast.error("Failed to add sponsor");
    } finally {
        setIsSaving(false);
    }
  };

  const handleRemove = async (index) => {
    const updatedSponsors = sponsors.filter((_, i) => i !== index);
    const { error } = await supabase.from('contests').update({ sponsors: updatedSponsors }).eq('id', contest.id);
    if (!error) {
        setSponsors(updatedSponsors);
        toast.success("Removed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-20">
        
        {/* ADD SPONSOR FORM */}
        <div className="bg-secondary/5 border border-border p-6 flex flex-col md:flex-row gap-8 items-start">
            
            {/* Logo Upload */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center cursor-pointer bg-background flex-shrink-0 relative overflow-hidden group transition-all"
            >
                <input type="file" ref={fileInputRef} onChange={handleLogoSelect} className="hidden" accept="image/*" />
                {newSponsor.preview ? (
                    <Image src={newSponsor.preview} alt="Preview" fill className="object-cover p-2" />
                ) : (
                    <div className="text-center text-muted-foreground group-hover:text-accent">
                        <UploadCloud size={24} className="mx-auto mb-2" />
                        <span className="text-[10px] font-mono uppercase">Upload Logo</span>
                    </div>
                )}
            </div>

            {/* Fields */}
            <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground">Entity Name</label>
                    <Input 
                        placeholder="e.g. Vercel" 
                        value={newSponsor.name}
                        onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                        className="h-10 rounded-none bg-background border-border"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SocialInput icon={Globe} placeholder="Website URL" value={newSponsor.links.web} onChange={(v) => setNewSponsor(p => ({...p, links: {...p.links, web: v}}))} />
                    <SocialInput icon={Twitter} placeholder="X Profile" value={newSponsor.links.x} onChange={(v) => setNewSponsor(p => ({...p, links: {...p.links, x: v}}))} />
                    <SocialInput icon={Linkedin} placeholder="LinkedIn" value={newSponsor.links.linkedin} onChange={(v) => setNewSponsor(p => ({...p, links: {...p.links, linkedin: v}}))} />
                    <SocialInput icon={Instagram} placeholder="Instagram" value={newSponsor.links.instagram} onChange={(v) => setNewSponsor(p => ({...p, links: {...p.links, instagram: v}}))} />
                </div>

                <Button 
                    onClick={handleAddSponsor}
                    disabled={isSaving}
                    className="h-10 px-8 bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs w-full md:w-auto mt-2"
                >
                    {isSaving ? "Adding..." : "Add Sponsor"}
                </Button>
            </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sponsors.map((sponsor, i) => (
                <div key={i} className="border border-border bg-card p-5 relative group flex items-center gap-4">
                    <div className="relative h-12 w-12 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <Image src={sponsor.logo_url} alt={sponsor.name} fill className="object-contain" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate mb-2">{sponsor.name}</div>
                        <div className="flex gap-2">
                            {sponsor.links?.web && <SocialIconLink href={sponsor.links.web} icon={Globe} />}
                            {sponsor.links?.x && <SocialIconLink href={sponsor.links.x} icon={Twitter} />}
                            {sponsor.links?.linkedin && <SocialIconLink href={sponsor.links.linkedin} icon={Linkedin} />}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleRemove(i)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>

    </div>
  );
}

const SocialInput = ({ icon: Icon, placeholder, value, onChange }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Icon size={14} />
        </div>
        <Input 
            placeholder={placeholder} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9 h-9 rounded-none bg-background border-border text-xs"
        />
    </div>
);

const SocialIconLink = ({ href, icon: Icon }) => (
    <a href={href} target="_blank" className="text-muted-foreground hover:text-accent transition-colors">
        <Icon size={14} />
    </a>
);