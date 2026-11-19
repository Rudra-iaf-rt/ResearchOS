import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Person } from "@/types";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  person,
  className,
}: {
  person: Pick<Person, "name" | "initials" | "color">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7 border-2 border-card", className)}>
      <AvatarFallback
        style={{ backgroundColor: person.color }}
        className="text-[9.5px] font-semibold text-white"
      >
        {person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarGroup({
  people,
  max = 4,
  size = "sm",
}: {
  people: Person[];
  max?: number;
  size?: "sm" | "md";
}) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {visible.map((person) => (
          <PersonAvatar
            key={person.id}
            person={person}
            className={size === "md" ? "size-8" : "size-6 sm:size-7"}
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
