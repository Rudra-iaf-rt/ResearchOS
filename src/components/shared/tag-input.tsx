import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type a tag and press Enter",
  id,
  maxTags = 8,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim().replace(/,$/, "");
    if (!tag) return;
    if (value.length >= maxTags) return;
    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    }
    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 shadow-subtle transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-ring/30",
        className,
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 rounded-md py-0.5">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : "Add tag…"}
        disabled={value.length >= maxTags}
        className="h-6 min-w-[100px] flex-1 bg-transparent px-1 text-[12.5px] outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
      />
    </div>
  );
}
