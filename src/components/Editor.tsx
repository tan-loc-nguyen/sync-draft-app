import React from 'react';
import { EditorContent, useEditor, type Editor as TipTapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

export interface EditorProps {
  onChange?: (value: string) => void,
  content?: string | null,
  editable?: boolean
}

const colors = {
  highlight: [
    "#FFFF00", // Yellow (Most common highlight color)
    "#90EE90", // Light Green
    "#ADD8E6", // Light Blue
    "#D3D3D3", // Light Gray (Subtle highlight)
  ],
  text: [
    '#000000',
    '#FF0000',
    "#4A4A4A", // Dark Gray (Secondary text or less emphasis)
    "#A9A9A9", // Light Gray (For annotations, footnotes)
    "#000080", // Navy Blue (Titles, headings, or emphasis)
    "#654321", // Dark Brown (Elegant headings or subtle emphasis)
    "#228B22", // Forest Green (For light emphasis or headers)
    "#800020", // Burgundy (For subtle, sophisticated emphasis)
    "#2F4F4F", // Dark Slate Gray
    "#191970"  // Midnight Blue (Professional look for titles or headings)
  ]
};

const buttonClass = (active: boolean) =>
  `px-2 py-1 text-sm rounded border ${active ? 'bg-gray-800 text-white' : 'bg-white hover:bg-gray-100'}`;

const Toolbar: React.FC<{ editor: TipTapEditor }> = ({ editor }) => {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className='flex flex-row flex-wrap items-center gap-1 border rounded-t-lg p-2 bg-gray-50'>
      <button
        type='button'
        aria-label='Bold'
        className={buttonClass(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </button>
      <button
        type='button'
        aria-label='Italic'
        className={buttonClass(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </button>
      <button
        type='button'
        aria-label='Underline'
        className={buttonClass(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </button>
      <button
        type='button'
        aria-label='Strikethrough'
        className={buttonClass(editor.isActive('strike'))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </button>

      <span className='w-px h-5 bg-gray-300 mx-1' />

      {colors.text.map((color) => (
        <button
          key={color}
          type='button'
          aria-label={`Text colour ${color}`}
          className='w-5 h-5 rounded-full border'
          style={{ backgroundColor: color }}
          onClick={() => editor.chain().focus().setColor(color).run()}
        />
      ))}

      <span className='w-px h-5 bg-gray-300 mx-1' />

      {colors.highlight.map((color) => (
        <button
          key={color}
          type='button'
          aria-label={`Highlight ${color}`}
          className='w-5 h-5 rounded border'
          style={{ backgroundColor: color }}
          onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
        />
      ))}

      <span className='w-px h-5 bg-gray-300 mx-1' />

      <button
        type='button'
        aria-label='Link'
        className={buttonClass(editor.isActive('link'))}
        onClick={setLink}
      >
        🔗
      </button>
      <button
        type='button'
        aria-label='Clear formatting'
        className={buttonClass(false)}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
      >
        Clear
      </button>
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ onChange, content, editable = true }) => {
  const editor = useEditor({
    editable,
    content: content ?? '',
    extensions: [
      // Underline and Link ship separately so their configuration stays explicit.
      StarterKit.configure({ underline: false, link: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none p-3 min-h-[200px]',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Content arrives asynchronously (fetch, socket broadcast). Only push it into
  // the editor when it genuinely differs, otherwise every keystroke would reset
  // the cursor to the start of the document.
  React.useEffect(() => {
    if (!editor) return;

    const incoming = content ?? '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [content, editor]);

  React.useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return editable ? (
    <div className='mt-6 flex flex-col'>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className='border border-t-0 rounded-b-lg h-[720px] overflow-auto' />
    </div>
  ) : (
    <EditorContent editor={editor} className='w-full h-full overflow-auto' />
  );
};

export default Editor;
