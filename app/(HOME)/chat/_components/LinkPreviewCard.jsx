"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LinkPreviewCard({ message }) {
  const [data, setData] = useState(message.metadata?.link_preview || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const text = message.text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text?.match(urlRegex);
  const url = match ? match[0] : null;

  useEffect(() => {
    // 1. If no URL or data already exists in metadata, do nothing
    if (!url || message.metadata?.link_preview) return;

    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        
        if (!json.title && !json.image) throw new Error("No metadata");

        // 2. Set local state to show it now
        setData(json);

        // 3. PERSISTENCE: Save to DB so it never has to load again
        // We merge the existing metadata with the new link_preview key
        await supabase
          .from('messages')
          .update({ 
            metadata: { 
                ...message.metadata, 
                link_preview: json 
            } 
          })
          .eq('id', message.id);

      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url, message.id, message.metadata]);

  if (!url || error) return null;

  // Render logic
  return (
    <div className="mt-2 mb-1 max-w-sm overflow-hidden rounded-sm border border-white/5">
      {loading ? (
        <div className="h-16 w-full bg-secondary/10 border-l-2 border-accent/50 animate-pulse flex items-center px-4">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-secondary/10 border-l-2 border-accent hover:bg-secondary/20 transition-colors group"
        >
            {data.image && (
                <div className="relative w-full h-32 bg-black">
                    <Image 
                        src={data.image} 
                        alt="Preview" 
                        fill 
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        unoptimized // Recommended for external dynamic links
                    />
                </div>
            )}
            <div className="p-3">
                <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-tighter truncate">{data.siteName || "External Link"}</h4>
                <p className="text-sm font-bold text-white/90 line-clamp-1">{data.title}</p>
                {data.description && (
                    <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 font-mono leading-tight">{data.description}</p>
                )}
            </div>
        </a>
      ) : null}
    </div>
  );
}