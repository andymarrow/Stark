"use client";
import { useRef } from "react";
import Image from "next/image";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoverImageUpload({ preview, onFileSelect, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="w-full">
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
        />
        
        {preview ? (
            <div className="relative w-full aspect-video border border-border group overflow-hidden">
                <Image src={preview} alt="Cover Preview" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={onRemove}
                        className="h-8 text-xs uppercase"
                    >
                        Remove
                    </Button>
                </div>
            </div>
        ) : (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-border hover:border-accent/50 bg-secondary/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
            >
                <div className="p-3 bg-secondary/20 rounded-full group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <UploadCloud size={24} className="text-muted-foreground group-hover:text-accent" />
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-foreground">Click to Upload Cover Art</p>
                    <p className="text-[10px] text-muted-foreground font-mono">1920x1080 Recommended</p>
                </div>
            </div>
        )}
    </div>
  );
}