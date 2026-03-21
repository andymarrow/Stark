// app/(HOME)/blog/write/page.jsx
"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_context/AuthContext";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, ArrowLeft, Rocket, Save, CheckCircle2, 
  Image as ImageIcon, Trash2, Hash, X, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import DualPaneEditor from "../_components/DualPaneEditor";

// THE FIX IS RIGHT HERE:
import { broadcastNewBlog } from "@/app/actions/broadcastBlog";

// Predefined Network Tags
const SYSTEM_TAGS = [
  "ARCHITECTURE", "UI_UX", "Realization", "Life", "SYSTEM_DESIGN", 
  "TUTORIAL", "CAREER", "FRONTEND", "BACKEND", "AI_ML", "SECURITY"
];

// Helper: Generate clean slugs
const generateSlug = (text) => {
  return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
};

function WriteBlogContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id'); 

  // Blog State
  const [blogId, setBlogId] = useState(null); 
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); 
  const [coverImage, setCoverImage] = useState(""); 
  const [jsonContent, setJsonContent] = useState({}); 
  
  // Tags State
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isTagsPanelOpen, setIsTagsPanelOpen] = useState(false);
  
  const [originalStatus, setOriginalStatus] = useState("draft");
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId); 
  
  // Status State
  const [syncStatus, setSyncStatus] = useState("Awaiting_Input"); 
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false); 

  const autoSaveTimerRef = useRef(null);
  const coverInputRef = useRef(null);

  // --- STRICT BODY SCROLL LOCK ---
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'auto'; 
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      toast.error("Restricted Area", { description: "Authentication required." });
    }
  }, [user, authLoading, router]);

  // --- LOAD EXISTING DRAFT ---
  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !user) {
          setIsLoadingDraft(false);
          return;
      }
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', draftId)
          .eq('author_id', user.id)
          .single();
          
        if (error) throw error;
        if (data) {
          setBlogId(data.id);
          setTitle(data.title || "");
          setContent(data.content || "");
          setCoverImage(data.cover_image || "");
          setTags(data.tags || []); 
          setOriginalStatus(data.status || "draft");
          setSyncStatus("Synced");
        }
      } catch (err) {
        toast.error("Failed to load draft");
      } finally {
        setIsLoadingDraft(false); 
      }
    };
    loadDraft();
  }, [draftId, user]);

  // --- TAGS LOGIC ---
  const handleAddTag = (tagToAdd) => {
    const cleanTag = tagToAdd.toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
    if (!cleanTag) return;
    
    if (tags.length >= 5) {
        toast.error("Capacity Reached", { description: "Maximum 5 tags allowed." });
        return;
    }
    
    if (!tags.includes(cleanTag)) {
        setTags(prev => [...prev, cleanTag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // --- COVER IMAGE UPLOAD HANDLER ---
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Cover image must be under 5MB");

    setIsUploadingCover(true);
    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `blog-covers/${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from("project-assets").upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("project-assets").getPublicUrl(fileName);
        setCoverImage(publicUrl);
        toast.success("Cover Asset Acquired");
        
        saveDraft(true, publicUrl);

    } catch (error) {
        toast.error("Upload Failed", { description: error.message });
    } finally {
        setIsUploadingCover(false);
        if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  // --- CORE SAVE FUNCTION (DRAFTS) ---
  const saveDraft = useCallback(async (isManual = false, overrideCover = null) => {
    if (!title && !content && !coverImage && !overrideCover && tags.length === 0) return;
    
    setSyncStatus("Syncing");
    try {
        const baseSlug = generateSlug(title || "untitled-report");
        let finalSlug = baseSlug;

        if (!blogId) {
            const { count } = await supabase.from('blogs').select('*', { count: 'exact', head: true }).ilike('slug', `${baseSlug}%`);
            if (count > 0) finalSlug = `${baseSlug}-${count + 1}`;
        }

        const payload = {
            author_id: user.id,
            title: title || "Untitled Report",
            content: content,
            cover_image: overrideCover !== null ? overrideCover : coverImage, 
            tags: tags, 
            updated_at: new Date().toISOString()
        };

        if (!blogId) {
            payload.status = 'draft';
            payload.slug = finalSlug;
        }

        let query = supabase.from('blogs');
        if (blogId) {
            query = query.update(payload).eq('id', blogId).select().single();
        } else {
            query = query.insert(payload).select().single();
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!blogId && data) setBlogId(data.id); 
        
        setSyncStatus("Synced");
        if (isManual) toast.success("Changes Secured");

    } catch (error) {
        setSyncStatus("Unsaved");
        if (isManual) toast.error("Sync Failed", { description: error.message });
    }
  }, [blogId, title, content, coverImage, tags, user]);

  // --- AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (!title && !content && !coverImage && tags.length === 0) {
        setSyncStatus("Awaiting_Input");
        return;
    }
    if (syncStatus === "Synced" || syncStatus === "Awaiting_Input") {
        setSyncStatus("Unsaved");
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => { saveDraft(false); }, 2000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [title, content, coverImage, tags, saveDraft]); 

  // --- PUBLISH ENGINE ---
  const handlePublish = async () => {
    if (!title || !content) return toast.error("Transmission Error", { description: "Title and content required." });
    
    setIsPublishing(true);
    setSyncStatus("Syncing");

    try {
        const baseSlug = generateSlug(title);
        let finalSlug = baseSlug;

        let slugQuery = supabase.from('blogs').select('id', { count: 'exact', head: true }).ilike('slug', `${baseSlug}%`);
        if (blogId) slugQuery = slugQuery.neq('id', blogId);
        
        const { count, error: slugErr } = await slugQuery;
        if (slugErr) throw slugErr;
        
        if (count > 0) finalSlug = `${baseSlug}-${count + 1}`;

        const blogPayload = {
            author_id: user.id,
            title: title,
            content: content,
            cover_image: coverImage, 
            tags: tags, 
            slug: finalSlug, 
            status: 'published',
            updated_at: new Date().toISOString()
        };

        if (originalStatus === 'draft') {
            blogPayload.published_at = new Date().toISOString();
        }

        let currentBlogId = blogId;

        if (currentBlogId) {
            const { error: updateErr } = await supabase.from('blogs').update(blogPayload).eq('id', currentBlogId);
            if (updateErr) throw updateErr;
        } else {
            const { data: newBlog, error: insertErr } = await supabase.from('blogs').insert(blogPayload).select().single();
            if (insertErr) throw insertErr;
            currentBlogId = newBlog.id;
            setBlogId(currentBlogId);
        }

        const { count: vCount } = await supabase.from('blog_versions').select('*', { count: 'exact', head: true }).eq('blog_id', currentBlogId);
        const nextVersion = (vCount || 0) + 1;

        const { error: versionErr } = await supabase.from('blog_versions').insert({
            blog_id: currentBlogId,
            version_number: nextVersion,
            content_json: jsonContent, 
            content_markdown: content
        });

        if (versionErr) throw versionErr;

        // FETCH USERNAME FOR REDIRECT
        const { data: profileData } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        const authorUsername = profileData?.username || user?.user_metadata?.username || "user";

        // BROADCAST TO FOLLOWERS (IF NEWLY PUBLISHED)
        if (originalStatus === 'draft') {
            await broadcastNewBlog(currentBlogId, user.id, authorUsername, title, finalSlug);
        }

        toast.success(originalStatus === 'published' ? "Update Deployed" : "Intelligence Report Deployed", { 
            description: `Version ${nextVersion}.0 is now live.` 
        });
        
        router.push(`/${authorUsername}/blog/${finalSlug}`); 

    } catch (error) {
        toast.error("Deployment Failed", { description: error.message });
        setSyncStatus("Unsaved");
        setIsPublishing(false);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  if (!user) return null;

  return (
    <div className="fixed top-0 md:top-[69px] left-0 right-0 bottom-0 bg-background flex flex-col font-mono overflow-hidden z-40">
      
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />

      <header className="h-14 md:h-16 shrink-0 border-b border-border bg-secondary/5 flex items-center justify-between px-3 md:px-4 relative z-50">
        <div className="flex items-center flex-1 min-w-0 h-full">
            <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 pr-4">
                <ArrowLeft size={18} />
            </button>
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="REPORT_TITLE..."
                className="w-full bg-transparent text-sm md:text-xl font-bold uppercase tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground truncate h-full"
                autoFocus
            />
            
            <button 
                onClick={() => setIsTagsPanelOpen(!isTagsPanelOpen)}
                className={`hidden md:flex items-center gap-2 h-full px-4 md:px-6 border-l border-border transition-colors text-[10px] font-mono uppercase tracking-widest shrink-0
                    ${isTagsPanelOpen || tags.length > 0 ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
            >
                <Hash size={14} />
                <span>{tags.length > 0 ? `${tags.length} Tags` : 'Add Tags'}</span>
            </button>

            <button 
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="hidden md:flex items-center gap-2 h-full px-4 md:px-6 border-l border-border hover:bg-secondary/50 transition-colors text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground shrink-0"
            >
                {isUploadingCover ? <Loader2 size={14} className="animate-spin text-accent" /> : <ImageIcon size={14} />}
                <span>{coverImage ? 'Change Cover' : 'Add Cover'}</span>
            </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-border h-full">
            <span className={`hidden lg:flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-4
                ${syncStatus === 'Unsaved' ? 'text-amber-500' : 
                  syncStatus === 'Syncing' ? 'text-accent' : 
                  syncStatus === 'Synced' ? 'text-green-500' : 'text-muted-foreground'}`}
            >
                {syncStatus === 'Unsaved' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                {syncStatus === 'Syncing' && <Loader2 size={10} className="animate-spin" />}
                {syncStatus === 'Synced' && <CheckCircle2 size={10} />}
                {syncStatus === 'Awaiting_Input' && <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />}
                STATUS: {syncStatus}
            </span>

            <Button 
                variant="outline" 
                onClick={() => saveDraft(true)}
                disabled={syncStatus === 'Syncing' || (!title && !content && !coverImage && tags.length === 0)}
                className="h-8 md:h-9 px-2 md:px-4 rounded-none border-border text-[10px] md:text-xs uppercase hover:bg-secondary transition-colors hidden sm:flex shrink-0 ml-2"
            >
                <Save size={14} className="sm:mr-2" />
                <span className="hidden sm:inline">Force Sync</span>
            </Button>
            
            <Button 
                onClick={handlePublish}
                disabled={!title || !content || isPublishing || syncStatus === 'Syncing'}
                className="h-8 md:h-9 px-3 md:px-6 rounded-none bg-accent hover:bg-red-700 text-white text-[10px] md:text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 ml-2"
            >
                {isPublishing ? <Loader2 size={14} className="animate-spin mr-2" /> : <><span className="hidden sm:inline mr-1">{originalStatus === 'published' ? 'Update' : 'Initialize'}</span> Publish <Rocket size={14} className="ml-1.5" /></>}
            </Button>
        </div>
      </header>

      <AnimatePresence>
        {isTagsPanelOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border bg-background overflow-hidden z-40 shrink-0 shadow-lg"
            >
                <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-mono text-accent uppercase tracking-widest flex items-center gap-2">
                            <Hash size={12} /> Classification Matrix
                        </h3>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{tags.length} / 5 Slots Used</span>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {tags.length === 0 && <span className="text-xs text-muted-foreground font-mono italic">No classifications active...</span>}
                        {tags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent px-2 py-1 text-[10px] font-mono uppercase tracking-wider animate-in zoom-in-95">
                                #{tag}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 ml-1 transition-colors"><X size={10} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-2">
                        <div className="flex-1">
                            <div className="relative flex items-center border border-border focus-within:border-accent transition-colors bg-secondary/5">
                                <span className="absolute left-3 text-muted-foreground font-mono text-sm">#</span>
                                <input 
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput); } }}
                                    disabled={tags.length >= 5}
                                    placeholder={tags.length >= 5 ? "CAPACITY REACHED" : "TYPE_CUSTOM_TAG..."}
                                    className="w-full bg-transparent border-none h-10 pl-8 outline-none font-mono text-xs uppercase disabled:opacity-50"
                                />
                                <button 
                                    onClick={() => handleAddTag(tagInput)}
                                    disabled={!tagInput.trim() || tags.length >= 5}
                                    className="px-4 h-full border-l border-border hover:bg-secondary transition-colors text-[10px] font-mono uppercase text-muted-foreground disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">System Database:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {SYSTEM_TAGS.filter(t => !tags.includes(t)).slice(0, 8).map(sysTag => (
                                    <button 
                                        key={sysTag}
                                        onClick={() => handleAddTag(sysTag)}
                                        disabled={tags.length >= 5}
                                        className="text-[9px] font-mono uppercase tracking-widest border border-border bg-secondary/20 px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 flex items-center gap-1 group"
                                    >
                                        <Plus size={8} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                                        {sysTag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        {coverImage && (
            <div className="relative w-full h-24 md:h-32 shrink-0 border-b border-border bg-secondary/10 overflow-hidden group">
                <Image src={coverImage} alt="Cover" fill className="object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" onClick={() => { setCoverImage(""); saveDraft(false, ""); }} className="h-8 w-8 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-none border border-red-500/30 transition-colors" title="Purge Asset">
                       <Trash2 size={12} />
                   </Button>
                </div>
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[10px] font-mono text-accent uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" /> Cover_Asset_Active
                </div>
            </div>
        )}

        {isLoadingDraft ? (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="animate-spin text-accent" size={32} />
                    <span className="text-[10px] font-mono uppercase tracking-widest">Decrypting File Data...</span>
                </div>
            </div>
        ) : (
            <DualPaneEditor content={content} setContent={setContent} setJsonContent={setJsonContent} />
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-accent" size={32} /></div>}>
      <WriteBlogContent />
    </Suspense>
  );
}