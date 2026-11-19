import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Code2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { escapeHtml } from "@/lib/format";
import type { Paper } from "@/types";

function ToolButton({
  editor,
  label,
  isActive,
  disabled,
  onClick,
  children,
}: {
  editor: Editor;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-35",
        isActive
          ? "bg-navy-900 text-white dark:bg-teal-500/20 dark:text-teal-200"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      data-editor={editor.isEditable ? "editable" : "readonly"}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" />;
}

export function EditorToolbar({ editor, papers }: { editor: Editor; papers: Paper[] }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [url, setUrl] = useState("");

  const applyLink = () => {
    const value = url.trim();
    if (!value) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^https?:\/\//.test(value) ? value : `https://${value}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
    setUrl("");
  };

  const insertImage = () => {
    const value = url.trim();
    if (value) {
      editor
        .chain()
        .focus()
        .setImage({ src: /^https?:\/\//.test(value) ? value : `https://${value}` })
        .run();
    }
    setImageOpen(false);
    setUrl("");
  };

  const insertReference = (paper: Paper) => {
    const authors =
      paper.authors.length > 2
        ? `${paper.authors[0]} et al.`
        : paper.authors.join(" & ");
    const doi = paper.doi
      ? ` <a href="https://doi.org/${escapeHtml(paper.doi)}">doi:${escapeHtml(paper.doi)}</a>`
      : "";
    editor
      .chain()
      .focus()
      .insertContent(
        `<blockquote><p><strong>${escapeHtml(authors)} (${paper.year}).</strong> ${escapeHtml(
          paper.title,
        )}. <em>${escapeHtml(paper.journal)}</em>.${doi}</p></blockquote><p></p>`,
      )
      .run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 sm:flex-nowrap sm:overflow-x-auto"
      role="toolbar"
      aria-label="Notebook formatting"
    >
      <ToolButton
        editor={editor}
        label="Undo"
        disabled={!editor.can().chain().focus().undo().run()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Redo"
        disabled={!editor.can().chain().focus().redo().run()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        editor={editor}
        label="Heading 1"
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Heading 2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Heading 3"
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolButton>
      <Divider />
      <ToolButton
        editor={editor}
        label="Bold"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Italic"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Strikethrough"
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Inline code"
        isActive={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        editor={editor}
        label="Bullet list"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Numbered list"
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Task list"
        isActive={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListChecks className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Blockquote"
        isActive={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolButton>
      <ToolButton
        editor={editor}
        label="Code block"
        isActive={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="size-3.5" />
      </ToolButton>
      <Divider />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Table"
            aria-label="Table options"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              editor.isActive("table") && "bg-muted text-foreground",
            )}
          >
            <Table2 className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Table</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            Insert 3 × 3 table
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!editor.isActive("table")}
            onSelect={() => editor.chain().focus().addRowAfter().run()}
          >
            Add row below
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!editor.isActive("table")}
            onSelect={() => editor.chain().focus().addColumnAfter().run()}
          >
            Add column right
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!editor.isActive("table")}
            onSelect={() => editor.chain().focus().deleteRow().run()}
          >
            Delete row
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!editor.isActive("table")}
            onSelect={() => editor.chain().focus().deleteColumn().run()}
          >
            Delete column
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!editor.isActive("table")}
            destructive
            onSelect={() => editor.chain().focus().deleteTable().run()}
          >
            Delete table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={linkOpen} onOpenChange={(open) => {
        setLinkOpen(open);
        if (open) setUrl(editor.getAttributes("link").href ?? "");
      }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Add link"
            aria-label="Add link"
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              editor.isActive("link") && "bg-muted text-foreground",
            )}
          >
            <Link2 className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <p className="mb-2 text-[11.5px] font-semibold">Link</p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="h-8 text-[12px]"
              onKeyDown={(event) => event.key === "Enter" && applyLink()}
              autoFocus
            />
            <Button size="sm" className="h-8" onClick={applyLink}>
              Apply
            </Button>
          </div>
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            Leave empty to remove the link.
          </p>
        </PopoverContent>
      </Popover>

      <Popover open={imageOpen} onOpenChange={(open) => {
        setImageOpen(open);
        if (!open) setUrl("");
      }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Insert image"
            aria-label="Insert image"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ImagePlus className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <p className="mb-2 text-[11.5px] font-semibold">Image from URL</p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://…"
              className="h-8 text-[12px]"
              onKeyDown={(event) => event.key === "Enter" && insertImage()}
              autoFocus
            />
            <Button size="sm" className="h-8" onClick={insertImage}>
              Insert
            </Button>
          </div>
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            Tip: link figures from your Files workspace.
          </p>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Insert research reference"
            aria-label="Insert research reference"
            className="flex h-7 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cite
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Reference from this project</DropdownMenuLabel>
          {papers.length === 0 ? (
            <p className="px-2.5 py-3 text-[11.5px] text-muted-foreground">
              Add papers to the library and link them to this project to cite them here.
            </p>
          ) : (
            papers.map((paper) => (
              <DropdownMenuItem
                key={paper.id}
                onSelect={() => insertReference(paper)}
                className="items-start"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-medium leading-snug">
                    {paper.authors[0]}
                    {paper.authors.length > 1 ? " et al." : ""} ({paper.year})
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                    {paper.title}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolButton
        editor={editor}
        label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-3.5" />
      </ToolButton>
    </div>
  );
}
