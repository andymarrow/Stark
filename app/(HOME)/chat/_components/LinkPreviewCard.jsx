"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Loader2 } from "lucide-react";

export default function LinkPreviewCard({ text }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Extract first URL from text
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  const url = match ? match[0] : null;

  useEffect(() => {
    if (!url) return;

    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        
        if (!json.title && !json.image) throw new Error("No metadata");
        setData(json);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (!url || error) return null;

  return (
    <div className="mt-2 mb-1 max-w-sm">
      {loading ? (
        <div className="h-16 w-full bg-secondary/10 border-l-2 border-border animate-pulse flex items-center px-4">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-secondary/10 border-l-2 border-accent hover:bg-secondary/20 transition-colors group overflow-hidden"
        >
            {data.image && (
                <div className="relative w-full h-32 bg-black">
                    <Image src={data.image} alt="Preview" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
            <div className="p-3">
                <h4 className="text-xs font-bold text-accent truncate">{data.siteName}</h4>
                <p className="text-sm font-bold text-foreground line-clamp-1">{data.title}</p>
                {data.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-mono">{data.description}</p>
                )}
            </div>
        </a>
      ) : null}
    </div>
  );
}