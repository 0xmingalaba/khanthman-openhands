import { cn } from "@/lib/cn";

export type CategoryChipProps = {
  label: string;
  href?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Category chip. Rendered as a non-interactive element while the category routes
 * do not exist yet (M3), so it is never a dead link.
 */
export function CategoryChip({ label, href, disabled, className }: CategoryChipProps) {
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 text-sm font-medium text-fg-muted",
    !disabled && href ? "transition-colors hover:bg-surface-2 hover:text-fg" : "",
    disabled ? "cursor-not-allowed opacity-60" : "",
    className,
  );

  if (!disabled && href) {
    return (
      <a href={href} className={cn(classes, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus")}>
        {label}
      </a>
    );
  }

  return (
    <span aria-disabled={disabled ? "true" : undefined} className={classes}>
      {label}
    </span>
  );
}
