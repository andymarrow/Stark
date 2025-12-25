"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown'; // Critical for converting to/from Markdown
import { Bold, Italic, Code, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

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
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      title: "Ordered List"
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
    ],
    content: value,
    immediatelyRender: false, // <--- CRITICAL FIX FOR NEXT.JS 15 / REACT 19
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-sm font-mono leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      // Get Markdown content instead of HTML
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  // Sync content if value changes externally (e.g. Import Readme clicked)
  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full border border-border bg-background focus-within:border-accent transition-colors overflow-hidden flex flex-col">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}