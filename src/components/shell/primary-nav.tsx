"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslate } from "@/i18n/locale-provider";
import { primaryNav } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export function PrimaryNav({ variant }: { variant: "desktop" | "mobile" }) {
  const t = useTranslate();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Track the pathname the menu was opened on. If the route changes, close the menu during
  // render instead of in an effect (avoids a cascading render).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  if (variant === "desktop") {
    return (
      <nav aria-label={t("nav.primaryLabel")} className="hidden items-center gap-1 md:flex">
        {primaryNav.map((item) => (
          <NavLink key={item.key} label={t(item.key)} href={item.href} enabled={item.enabled} active={pathname === item.href} />
        ))}
      </nav>
    );
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface text-fg hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label={t("nav.primaryLabel")}
          className="absolute left-0 right-0 top-full z-40 border-b border-border bg-surface p-3 shadow-e3"
        >
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <li key={item.key}>
                <NavLink label={t(item.key)} href={item.href} enabled={item.enabled} active={pathname === item.href} block />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

function NavLink({
  label,
  href,
  enabled,
  active,
  block,
}: {
  label: string;
  href: string;
  enabled: boolean;
  active: boolean;
  block?: boolean;
}) {
  const t = useTranslate();
  const base = cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    block ? "block" : "inline-block",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  );

  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        title={t("common.comingSoon")}
        className={cn(base, "cursor-not-allowed text-fg-subtle")}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active ? "bg-primary-soft text-primary" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {label}
    </Link>
  );
}
