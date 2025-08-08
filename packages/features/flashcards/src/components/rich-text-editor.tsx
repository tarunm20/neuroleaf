'use client';

import React, { useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Underline from '@tiptap/extension-underline';
import { createLowlight, common } from 'lowlight';
import { Button } from '@kit/ui/button';
import { Separator } from '@kit/ui/separator';
import { cn } from '@kit/ui/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  className?: string;
  editable?: boolean;
  minimal?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children, 
  title 
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted'
      )}
      title={title}
    >
      {children}
    </Button>
  );
}

interface MenuBarProps {
  editor: Editor;
  minimal?: boolean;
}

function MenuBar({ editor, minimal }: MenuBarProps) {
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (minimal) {
    return (
      <div className="flex items-center gap-1 p-2 border-b">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <Separator orientation="vertical" className="h-6" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b flex-wrap">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      {/* Paragraph styles */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Paragraph"
      >
        <Type className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <span className="text-sm font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="text-sm font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="text-sm font-bold">H3</span>
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      {/* Media and links */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addImage}
        title="Add Image"
      >
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={addTable}
        title="Add Table"
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6" />

      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content = '',
  placeholder = 'Start writing...',
  onChange,
  onBlur,
  className,
  editable = true,
  minimal = false,
}: RichTextEditorProps) {
  const extensions = useMemo(() => [
    StarterKit,
    Underline,
    Placeholder.configure({
      placeholder,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg',
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-muted p-3 rounded-md text-sm',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse border border-border',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border border-border',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-border bg-muted font-semibold p-2',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-border p-2',
      },
    }),
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[120px] p-3',
          !editable && 'cursor-default'
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {editable && <MenuBar editor={editor} minimal={minimal} />}
      <EditorContent editor={editor} />
    </div>
  );
}