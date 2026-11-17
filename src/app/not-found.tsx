import Link from "next/link";
import { cookies } from "next/headers";
import { resolveLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/lib/preferences";
import { createTranslator } from "@/i18n/translate";
import { StatePanel } from "@/components/states/state-panel";

export default async function NotFound() {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  const t = createTranslator(locale);
  return (
    <StatePanel
      title={t("states.notFoundTitle")}
      body={t("states.notFoundBody")}
      action={
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("states.backHome")}
        </Link>
      }
    />
  );
}
