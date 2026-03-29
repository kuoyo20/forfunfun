import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo2, Redo2
} from 'lucide-react';

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-2 rounded transition-colors ${
      active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center gap-1 flex-wrap px-4 py-2 border-b border-gray-200 bg-gray-50">
      <button className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button className={btn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="w-4 h-4" />
      </button>
      <button className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="w-4 h-4" />
      </button>
      <button className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="w-4 h-4" />
      </button>
      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
}
