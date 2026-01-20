"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import { 
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
  List, ListOrdered, Quote, Code, Undo, Redo, 
  Heading1, Heading2, Heading3, Table as TableIcon, 
  PlusSquare, Trash2, ChevronDown
} from 'lucide-react';
import { useCallback, useEffect } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-zinc-900 sticky top-0 z-10 backdrop-blur-sm">
      
      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} />

      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Basic Marks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
      <ToolbarBtn onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} />
      
      <div className="w-[1px] h-6 bg-white/10 mx-1" />
      
      {/* Lists & Blocks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={Code} />
      
      <div className="w-[1px] h-6 bg-white/10 mx-1" />

      {/* Tables */}
      <ToolbarBtn onClick={addTable} isActive={editor.isActive('table')} icon={TableIcon} />
      
      {/* Contextual Table Tools (Only show when inside a table) */}
      {editor.isActive('table') && (
        <div className="flex gap-1 animate-in fade-in zoom-in-95 duration-200">
            <TableControlBtn onClick={() => editor.chain().focus().addColumnAfter().run()} label="+Col" />
            <TableControlBtn onClick={() => editor.chain().focus().addRowAfter().run()} label="+Row" />
            <TableControlBtn onClick={() => editor.chain().focus().deleteTable().run()} label="DEL" isDestructive />
        </div>
      )}

      <div className="flex-1" />
      
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} icon={Undo} />
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} icon={Redo} />
    </div>
  );
};

const ToolbarBtn = ({ onClick, isActive, icon: Icon }) => (
  <button
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`p-2 rounded-none transition-colors ${isActive ? 'bg-red-600 text-white' : 'hover:bg-white/10 text-zinc-500 hover:text-white'}`}
  >
    <Icon size={14} />
  </button>
);

const TableControlBtn = ({ onClick, label, isDestructive }) => (
    <button
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`px-2 py-1 text-[9px] font-mono font-bold uppercase border border-white/10 transition-colors 
        ${isDestructive ? 'hover:bg-red-600 text-red-500 hover:text-white' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
    >
        {label}
    </button>
);

export default function AnnouncementEditor({ content, onChange, placeholder = "Start typing..." }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '', 
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6 font-light leading-relaxed font-sans text-zinc-200 selection:bg-red-500/30',
        },
    },
  });

  useEffect(() => {
    if (editor && content) {
       if (editor.isEmpty) {
           editor.commands.setContent(content);
       }
    }
  }, [content, editor]);

  return (
    <div className="border border-white/10 bg-black flex flex-col focus-within:ring-1 focus-within:ring-red-600 transition-all overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto max-h-[600px]" />

      <style jsx global>{`
        /* TipTap Table Styles for the Editor */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #333;
          padding: 6px 10px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          content: "";
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.08);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}