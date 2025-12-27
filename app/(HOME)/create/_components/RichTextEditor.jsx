"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
// FIXED: Using named imports instead of default imports
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { 
  Bold, Italic, Code, List, ListOrdered, Heading1, Heading2, 
  Quote, Undo, Redo, Table as TableIcon, Trash2 
} from 'lucide-react';
import { useEffect } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const buttons = [
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      title: "H1"
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      title: "H2"
    },
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: "Bold"
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: "Italic"
    },
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
      title: "Code Block"
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      title: "Bullet List"
    },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      title: "Quote"
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/10 p-2">
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={(e) => { e.preventDefault(); btn.action(); }}
          className={`
            p-2 rounded-none transition-colors
            ${btn.isActive 
              ? 'bg-accent text-white' 
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
          `}
          title={btn.title}
        >
          <btn.icon size={16} />
        </button>
      ))}

      <div className="w-[1px] h-4 bg-border mx-1" />

      {/* TABLE TOOLS */}
      <button 
        onClick={(e) => { e.preventDefault(); addTable(); }}
        className="p-2 text-muted-foreground hover:text-accent flex items-center gap-1"
        title="Insert Table"
      >
        <TableIcon size={16} />
      </button>

      {editor.isActive('table') && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }} 
            className="px-2 text-[9px] font-mono uppercase text-accent hover:bg-secondary h-8 border border-transparent hover:border-border"
          >
             +Col
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }} 
            className="px-2 text-[9px] font-mono uppercase text-accent hover:bg-secondary h-8 border border-transparent hover:border-border"
          >
             +Row
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} 
            className="p-2 text-red-500 hover:bg-red-500/10 h-8"
          >
             <Trash2 size={14} />
          </button>
        </>
      )}

      <div className="w-[1px] h-4 bg-border mx-1 ml-auto" />

      <button onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run(); }} className="p-2 text-muted-foreground hover:text-foreground">
        <Undo size={16} />
      </button>
      <button onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run(); }} className="p-2 text-muted-foreground hover:text-foreground">
        <Redo size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      // FIXED: Using named imports here as well
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    immediatelyRender: false, 
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-sm font-mono leading-relaxed prose-table:border-collapse prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-th:bg-secondary/20 prose-td:border prose-td:border-border',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full border border-border bg-background focus-within:border-accent transition-colors overflow-hidden flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #3f3f46; /* Match border-border color */
          padding: 6px 8px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: rgba(63, 63, 70, 0.1);
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          content: "";
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(220, 38, 38, 0.05); /* Stark Accent tint */
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #ef4444; /* Accent color */
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}