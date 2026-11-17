import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={cn("animate-pulse rounded-md bg-surface-3", className)}
    />
  );
}

type StatePanelProps = {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "neutral" | "danger" | "warning";
  className?: string;
};

export function StatePanel({
  icon,
  title,
  body,
  action,
  tone = "neutral",
  className,
}: StatePanelProps) {
  const toneRing =
    tone === "danger"
      ? "border-danger/40"
      : tone === "warning"
        ? "border-warning/40"
        : "border-border";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border bg-surface p-8 text-center",
        toneRing,
        className,
      )}
    >
      {icon ? <div aria-hidden className="text-fg-muted">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="max-w-md text-sm leading-6 text-fg-muted">{body}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
