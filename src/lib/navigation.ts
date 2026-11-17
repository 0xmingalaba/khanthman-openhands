/**
 * Product-area navigation for the approved M1 shell.
 * Routes marked `enabled: false` are placeholders for later milestones (M3/M5);
 * they render as disabled with a "coming soon" affordance and are not real pages yet.
 */
export type NavItem = {
  key: string;
  href: string;
  enabled: boolean;
};

export const primaryNav: readonly NavItem[] = [
  { key: "nav.home", href: "/", enabled: true },
  { key: "nav.markets", href: "/markets", enabled: false },
  { key: "nav.categories", href: "/categories", enabled: false },
  { key: "nav.portfolio", href: "/portfolio", enabled: false },
  { key: "nav.activity", href: "/activity", enabled: false },
  { key: "nav.about", href: "/about", enabled: false },
] as const;
