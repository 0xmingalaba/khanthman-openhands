import { useTranslate } from "@/i18n/locale-provider";

export function DisclosureBanner() {
  const t = useTranslate();
  return (
    <div className="border-b border-accent/30 bg-accent-soft text-accent-fg">
      <div className="kh-container flex items-center gap-2 py-2 text-xs">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p>{t("disclosure.banner")}</p>
      </div>
    </div>
  );
}
