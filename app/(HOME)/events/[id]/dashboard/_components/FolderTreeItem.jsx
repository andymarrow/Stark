"use client";
import { useState } from "react";
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, 
  Inbox, Archive, Plus, Trash2, Globe, MoreHorizontal, CheckCircle2,
  Eye, EyeOff
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function FolderTreeItem({ 
  folder, 
  allFolders, 
  submissions,
  activeId, 
  onSelect, 
  onDrop, 
  onCreateSubfolder,
  onDelete,
  onTogglePublic, // <--- New Prop
  level = 0 
}) {
  // SENIOR UX: Keep folders open by default so they don't collapse during drag
  const [isExpanded, setIsExpanded] = useState(true); 
  const [isOver, setIsOver] = useState(false);

  const children = allFolders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;
  const isActive = activeId === folder.id;
  const isSystem = ['Inbox', 'Accepted', 'Rejected'].includes(folder.name);
  
  // Calculate count for this specific folder
  const count = submissions.filter(s => {
    if (s.folder_id === folder.id) return true;
    // Fallback for Inbox
    if (folder.name === 'Inbox' && !s.folder_id) return true;
    return false;
  }).length;

  const Icon = folder.name === 'Inbox' ? Inbox : folder.name === 'Accepted' ? CheckCircle2 : folder.name === 'Rejected' ? Archive : isExpanded ? FolderOpen : Folder;

  return (
    <div className="select-none">
      <div 
        className={`
            group flex items-center justify-between py-1.5 px-2 rounded-sm cursor-pointer transition-all border relative
            ${isActive ? "bg-accent/10 text-accent border-accent/20" : "text-muted-foreground border-transparent hover:bg-secondary/10 hover:text-foreground"}
            ${isOver ? "bg-accent/20 border-accent scale-[1.02] shadow-lg z-10" : ""}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }} 
        onClick={() => onSelect(folder.id)}
        
        // DRAG & DROP LOGIC
        onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent parent folders from highlighting
            if (!isOver) setIsOver(true);
        }}
        onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOver(false);
        }}
        onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOver(false);
            onDrop(e, folder.id);
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1 pointer-events-none">
            {/* Expander Arrow */}
            <div 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className={`p-0.5 rounded-sm pointer-events-auto ${hasChildren ? 'opacity-100 hover:bg-white/10' : 'opacity-0'}`}
            >
                {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </div>

            <Icon size={14} className={`flex-shrink-0 ${isActive || isOver ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
            
            <span className="truncate text-xs font-medium">{folder.name}</span>
            
            {folder.is_public && (
                <Globe size={10} className="text-green-500 flex-shrink-0 ml-1" />
            )}
        </div>

        {/* Count Indicator & Menu */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className={`text-[9px] font-mono ${isActive ? 'text-accent' : 'opacity-40'}`}>
                {count}
            </span>

            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button className={`p-1 rounded-sm transition-colors ${isActive ? 'text-accent hover:bg-accent/20' : 'text-muted-foreground/40 hover:text-foreground hover:bg-background'}`}>
                        <MoreHorizontal size={12} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background border border-border rounded-none shadow-xl z-50">
                    <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)} className="text-xs font-mono uppercase cursor-pointer">
                        <Plus size={12} className="mr-2" /> New Subfolder
                    </DropdownMenuItem>
                    
                    {/* Visibility Toggle */}
                    <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onTogglePublic(folder.id); }} 
                        className="text-xs font-mono uppercase cursor-pointer"
                    >
                        {folder.is_public ? (
                            <>
                                <EyeOff size={12} className="mr-2" /> Make Private
                            </>
                        ) : (
                            <>
                                <Eye size={12} className="mr-2" /> Make Public
                            </>
                        )}
                    </DropdownMenuItem>

                    {!isSystem && (
                        <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem onClick={() => onDelete(folder.id)} className="text-xs font-mono uppercase cursor-pointer text-red-500">
                                <Trash2 size={12} className="mr-2" /> Delete Folder
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Children */}
      {isExpanded && children.map(child => (
        <FolderTreeItem 
            key={child.id}
            folder={child}
            allFolders={allFolders}
            submissions={submissions}
            activeId={activeId}
            onSelect={onSelect}
            onDrop={onDrop}
            onCreateSubfolder={onCreateSubfolder}
            onDelete={onDelete}
            onTogglePublic={onTogglePublic} // <--- Pass down recursively
            level={level + 1}
        />
      ))}
    </div>
  );
}