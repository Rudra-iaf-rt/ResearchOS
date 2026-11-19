import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  inverted?: boolean;
}

export function LogoMark({ className, inverted = false }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect
        width="32"
        height="32"
        rx="9"
        className={inverted ? "fill-white/12" : "fill-navy-900"}
      />
      <path
        d="M10 23V9h7.2c2.9 0 4.8 1.7 4.8 4.3 0 1.8-.9 3.1-2.4 3.8L23 23h-3.6l-2.8-5.2h-3.2V23H10Zm3.4-7.7h3.5c1.3 0 2.1-.7 2.1-1.9 0-1.1-.8-1.8-2.1-1.8h-3.5v3.7Z"
        className={inverted ? "fill-white" : "fill-white"}
      />
      <circle cx="23.5" cy="9.5" r="2.2" className="fill-teal-500" />
    </svg>
  );
}

export function Logo({
  inverted = false,
  compact = false,
  className,
}: {
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark inverted={inverted} />
      {!compact && (
        <span
          className={cn(
            "text-[15.5px] font-semibold tracking-[-0.02em]",
            inverted ? "text-white" : "text-navy-900 dark:text-white",
          )}
        >
          Research<span className="text-teal-500">OS</span>
        </span>
      )}
    </div>
  );
}
