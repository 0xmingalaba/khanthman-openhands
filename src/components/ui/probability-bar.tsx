import { cn } from "@/lib/cn";

/** Two-segment YES/NO probability bar. Values are 0..100 and must sum to 100. */
export function ProbabilityBar({
  yes,
  no,
  className,
}: {
  yes: number;
  no: number;
  className?: string;
}) {
  const clampedYes = Math.max(0, yes);
  const clampedNo = Math.max(0, no);
  const total = clampedYes + clampedNo || 1;
  const yesPct = (clampedYes / total) * 100;

  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-pill bg-surface-3", className)}
      role="img"
      aria-hidden
    >
      <div className="h-full bg-primary" style={{ width: `${yesPct}%` }} />
      <div className="h-full bg-danger/70" style={{ width: `${100 - yesPct}%` }} />
    </div>
  );
}
