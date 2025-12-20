"use client";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";

export default function StepMedia({ data, updateData }) {
  
  // Mock upload functionality for UI demo
  const handleDrop = (e) => {
    e.preventDefault();
    // In real app: Handle files
    alert("This is a demo. File upload simulation.");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      
      <div className="text-center space-y-1 mb-8">
        <h3 className="font-bold text-foreground">Visual Assets</h3>
        <p className="text-xs text-muted-foreground font-mono">Upload screenshots (16:9 recommended)</p>
      </div>

      <div 
        className="w-full h-64 border-2 border-dashed border-border hover:border-accent/50 bg-secondary/5 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer relative group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="p-4 bg-background border border-border rounded-full group-hover:scale-110 transition-transform duration-300">
            <UploadCloud size={32} className="text-muted-foreground group-hover:text-accent transition-colors" />
        </div>
        <div className="text-center">
            <p className="text-sm font-bold text-foreground">Drag & Drop or Click to Upload</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">MAX_SIZE: 10MB // FMT: JPG, PNG</p>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      </div>

      {/* Mocked Uploaded Files List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border border-border bg-background">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center">
                    <ImageIcon size={16} />
                </div>
                <div>
                    <p className="text-xs font-bold">dashboard_v1.png</p>
                    <p className="text-[10px] text-muted-foreground font-mono">2.4MB • COMPLETE</p>
                </div>
            </div>
            <button className="text-muted-foreground hover:text-destructive"><X size={16} /></button>
        </div>
      </div>

    </div>
  );
}