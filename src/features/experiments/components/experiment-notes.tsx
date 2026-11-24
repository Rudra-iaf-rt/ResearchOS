import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Check,
  Code,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { experimentsApi } from "../api";

function ToolButton({
  editor,
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  editor: Editor;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-7"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      data-editor={editor.isEditable ? "editable" : "readonly"}
    >
      {children}
    </Button>
  );
}

export function ExperimentNotes({
  experimentId,
  notes,
}: {
  experimentId: string;
  notes: string;
}) {
  const queryClient = useQueryClient();
  const timer = useRef<number | null>(null);
  const lastSaved = useRef(notes);
  const [status, setStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");

  const mutation = useMutation({
    mutationFn: (html: string) => experimentsApi.saveNotes(experimentId, html),
    onSuccess: (result) => {
      lastSaved.current = result.notes;
      setStatus("saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.experiment(experimentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    },
    onError: () => setStatus("error"),
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder: "Record observations, deviations from protocol, and next steps…",
      }),
    ],
    content: notes || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] px-3 py-3 text-[13.5px] leading-relaxed outline-none [&_h2]:mb-1.5 [&_h2]:mt-4 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-[14px] [&_h3]:font-semibold [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-teal-500/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_pre]:rounded-md [&_pre]:bg-navy-950 [&_pre]:p-2 [&_pre]:text-slate-100",
      },
    },
    onUpdate: ({ editor: instance }) => {
      setStatus("dirty");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const html = instance.getHTML();
        if (html === lastSaved.current) {
          setStatus("saved");
          return;
        }
        setStatus("saving");
        mutation.mutate(html);
      }, 900);
    },
  });

  // A restore from history updates the experiment; reflect it in the editor.
  useEffect(() => {
    if (!editor) return;
    if (notes === lastSaved.current) return;
    lastSaved.current = notes;
    editor.commands.setContent(notes || "<p></p>", false);
    setStatus("saved");
  }, [notes, editor]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  if (!editor) {
    return <div className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const chain = () => editor.chain().focus();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
        <ToolButton editor={editor} label="Bold" active={editor.isActive("bold")} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Italic" active={editor.isActive("italic")} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Strikethrough" active={editor.isActive("strike")} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Inline code" active={editor.isActive("code")} onClick={() => chain().toggleCode().run()}>
          <Code className="size-3.5" />
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolButton editor={editor} label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Bullet list" active={editor.isActive("bulletList")} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Numbered list" active={editor.isActive("orderedList")} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Blockquote" active={editor.isActive("blockquote")} onClick={() => chain().toggleBlockquote().run()}>
          <Quote className="size-3.5" />
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolButton editor={editor} label="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
          <Undo2 className="size-3.5" />
        </ToolButton>
        <ToolButton editor={editor} label="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
          <Redo2 className="size-3.5" />
        </ToolButton>

        <span className="ml-auto flex items-center gap-1 px-2 text-[11px] text-muted-foreground" role="status">
          {status === "saving" && (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Saving…
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Saved
            </>
          )}
          {status === "dirty" && "Unsaved changes"}
          {status === "error" && (
            <span className="text-destructive">Could not save. Keep this tab open and retry.</span>
          )}
        </span>
      </div>
      <EditorContent editor={editor} className={cn("max-w-none")} />
    </div>
  );
}
