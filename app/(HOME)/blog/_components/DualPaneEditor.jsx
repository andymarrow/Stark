"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

// TIPTAP EXTENSIONS
import { Underline } from "@tiptap/extension-underline";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Link as TiptapLink } from "@tiptap/extension-link";
import { Youtube } from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align"; 
import Dropcursor from "@tiptap/extension-dropcursor";

// CUSTOM EXTENSIONS
import { StarkProjectEmbed } from "./ProjectEmbedExtension";
import { SlashCommand } from "./slash-command/slashExtension";

// SYNTAX HIGHLIGHTING
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/_context/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import { 
  Terminal, PenTool, Bold, Italic, Underline as UnderlineIcon, 
  Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, 
  Quote, Image as ImageIcon, Link as LinkIcon, Youtube as YoutubeIcon, 
  Table as TableIcon, Undo, Redo, Loader2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  UploadCloud, FileText, Copy, Check, Layers, Search, ArrowRight
} from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const lowlight = createLowlight(common);

// --- 1. STARK CODE BLOCK COMPONENT ---
const CodeBlockNode = ({ node }) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || 'text';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative my-8 border border-border bg-black group rounded-none overflow-hidden font-mono shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border select-none" contentEditable={false}>
        <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground tracking-widest font-bold">
          <Terminal size={14} className="text-accent" />
          {language === 'text' ? 'CODE_BLOCK' : language}
        </div>
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest transition-colors ${copied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 m-0 bg-transparent text-[13px] leading-relaxed overflow-x-auto custom-scrollbar text-zinc-300">
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
};

