"use client";
import { useState, useRef } from "react";
import { UploadCloud, Globe, Twitter, Linkedin, Instagram, Loader2 } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import StepMedia from "@/app/(HOME)/create/_components/StepMedia";

const TIERS = [
  { value: "title", label: "Title Sponsor" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "partner", label: "Partner" },
];

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

// Add or edit one sponsor — name, tier, logo, blurb, links, and a full
// image/YouTube gallery (this is where sponsors get their spotlight: a
// trailer, product shots, whatever they want shown off).
export default function SponsorEditorModal({ contest, sponsor, sponsorIndex, isOpen, onClose, onSaved }) {
  const isEditing = !!sponsor;
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    name: sponsor?.name || "",
    tagline: sponsor?.tagline || "",
    tier: sponsor?.tier || "partner",
    description: sponsor?.description || "",
    logo_file: null,
    logo_preview: sponsor?.logo_url || null,
    links: {
      web: sponsor?.links?.web || "",
      x: sponsor?.links?.x || "",
      linkedin: sponsor?.links?.linkedin || "",
      instagram: sponsor?.links?.instagram || "",
    },
    gallery_files: sponsor?.gallery || [],
    gallery_raw_files: [],
  }));

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, logo_file: file, logo_preview: URL.createObjectURL(file) }));
  };

  const handleGalleryUpdate = (key, value) => {
    if (key === "rawFiles") setForm((prev) => ({ ...prev, gallery_raw_files: value }));
    else setForm((prev) => ({ ...prev, gallery_files: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Missing Data", { description: "Sponsor name is required." });
      return;
    }
    if (!form.logo_file && !form.logo_preview) {
      toast.error("Missing Data", { description: "A logo is required." });
      return;
    }

    setIsSaving(true);
    try {
      // Logo
      let logoUrl = form.logo_preview;
      if (form.logo_file) {
        const fileExt = form.logo_file.name.split(".").pop();
        const fileName = `sponsors/${contest.id}/logo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("project-assets").upload(fileName, form.logo_file);
        if (uploadError) throw uploadError;
        logoUrl = supabase.storage.from("project-assets").getPublicUrl(fileName).data.publicUrl;
      }

      // Gallery — resolve any blob: preview to a real upload
      const gallery = await Promise.all(
        form.gallery_files.map(async (url) => {
          if (url.startsWith("blob:")) {
            const rawEntry = form.gallery_raw_files.find((r) => r.preview === url);
            if (rawEntry?.file) {
              const fileExt = rawEntry.file.name.split(".").pop();
              const fileName = `sponsors/${contest.id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
              const { error: uploadError } = await supabase.storage.from("project-assets").upload(fileName, rawEntry.file);
              if (uploadError) throw uploadError;
              return supabase.storage.from("project-assets").getPublicUrl(fileName).data.publicUrl;
            }
          }
          return url;
        })
      );

      const sponsorObj = {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        tier: form.tier,
        description: form.description.trim(),
        logo_url: logoUrl,
        links: form.links,
        gallery,
      };

      // Read-modify-write against the live row so we never clobber a
      // sponsor someone else added in between. Editing replaces by index
      // (object identity won't survive the round trip through JSON).
      const { data: fresh, error: fetchError } = await supabase
        .from("contests")
        .select("sponsors")
        .eq("id", contest.id)
        .single();
      if (fetchError) throw fetchError;

      const current = (Array.isArray(fresh.sponsors) ? fresh.sponsors : []).filter((s) => typeof s === "object" && s);
      const finalSponsors = isEditing
        ? current.map((s, i) => (i === sponsorIndex ? sponsorObj : s))
        : [...current, sponsorObj];

      const { error: dbError } = await supabase.from("contests").update({ sponsors: finalSponsors }).eq("id", contest.id);
      if (dbError) throw dbError;

      toast.success(isEditing ? "Sponsor Updated" : "Sponsor Added");
      onSaved(finalSponsors);
      onClose();
    } catch (error) {
      toast.error("Save Failed", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border rounded-none">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight text-lg font-black">
            {isEditing ? "Edit Sponsor" : "Add Sponsor"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Logo + Name + Tier */}
          <div className="flex flex-col md:flex-row gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center cursor-pointer bg-secondary/5 flex-shrink-0 relative overflow-hidden group transition-all"
            >
              <input type="file" ref={fileInputRef} onChange={handleLogoSelect} className="hidden" accept="image/*" />
              {form.logo_preview ? (
                <Image src={form.logo_preview} alt="Logo preview" fill className="object-contain p-2" />
              ) : (
                <div className="text-center text-muted-foreground group-hover:text-accent">
                  <UploadCloud size={20} className="mx-auto mb-1" />
                  <span className="text-[9px] font-mono uppercase">Logo</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Entity Name</label>
                <Input
                  placeholder="e.g. Vercel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 rounded-none bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Tagline (optional)</label>
                <Input
                  placeholder="e.g. Deploy at the speed of thought"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="h-9 rounded-none bg-background border-border text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-muted-foreground">Tier</label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
                  <SelectTrigger className="h-9 rounded-none bg-background border-border text-xs uppercase font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    {TIERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">About (optional)</label>
            <Textarea
              placeholder="What do they do, and why are they backing this contest?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px] rounded-none bg-background border-border text-sm"
            />
          </div>

          {/* Links */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Links</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SocialInput icon={Globe} placeholder="Website URL" value={form.links.web} onChange={(v) => setForm((p) => ({ ...p, links: { ...p.links, web: v } }))} />
              <SocialInput icon={Twitter} placeholder="X Profile" value={form.links.x} onChange={(v) => setForm((p) => ({ ...p, links: { ...p.links, x: v } }))} />
              <SocialInput icon={Linkedin} placeholder="LinkedIn" value={form.links.linkedin} onChange={(v) => setForm((p) => ({ ...p, links: { ...p.links, linkedin: v } }))} />
              <SocialInput icon={Instagram} placeholder="Instagram" value={form.links.instagram} onChange={(v) => setForm((p) => ({ ...p, links: { ...p.links, instagram: v } }))} />
            </div>
          </div>

          {/* Gallery */}
          <div className="space-y-1 pt-2 border-t border-dashed border-border">
            <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-2 mt-4">
              Showcase Gallery — Images & YouTube (give them the spotlight)
            </label>
            <StepMedia
              data={{ files: form.gallery_files, rawFiles: form.gallery_raw_files, demo_link: null }}
              updateData={handleGalleryUpdate}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-8 bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs w-full tracking-widest"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : isEditing ? "Save Changes" : "Add Sponsor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
