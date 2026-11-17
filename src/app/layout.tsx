import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Noto_Sans_Myanmar, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/i18n/locale-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppShell } from "@/components/shell/app-shell";
import { resolveLocale, localeMeta } from "@/i18n/config";
import { LOCALE_COOKIE, THEME_COOKIE, resolveTheme } from "@/lib/preferences";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const myanmar = Noto_Sans_Myanmar({
  variable: "--font-myanmar-sans",
  subsets: ["myanmar"],
  display: "swap",
});
const mono = Geist_Mono({ variable: "--font-mono-code", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Khant Hman Prediction Market",
    template: "%s · Khant Hman Prediction Market",
  },
  description:
    "Polymarket-inspired prediction market for Myanmar. Virtual credits only — no real money.",
  applicationName: "Khant Hman Prediction Market",
};

/**
 * The shell is personalized per request: theme and locale come from cookies and translations
 * are rendered on the server, so `lang`/`dir`/`data-theme` must be set before the first paint.
 * That makes this layout a blocking route rather than a prerenderable one.
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  const theme = resolveTheme(store.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      dir={localeMeta[locale].dir}
      data-theme={theme}
      className={`${inter.variable} ${myanmar.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <LocaleProvider locale={locale}>
          <ThemeProvider initialTheme={theme}>
            <AppShell locale={locale}>{children}</AppShell>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
