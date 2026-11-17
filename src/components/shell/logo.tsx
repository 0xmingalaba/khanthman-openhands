import { useTranslate } from "@/i18n/locale-provider";

/**
 * Original Khant Hman mark: a stylised "K" formed from an upward probability line
 * crossing a jade tile. No third-party assets are used.
 */
export function Logo({ className }: { className?: string }) {
  const t = useTranslate();
  return (
    <span className={className}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        role="img"
        aria-label={t("common.appName")}
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="var(--kh-primary)" />
        <path
          d="M9 23V9"
          stroke="var(--kh-primary-fg)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M9 16.5 15 12.5"
          stroke="var(--kh-primary-fg)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M9 16.5 16.5 23"
          stroke="var(--kh-primary-fg)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="12" r="2.6" fill="var(--kh-accent)" />
        <path
          d="M17 22.5 22.5 12"
          stroke="var(--kh-accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
