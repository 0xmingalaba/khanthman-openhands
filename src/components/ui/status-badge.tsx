import { cn } from "@/lib/cn";

export type StatusBadgeTone = "open" | "closing" | "closed" | "resolved";

const toneClasses: Record<StatusBadgeTone, string> = {
  open: "bg-success-soft text-success",
  closing: "bg-warning-soft text-warning",
  closed: "bg-surface-3 text-fg-muted",
  resolved: "bg-info-soft text-info",
};

export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusBadgeTone;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
