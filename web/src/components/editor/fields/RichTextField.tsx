"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface RichTextFieldProps {
  fieldKey: string;
  label: string;
  value: unknown;
  onChange: (value: string) => void;
}

/** Wraps a tiptap editor for the `richtext` field kind (stores plain HTML). */
export function RichTextField({ fieldKey, label, value, onChange }: RichTextFieldProps) {
  const htmlValue = typeof value === "string" ? value : "";
  const id = `field-${fieldKey}`;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write something…" }),
    ],
    content: htmlValue,
    // Required under Next.js App Router to avoid SSR hydration mismatch.
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const toggleLink = () => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Link URL");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const toolbarButtons: {
    label: string;
    icon: typeof Bold;
    isActive: () => boolean;
    onClick: () => void;
  }[] = editor
    ? [
        {
          label: "Bold",
          icon: Bold,
          isActive: () => editor.isActive("bold"),
          onClick: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: "Italic",
          icon: Italic,
          isActive: () => editor.isActive("italic"),
          onClick: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: "Bullet list",
          icon: List,
          isActive: () => editor.isActive("bulletList"),
          onClick: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: "Ordered list",
          icon: ListOrdered,
          isActive: () => editor.isActive("orderedList"),
          onClick: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: "Link",
          icon: LinkIcon,
          isActive: () => editor.isActive("link"),
          onClick: toggleLink,
        },
      ]
    : [];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="rounded-card border border-input focus-within:ring-2 focus-within:ring-ring">
        <div className="flex flex-wrap items-center gap-1 border-b border-input p-1">
          {toolbarButtons.map(({ label: btnLabel, icon: Icon, isActive, onClick }) => (
            <button
              key={btnLabel}
              type="button"
              aria-label={btnLabel}
              aria-pressed={isActive()}
              onClick={onClick}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isActive() && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <EditorContent
          id={id}
          editor={editor}
          className="prose prose-sm max-w-none p-3 focus:outline-none [&_.ProseMirror]:outline-none"
        />
      </div>
    </div>
  );
}