// --- 2. SHARED VIEW TOGGLES ---
const ViewToggles = ({ viewMode, setViewMode }) => (
  <div className="flex items-center bg-background border border-border p-1 shrink-0 ml-2">
      <button onClick={() => setViewMode('visual')} className={`px-2 md:px-3 py-1 text-[10px] font-mono uppercase transition-colors ${viewMode === 'visual' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
          Visual
      </button>
      <button onClick={() => setViewMode('split')} className={`hidden md:block px-3 py-1 text-[10px] font-mono uppercase transition-colors ${viewMode === 'split' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
          Split
      </button>
      <button onClick={() => setViewMode('code')} className={`px-2 md:px-3 py-1 text-[10px] font-mono uppercase transition-colors ${viewMode === 'code' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
          Code
      </button>
  </div>
);

// --- 3. THE RICH TOOLBAR COMPONENT ---
const RichToolbar = ({ editor, isUploading, onUploadImage }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isYtModalOpen, setIsYtModalOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");

  // PROJECT EMBED MODAL STATE
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [isSearchingProjects, setIsSearchingProjects] = useState(false);

  // --- PROJECT SEARCH LOGIC ---
  const fetchUserProjects = useCallback(async (q = "") => {
    if (!user) return;
    setIsSearchingProjects(true);
    
    let query = supabase
        .from('projects')
        .select(`
          id, title, thumbnail_url, slug, views, likes_count, created_at,
          author:profiles!owner_id(username, full_name, avatar_url)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (q) query = query.ilike('title', `%${q}%`);
    
    const { data } = await query.limit(5);
    setUserProjects(data || []);
    setIsSearchingProjects(false);
  }, [user]);

  useEffect(() => {
    if (isProjectModalOpen) fetchUserProjects();
  }, [isProjectModalOpen, fetchUserProjects]);

  // --- MOVED LISTENER LOGIC HERE ---
  useEffect(() => {
    const handleOpenProjectModal = () => setIsProjectModalOpen(true);
    const handleOpenYtModal = () => { setYtUrl(""); setIsYtModalOpen(true); };
    const handleOpenImageUpload = () => fileInputRef.current?.click();

    window.addEventListener('stark-open-project-modal', handleOpenProjectModal);
    window.addEventListener('stark-open-yt-modal', handleOpenYtModal);
    window.addEventListener('stark-open-image-upload', handleOpenImageUpload);

    return () => {
      window.removeEventListener('stark-open-project-modal', handleOpenProjectModal);
      window.removeEventListener('stark-open-yt-modal', handleOpenYtModal);
      window.removeEventListener('stark-open-image-upload', handleOpenImageUpload);
    };
  }, []);

  if (!editor) return null;

  const insertProject = (project) => {
      editor.chain().focus().insertContent({
          type: 'starkProjectEmbed',
          attrs: { projectId: project.id, projectData: project }
      }).run();
      setIsProjectModalOpen(false);
      setProjectSearch("");
      toast.success("Dossier Linked Successfully");
  };

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setIsLinkModalOpen(true);
  };

  const handleLinkSubmit = () => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const formattedUrl = /^https?:\/\//.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: formattedUrl }).run();
    }
    setIsLinkModalOpen(false);
    setLinkUrl("");
  };

  const openYtModal = () => {
    setYtUrl("");
    setIsYtModalOpen(true);
  };

  const handleYtSubmit = () => {
    if (ytUrl) {
      editor.commands.setYoutubeVideo({ 
          src: ytUrl, 
          width: Math.max(320, parseInt(editor.view.dom.clientWidth, 10)) - 40 
      });
    }
    setIsYtModalOpen(false);
    setYtUrl("");
  };

  const ToolbarBtn = ({ icon: Icon, action, isActive, disabled, title }) => (
    <button
      onClick={(e) => { e.preventDefault(); action(); }}
      disabled={disabled}
      title={title}
      className={`p-2 transition-all shrink-0 rounded-none border border-transparent 
        ${isActive ? "bg-accent text-white border-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <Icon size={16} />
    </button>
  );

  const Divider = () => <div className="w-[1px] h-5 bg-border mx-1 shrink-0" />;

  return (
    <>
      <div className="flex items-center gap-0.5 p-1 bg-secondary/10 border-b border-border overflow-x-auto no-scrollbar w-full flex-nowrap shrink-0">
        <ToolbarBtn icon={Heading1} title="Heading 1" action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} />
        <ToolbarBtn icon={Heading2} title="Heading 2" action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} />
        <ToolbarBtn icon={Heading3} title="Heading 3" action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} />
        <Divider />
        
        <ToolbarBtn icon={Bold} title="Bold" action={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} />
        <ToolbarBtn icon={Italic} title="Italic" action={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} />
        <ToolbarBtn icon={UnderlineIcon} title="Underline" action={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} />
        <ToolbarBtn icon={Strikethrough} title="Strikethrough" action={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} />
        <ToolbarBtn icon={Code} title="Inline Code" action={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} />
        <Divider />

        <ToolbarBtn icon={AlignLeft} title="Align Left" action={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} />
        <ToolbarBtn icon={AlignCenter} title="Align Center" action={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} />
        <ToolbarBtn icon={AlignRight} title="Align Right" action={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} />
        <ToolbarBtn icon={AlignJustify} title="Justify" action={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} />
        <Divider />

        <ToolbarBtn icon={List} title="Bullet List" action={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} />
        <ToolbarBtn icon={ListOrdered} title="Ordered List" action={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} />
        <ToolbarBtn icon={Quote} title="Blockquote" action={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} />
        <Divider />

        <ToolbarBtn icon={LinkIcon} title="Hyperlink" action={openLinkModal} isActive={editor.isActive("link")} />
        <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) onUploadImage(e.target.files[0], null); fileInputRef.current.value = ""; }} className="hidden" accept="image/*" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          title="Upload Image"
          className="p-2 shrink-0 transition-all rounded-none border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin text-accent" /> : <ImageIcon size={16} />}
        </button>

        <ToolbarBtn icon={YoutubeIcon} title="Embed YouTube" action={openYtModal} isActive={editor.isActive("youtube")} />
        <ToolbarBtn icon={TableIcon} title="Insert Table" action={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={editor.isActive("table")} />
        <Divider />

        <ToolbarBtn icon={Layers} title="Uplink Project Dossier" action={() => setIsProjectModalOpen(true)} isActive={editor.isActive("starkProjectEmbed")} />
        <Divider />

        <ToolbarBtn icon={Undo} title="Undo" action={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
        <ToolbarBtn icon={Redo} title="Redo" action={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Project Search Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border p-0 rounded-none shadow-2xl gap-0 z-[100]">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 font-mono">
              <Layers size={18} className="text-accent" /> Uplink_Dossier_Asset
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={14} />
                  <Input 
                    autoFocus 
                    value={projectSearch} 
                    onChange={(e) => { setProjectSearch(e.target.value); fetchUserProjects(e.target.value); }} 
                    placeholder="Search your deployments..." 
                    className="pl-10 h-10 rounded-none bg-secondary/5 border-border focus-visible:ring-accent font-mono text-xs" 
                  />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {isSearchingProjects ? (
                      <div className="py-10 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></div>
                  ) : userProjects.length > 0 ? (
                      userProjects.map(proj => (
                          <button 
                            key={proj.id} 
                            onClick={() => insertProject(proj)}
                            className="w-full flex items-center gap-3 p-2 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group text-left"
                          >
                              <div className="w-12 h-8 relative bg-secondary overflow-hidden shrink-0">
                                  {proj.thumbnail_url && <Image src={proj.thumbnail_url} alt="" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold uppercase truncate text-foreground group-hover:text-accent">{proj.title}</p>
                                  <p className="text-[9px] font-mono text-muted-foreground uppercase">ID: {proj.slug}</p>
                              </div>
                              <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                      ))
                  ) : (
                      <div className="py-10 text-center text-[10px] font-mono text-muted-foreground uppercase border border-dashed border-border">No Deployments Found</div>
                  )}
              </div>
          </div>
          <DialogFooter className="p-4 border-t border-border bg-secondary/5">
              <DialogClose asChild><Button variant="ghost" className="rounded-none font-mono text-xs uppercase">Abort</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border p-0 rounded-none shadow-2xl gap-0 z-[100]">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 font-mono">
              <LinkIcon size={18} className="text-accent" /> Inject Hyperlink
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <label className="text-[10px] font-mono uppercase text-muted-foreground mb-2 block">Target URL</label>
            <Input autoFocus value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="bg-secondary/5 border-border focus-visible:ring-accent font-mono text-xs rounded-none h-10" onKeyDown={(e) => { if (e.key === 'Enter') handleLinkSubmit() }} />
          </div>
          <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline" className="rounded-none border-border hover:bg-secondary font-mono text-xs uppercase h-9">Cancel</Button></DialogClose>
            <Button onClick={handleLinkSubmit} className="bg-accent hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-9">{linkUrl ? "Apply Link" : "Remove Link"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Youtube Modal */}
      <Dialog open={isYtModalOpen} onOpenChange={setIsYtModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border p-0 rounded-none shadow-2xl gap-0 z-[100]">
          <DialogHeader className="p-6 border-b border-border bg-secondary/5">
            <DialogTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 font-mono">
              <YoutubeIcon size={18} className="text-accent" /> Embed Media Stream
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <label className="text-[10px] font-mono uppercase text-muted-foreground mb-2 block">YouTube URL</label>
            <Input autoFocus value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="..." className="bg-secondary/5 border-border focus-visible:ring-accent font-mono text-xs rounded-none h-10" onKeyDown={(e) => { if (e.key === 'Enter') handleYtSubmit() }} />
          </div>
          <DialogFooter className="p-4 border-t border-border bg-secondary/5 flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline" className="rounded-none border-border hover:bg-secondary font-mono text-xs uppercase h-9">Cancel</Button></DialogClose>
            <Button onClick={handleYtSubmit} disabled={!ytUrl} className="bg-accent hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase h-9">Embed Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// --- 4. MAIN DUAL PANE EDITOR ---
export default function DualPaneEditor({ content, setContent, setJsonContent }) {
  const [viewMode, setViewMode] = useState("split"); 

  // Drag & Drop States
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingVisual, setIsDraggingVisual] = useState(false);
  const [isDraggingCode, setIsDraggingCode] = useState(false); 

  const textareaRef = useRef(null); 

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768 && viewMode === "split") setViewMode("visual");
    };
    window.addEventListener("resize", handleResize);
    handleResize(); 
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  const processImageUpload = async (file, insertPos = null) => {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");

      setIsUploading(true);
      const toastId = toast.loading("Encrypting Asset...");
      try {
          const fileExt = file.name.split(".").pop();
          const fileName = `blog-assets/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("project-assets").upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("project-assets").getPublicUrl(fileName);
          
          if (insertPos !== null && editor) {
              editor.chain().insertContentAt(insertPos, { type: 'image', attrs: { src: publicUrl } }).focus().run();
          } else if (editor) {
              editor.chain().focus().setImage({ src: publicUrl }).run();
          }
          toast.success("Asset Injected Successfully", { id: toastId });
      } catch (error) {
          toast.error("Upload Failed", { description: error.message, id: toastId });
      } finally {
          setIsUploading(false);
      }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown.configure({ html: true, transformPastedText: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapImage.configure({ inline: false, HTMLAttributes: { class: 'border border-border shadow-md my-8 w-full h-auto cursor-pointer transition-colors hover:border-accent' } }),
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-accent underline decoration-accent/50 underline-offset-4 hover:decoration-accent transition-colors' } }),
      Youtube.configure({ inline: false, HTMLAttributes: { class: 'w-full aspect-video border border-border shadow-md my-4' } }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Dropcursor.configure({ color: '#ef4444', width: 2 }),
      CodeBlockLowlight.extend({ addNodeView() { return ReactNodeViewRenderer(CodeBlockNode) } }).configure({ lowlight }),
      StarkProjectEmbed,
      SlashCommand,
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-full pb-32 p-4 md:p-10 font-mono text-sm leading-[1.8] prose-headings:font-bold prose-headings:tracking-tight prose-headings:uppercase prose-h1:text-3xl prose-h2:text-2xl prose-code:text-accent prose-code:bg-secondary/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-pre:bg-black prose-pre:border prose-pre:border-border prose-pre:rounded-none prose-hr:border-border prose-table:border-collapse prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-th:bg-secondary/20 prose-td:border prose-td:border-border",
      },
    },
    onUpdate: ({ editor }) => {
      if (textareaRef.current && document.activeElement === textareaRef.current) return;
      const markdown = editor.storage.markdown.getMarkdown();
      const json = editor.getJSON(); 
      setContent(markdown);
      if (setJsonContent) setJsonContent(json); 
    },
  });

  useEffect(() => {
      if (editor && content) {
          if (textareaRef.current && document.activeElement === textareaRef.current) return;
          const currentTiptapContent = editor.storage.markdown.getMarkdown();
          if (content !== currentTiptapContent && Math.abs(content.length - currentTiptapContent.length) > 10) {
              editor.commands.setContent(content, false);
          }
      }
  }, [content, editor]);

  const handleMarkdownChange = (e) => {
    const newMarkdown = e.target.value;
    setContent(newMarkdown);
    if (editor) {
      const currentMarkdown = editor.storage.markdown.getMarkdown();
      if (currentMarkdown !== newMarkdown) {
        editor.commands.setContent(newMarkdown, false);
        if (setJsonContent) setJsonContent(editor.getJSON());
      }
    }
  };

  const onVisualDrop = (e) => {
      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
          setIsDraggingVisual(false);
          return; 
      }
      e.preventDefault();
      setIsDraggingVisual(false);
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
          let insertPos = null;
          if (editor) {
              const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
              if (coords) insertPos = coords.pos;
          }
          processImageUpload(file, insertPos);
      } else {
          toast.error("Invalid Asset", { description: "Drop an image file into the visual console." });
      }
  };

  const onCodeDrop = (e) => {
      e.preventDefault();
      setIsDraggingCode(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.type.includes('text')) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const text = event.target.result;
              const newContent = content ? content + '\n\n' + text : text;
              setContent(newContent);
              if (editor) {
                  editor.commands.setContent(newContent, false); 
                  if (setJsonContent) setJsonContent(editor.getJSON());
              }
              toast.success("Markdown Parsed Successfully");
          };
          reader.readAsText(file);
      } else {
          toast.error("Invalid Payload", { description: "Drop a valid .md or .txt file here." });
      }
  };

  return (
    <div className="flex flex-col md:flex-row w-full flex-1 min-h-0 relative bg-background border-t border-border">
      {/* VISUAL PANE */}
      <div 
        className={`flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 relative
          ${viewMode === 'code' ? 'hidden md:hidden' : 'flex'}
          ${viewMode === 'split' ? 'md:border-r border-border' : ''}
        `}
        onDragEnter={() => setIsDraggingVisual(true)}
      >
        <div className="h-10 md:h-12 bg-secondary/20 dark:bg-zinc-950 border-b border-border flex items-center justify-between px-3 md:px-4 shrink-0">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest shrink-0">
                <PenTool size={14} className="text-accent" /> 
                <span className="hidden sm:inline">Visual_Console</span>
                <span className="sm:hidden">Visual</span>
            </div>
            {viewMode === 'visual' && <ViewToggles viewMode={viewMode} setViewMode={setViewMode} />}
        </div>

        <div className="w-full shrink-0">
            <RichToolbar editor={editor} isUploading={isUploading} onUploadImage={(file) => processImageUpload(file, null)} />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 relative bg-background">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            <EditorContent editor={editor} className="relative z-10 h-full" />
        </div>

        {/* VISUAL DRAG OVERLAY */}
        {isDraggingVisual && (
            <div 
                className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm border-4 border-dashed border-accent flex flex-col items-center justify-center text-accent transition-all duration-300"
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsDraggingVisual(false)}
                onDrop={onVisualDrop}
            >
                <div className="p-4 bg-accent/10 rounded-full mb-4">
                    <UploadCloud size={48} className="animate-bounce" />
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-2">Inject Image Asset</h3>
                <p className="text-xs font-mono uppercase tracking-widest opacity-70 text-center px-4">
                    Release to automatically upload and render into document
                </p>
            </div>
        )}
      </div>

      {/* RAW MARKDOWN PANE */}
      <div 
        className={`flex-1 flex flex-col min-w-0 min-h-0 bg-zinc-50 dark:bg-black transition-all duration-300 relative
          ${viewMode === 'visual' ? 'hidden md:hidden' : 'flex'}
        `}
        onDragEnter={() => setIsDraggingCode(true)}
      >
        <div className="h-10 md:h-12 bg-secondary/20 dark:bg-zinc-950 border-b border-border flex items-center justify-between px-3 md:px-4 shrink-0">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest shrink-0">
                <Terminal size={14} className="text-accent" /> 
                <span className="hidden sm:inline">Source_MD</span>
                <span className="sm:hidden">Markdown</span>
            </div>
            {viewMode !== 'visual' && <ViewToggles viewMode={viewMode} setViewMode={setViewMode} />}
        </div>

        <div className="flex-1 p-0 relative overflow-hidden min-h-0">
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-10 bg-secondary/10 dark:bg-zinc-900/50 border-r border-border flex flex-col text-[10px] text-muted-foreground/50 items-center pt-4 md:pt-8 pointer-events-none select-none font-mono z-10">
                {Array.from({ length: 100 }).map((_, i) => <span key={`line-${i}`} className="mb-[14px]">{i + 1}</span>)}
            </div>
            
            <textarea
                ref={textareaRef} 
                value={content}
                onChange={handleMarkdownChange}
                spellCheck="false"
                className="w-full h-full bg-transparent text-foreground font-mono text-[10px] md:text-xs leading-[24px] p-4 md:p-8 pl-10 md:pl-14 resize-none outline-none custom-scrollbar relative z-0 pb-32"
                placeholder="> Initialize markdown sequence..."
            />
        </div>

        {/* CODE DRAG OVERLAY */}
        {isDraggingCode && (
            <div 
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm border-4 border-dashed border-green-500 flex flex-col items-center justify-center text-green-500 transition-all duration-300"
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsDraggingCode(false)}
                onDrop={onCodeDrop}
            >
                <div className="p-4 bg-green-500/10 rounded-full mb-4">
                    <FileText size={48} className="animate-pulse" />
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tighter mb-2">Parse Markdown Payload</h3>
                <p className="text-xs font-mono uppercase tracking-widest opacity-70 text-center px-4 text-green-400">
                    Release to read and inject .md file into source code
                </p>
            </div>
        )}
      </div>

    </div>
  );
}