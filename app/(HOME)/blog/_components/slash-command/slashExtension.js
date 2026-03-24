import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import CommandList from './CommandList'
import { 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, Code, Quote, 
  Layers, Image as ImageIcon, Youtube 
} from 'lucide-react'

// 1. Define the Commands
const getSuggestionItems = () => ({ query }) => {
  return [
    { title: 'Heading 1', icon: Heading1, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
    { title: 'Heading 2', icon: Heading2, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
    { title: 'Heading 3', icon: Heading3, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() } },
    { title: 'Bullet List', icon: List, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
    { title: 'Numbered List', icon: ListOrdered, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run() } },
    { title: 'Code Terminal', icon: Code, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } },
    { title: 'Blockquote', icon: Quote, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
    
    // --- STARK CUSTOM ACTIONS ---
    { 
        title: 'Uplink Dossier', 
        icon: Layers, 
        command: ({ editor, range }) => { 
            editor.chain().focus().deleteRange(range).run(); 
            window.dispatchEvent(new CustomEvent('stark-open-project-modal')); 
        } 
    },
    { 
        title: 'Inject Image', 
        icon: ImageIcon, 
        command: ({ editor, range }) => { 
            editor.chain().focus().deleteRange(range).run(); 
            window.dispatchEvent(new CustomEvent('stark-open-image-upload')); 
        } 
    },
    { 
        title: 'Embed Stream', 
        icon: Youtube, 
        command: ({ editor, range }) => { 
            editor.chain().focus().deleteRange(range).run(); 
            window.dispatchEvent(new CustomEvent('stark-open-yt-modal')); 
        } 
    },
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
}

// 2. Setup the Tippy Popup Renderer
const renderItems = () => {
  let component
  let popup

  return {
    onStart: props => {
      component = new ReactRenderer(CommandList, { props, editor: props.editor })
      if (!props.clientRect) return
      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'stark'
      })
    },
    onUpdate(props) {
      component.updateProps(props)
      if (!props.clientRect) return
      popup[0].setProps({ getReferenceClientRect: props.clientRect })
    },
    onKeyDown(props) {
      if (props.event.key === 'Escape') { popup[0].hide(); return true }
      return component.ref?.onKeyDown(props)
    },
    onExit() { popup[0].destroy(); component.destroy() },
  }
}

// 3. Create and Export the Tiptap Extension
export const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: getSuggestionItems(),
        render: renderItems,
      }),
    ]
  },
})