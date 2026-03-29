import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import EditorToolbar from './EditorToolbar';

interface Props {
  content: string;
  onUpdate: (data: { html: string; text: string; json: string }) => void;
  editable?: boolean;
}

export default function TipTapEditor({ content, onUpdate, editable = true }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Placeholder.configure({ placeholder: '開始寫作...' }),
    ],
    content: content || '<p></p>',
    editable,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate({
          html: editor.getHTML(),
          text: editor.getText(),
          json: JSON.stringify(editor.getJSON()),
        });
      }, 800);
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none" />
    </div>
  );
}
