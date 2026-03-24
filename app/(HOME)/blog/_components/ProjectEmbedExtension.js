import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ProjectEmbedNode from './ProjectEmbedNode';

export const StarkProjectEmbed = Node.create({
  name: 'starkProjectEmbed',
  group: 'block',
  atom: true, // This makes the node behave as a single unit

  addAttributes() {
    return {
      projectId: {
        default: null,
      },
      projectData: {
        default: null, // Cache initial data to prevent layout shift
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'stark-project-embed',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['stark-project-embed', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProjectEmbedNode);
  },
});