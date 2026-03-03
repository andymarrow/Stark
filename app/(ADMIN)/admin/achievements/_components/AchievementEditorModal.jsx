"use client";
import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, Loader2, Save, Trash2, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import AchievementCardPreview from "./AchievementCardPreview";

// --- CONSTANTS ---
const CATEGORIES = ["project", "social", "contest", "special", "fun"];

export default function AchievementEditorModal({ isOpen, onClose, badge, onSuccess }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "project",
    image_url: "",
    visual_style: {
      shape: "poly",        
      poly_sides: 6,        
      border_color: "#3f3f46", 
      glow_color: "#ef4444",   
      glow_intensity: 20,      
      bg_start: "#09090b",     
      bg_end: "#000000"        
    },
    criteria_type: "count_threshold",
    criteria_value: 0
  });

  useEffect(() => {
    if (badge) {
      setFormData({
        ...badge,
        visual_style: {
          shape: badge.visual_style?.shape || "poly",
          poly_sides: badge.visual_style?.poly_sides || 6,
          border_color: badge.visual_style?.border_color || "#3f3f46",
          glow_color: badge.visual_style?.glow_color || "#ef4444",
          glow_intensity: badge.visual_style?.glow_intensity || 20,
          bg_start: badge.visual_style?.bg_start || "#09090b",
          bg_end: badge.visual_style?.bg_end || "#000000"
        }
      });
    } else {
      setFormData({
        id: "",
        name: "",
        description: "",
        category: "project",
        image_url: "",
        visual_style: {
          shape: "poly",
          poly_sides: 6,
          border_color: "#3f3f46",
          glow_color: "#ef4444",
          glow_intensity: 20,
          bg_start: "#09090b",
          bg_end: "#000000"
        },
        criteria_type: "count_threshold",
        criteria_value: 0
      });
    }
  }, [badge, isOpen]);

  const updateVisual = (key, value) => {
    setFormData(prev => ({
      ...prev,
      visual_style: { ...prev.visual_style, [key]: value }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `badges/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-assets') 
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Asset Uploaded");
    } catch (error) {
      toast.error("Upload Failed", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.image_url) {
      toast.error("Missing Data", { description: "ID, Name, and Image are required." });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('achievement_types')
        .upsert(formData);

      if (error) throw error;

      toast.success(badge ? "Badge Updated" : "Badge Created");
      onSuccess(); 
      onClose();
    } catch (error) {
      toast.error("Save Failed", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-background border border-border p-0 rounded-lg gap-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto shadow-2xl">
        
        {/* LEFT: VISUAL PREVIEW & UPLOAD (35%) */}
        <div className="w-full md:w-[350px] bg-secondary/10 border-r border-border p-8 flex flex-col items-center justify-center relative">
          
          {/* The Preview Component */}
          <div className="scale-125 mb-8">
            <AchievementCardPreview badge={formData} size="lg" />
          </div>

          {/* Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*" 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="w-full border-dashed border-border hover:border-accent hover:text-accent hover:bg-accent/10 h-12 rounded-none font-mono text-xs uppercase transition-all"
          >
            {isUploading ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {formData.image_url ? "Replace Asset" : "Upload Character"}
          </Button>
          
          <p className="mt-4 text-[10px] text-muted-foreground text-center font-mono leading-relaxed uppercase tracking-widest">
            Recommended: 512x512 PNG<br/>Transparent Background
          </p>
        </div>

        {/* RIGHT: CONFIGURATION FORM (65%) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-xl font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
              {badge ? "Edit_Protocol" : "Initialize_Achievement"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* 1. Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-mono uppercase">System ID (Unique)</Label>
                <Input 
                  value={formData.id} 
                  onChange={(e) => setFormData({...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  placeholder="e.g. ship_it_v1"
                  disabled={!!badge} 
                  className="bg-secondary/10 border-border text-foreground font-mono text-xs h-10 rounded-none focus-visible:ring-accent focus-visible:border-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-mono uppercase">Display Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Ship It!"
                  className="bg-secondary/10 border-border text-foreground h-10 rounded-none focus-visible:ring-accent focus-visible:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-mono uppercase">Description</Label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="flex w-full h-20 bg-secondary/10 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-none resize-none"
                  placeholder="How is this earned?"
                />
            </div>

            {/* 2. Advanced Visual Engineering */}
            <div className="space-y-4 pt-4 border-t border-border">
              <Label className="text-xs text-foreground font-bold font-mono uppercase flex items-center gap-2">
                <RefreshCw size={12} className="text-accent" /> Advanced Visual Engineering
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUMN 1: GEOMETRY */}
                <div className="space-y-4">
                    
                    {/* Shape Type */}
                    <div className="space-y-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">Base Geometry</span>
                        <Select value={formData.visual_style.shape} onValueChange={(v) => updateVisual('shape', v)}>
                            <SelectTrigger className="h-9 bg-secondary/10 border-border text-xs rounded-none text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-background border-border text-foreground rounded-none">
                                <SelectItem value="none">None (Image Only)</SelectItem>
                                <SelectItem value="circle">Circle (Perfect)</SelectItem>
                                <SelectItem value="square">Square (Rounded)</SelectItem>
                                <SelectItem value="diamond">Diamond (Rhombus)</SelectItem>
                                <SelectItem value="poly">Polygon (N-Sided)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Polygon Sides Slider (Only if Poly) */}
                    {formData.visual_style.shape === 'poly' && (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">Edges / Vertices</span>
                                <span className="text-[10px] text-foreground font-mono">{formData.visual_style.poly_sides}</span>
                            </div>
                            <input 
                                type="range" min="3" max="12" step="1"
                                value={formData.visual_style.poly_sides}
                                onChange={(e) => updateVisual('poly_sides', parseInt(e.target.value))}
                                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <div className="flex justify-between text-[8px] text-muted-foreground font-mono tracking-wider">
                                <span>TRIANGLE</span>
                                <span>DODECAGON</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLUMN 2: CHROMATICS */}
                <div className="space-y-4">
                    
                    {/* Glow Intensity */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-[10px] text-muted-foreground uppercase font-mono">Energy Output</span>
                            <span className="text-[10px] text-foreground font-mono">{formData.visual_style.glow_intensity}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="5"
                            value={formData.visual_style.glow_intensity}
                            onChange={(e) => updateVisual('glow_intensity', parseInt(e.target.value))}
                            className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                        />
                    </div>

                    {/* Color Pickers Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-[9px] text-muted-foreground uppercase block font-mono">Border</span>
                                <button 
                                    onClick={() => updateVisual('border_color', 'transparent')} 
                                    className="text-[8px] uppercase text-accent hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/10 border border-border p-1">
                                <input 
                                    type="color" 
                                    value={formData.visual_style.border_color === 'transparent' ? '#000000' : formData.visual_style.border_color}
                                    onChange={(e) => updateVisual('border_color', e.target.value)}
                                    className="w-full h-6 bg-transparent border-none cursor-pointer p-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-[9px] text-muted-foreground uppercase block font-mono">Glow</span>
                                <button 
                                    onClick={() => updateVisual('glow_color', 'transparent')} 
                                    className="text-[8px] uppercase text-accent hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/10 border border-border p-1">
                                <input 
                                    type="color" 
                                    value={formData.visual_style.glow_color === 'transparent' ? '#000000' : formData.visual_style.glow_color}
                                    onChange={(e) => updateVisual('glow_color', e.target.value)}
                                    className="w-full h-6 bg-transparent border-none cursor-pointer p-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-[9px] text-muted-foreground uppercase block font-mono">BG Start</span>
                                <button 
                                    onClick={() => updateVisual('bg_start', 'transparent')} 
                                    className="text-[8px] uppercase text-accent hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/10 border border-border p-1">
                                <input 
                                    type="color" 
                                    value={formData.visual_style.bg_start === 'transparent' ? '#000000' : formData.visual_style.bg_start}
                                    onChange={(e) => updateVisual('bg_start', e.target.value)}
                                    className="w-full h-6 bg-transparent border-none cursor-pointer p-0"
                                />
                            </div>
                        </div>
                    </div>

                </div>
              </div>
            </div>

            {/* 3. Logic & Category */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
               <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-mono uppercase">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="h-9 bg-secondary/10 border-border text-xs rounded-none text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground rounded-none">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs uppercase">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
               
               <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-mono uppercase">Trigger Value (Threshold)</Label>
                  <Input 
                    type="number"
                    value={formData.criteria_value}
                    onChange={(e) => setFormData({...formData, criteria_value: parseInt(e.target.value)})}
                    className="bg-secondary/10 border-border text-foreground font-mono text-xs h-9 rounded-none focus-visible:ring-accent focus-visible:border-accent"
                  />
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <DialogFooter className="p-6 border-t border-border bg-secondary/5 flex justify-between items-center w-full">
            {badge && (
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-mono uppercase h-10">
                <Trash2 size={14} className="mr-2" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button onClick={onClose} variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary rounded-none font-mono text-xs uppercase h-10">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-white rounded-none font-mono text-xs uppercase h-10 px-6">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={14} className="mr-2" /> Save Asset</>}
              </Button>
            </div>
          </DialogFooter>

        </div>
      </DialogContent>
    </Dialog>
  );
}