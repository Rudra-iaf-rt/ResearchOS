import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uid } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ParameterEntry } from "@/types";

interface ParameterEditorProps {
  value: ParameterEntry[];
  onChange: (next: ParameterEntry[]) => void;
  error?: string;
  idPrefix?: string;
  className?: string;
}

/**
 * Shared key/value editor for experiment parameters. The same component powers
 * the create/edit modal and the experiment detail Parameters tab, so the two
 * surfaces cannot drift apart.
 */
export function ParameterEditor({
  value,
  onChange,
  error,
  idPrefix = "parameter",
  className,
}: ParameterEditorProps) {
  const update = (id: string, patch: Partial<ParameterEntry>) => {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const remove = (id: string) => {
    onChange(value.filter((entry) => entry.id !== id));
  };

  const add = () => {
    onChange([...value, { id: uid("param"), key: "", value: "" }]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-[12px] text-muted-foreground">
          No parameters yet. Add the inputs this experiment depends on.
        </p>
      )}

      {value.map((entry, index) => (
        <div key={entry.id} className="flex items-start gap-2">
          <GripVertical
            className="mt-2.5 size-3.5 shrink-0 text-muted-foreground/60"
            aria-hidden="true"
          />
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-key-${entry.id}`} className="sr-only">
                Parameter {index + 1} name
              </Label>
              <Input
                id={`${idPrefix}-key-${entry.id}`}
                value={entry.key}
                placeholder="Parameter name"
                onChange={(event) => update(entry.id, { key: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-value-${entry.id}`} className="sr-only">
                Parameter {index + 1} value
              </Label>
              <Input
                id={`${idPrefix}-value-${entry.id}`}
                value={entry.value}
                placeholder="Value"
                onChange={(event) => update(entry.id, { value: event.target.value })}
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 text-muted-foreground hover:text-destructive"
            aria-label={`Remove parameter ${index + 1}`}
            onClick={() => remove(entry.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      {error && (
        <p role="alert" className="text-[12px] font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-3.5" />
        Add parameter
      </Button>
    </div>
  );
}
