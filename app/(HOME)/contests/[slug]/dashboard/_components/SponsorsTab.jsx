"use client";
import { useState } from "react";
import { Plus, Trash2, Pencil, Globe, Twitter, Linkedin, Instagram, ImageIcon, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import SponsorEditorModal from "./SponsorEditorModal";

const LINK_ICONS = { web: Globe, x: Twitter, linkedin: Linkedin, instagram: Instagram };

const TIER_STYLE = {
  title: "bg-accent/10 text-accent border-accent/30",
  gold: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/30",
  silver: "bg-zinc-400/10 text-zinc-500 border-zinc-400/30",
  partner: "bg-secondary/20 text-muted-foreground border-border",
};

export default function SponsorsTab({ contest }) {
  const [sponsors, setSponsors] = useState((contest.sponsors || []).filter((s) => typeof s === "object" && s?.name));
  const [editorState, setEditorState] = useState(null); // { sponsor, index } | { sponsor: null } for create | null for closed

  const handleSaved = (updatedSponsors) => {
    setSponsors(updatedSponsors);
  };

  const handleRemove = async (index) => {
    if (!confirm(`Remove ${sponsors[index].name}? This can't be undone.`)) return;
    const updated = sponsors.filter((_, i) => i !== index);
    const { error } = await supabase.from("contests").update({ sponsors: updated }).eq("id", contest.id);
    if (!error) {
      setSponsors(updated);
      toast.success("Sponsor Removed");
    } else {
      toast.error("Failed to remove sponsor");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold uppercase text-sm tracking-widest flex items-center gap-2 text-foreground">
            <Handshake size={16} className="text-accent" /> Sponsors
          </h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
            Shown on a dedicated public tab — logo, blurb, links, and a full image/video gallery per sponsor.
          </p>
        </div>
        <Button
          onClick={() => setEditorState({ sponsor: null })}
          className="h-9 px-5 bg-accent hover:bg-accent/90 text-white uppercase font-mono text-xs"
        >
          <Plus size={14} className="mr-2" /> Add Sponsor
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <div className="border border-dashed border-border py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Handshake size={32} className="opacity-30" />
          <p className="text-xs font-mono uppercase tracking-widest">No sponsors yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sponsors.map((sponsor, i) => (
            <div key={i} className="border border-border bg-card p-5 relative group flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 flex-shrink-0 border border-border bg-secondary/10 overflow-hidden">
                  <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-1.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{sponsor.name}</div>
                  <span className={`inline-block mt-1 text-[8px] font-mono uppercase px-1.5 py-0.5 border ${TIER_STYLE[sponsor.tier] || TIER_STYLE.partner}`}>
                    {sponsor.tier || "partner"}
                  </span>
                </div>
              </div>

              {sponsor.tagline && <p className="text-[11px] text-muted-foreground line-clamp-2">{sponsor.tagline}</p>}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed border-border">
                <div className="flex gap-2">
                  {Object.entries(sponsor.links || {}).map(([key, url]) => {
                    const Icon = LINK_ICONS[key];
                    if (!url || !Icon) return null;
                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                        <Icon size={13} />
                      </a>
                    );
                  })}
                  {Array.isArray(sponsor.gallery) && sponsor.gallery.length > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                      <ImageIcon size={11} /> {sponsor.gallery.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditorState({ sponsor, index: i })} className="p-1.5 text-muted-foreground hover:text-accent transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleRemove(i)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorState && (
        <SponsorEditorModal
          contest={contest}
          sponsor={editorState.sponsor}
          sponsorIndex={editorState.index}
          isOpen={!!editorState}
          onClose={() => setEditorState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
