import type { Locale } from "@/i18n/config";

/**
 * English dictionary is the source of truth for the translation key shape.
 * Every other locale must mirror this structure exactly (enforced by a test).
 */
const en = {
  common: {
    appName: "Khant Hman Prediction Market",
    tagline: "Forecast outcomes on virtual YES/NO shares",
    skipToContent: "Skip to main content",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    loading: "Loading…",
    retry: "Try again",
    dismiss: "Dismiss",
    comingSoon: "Coming soon",
    simulatedNotice: "Development fixtures are simulated — not real data.",
  },
  nav: {
    primaryLabel: "Primary",
    home: "Home",
    markets: "Markets",
    categories: "Categories",
    portfolio: "Portfolio",
    activity: "Activity",
    about: "About",
  },
  disclosure: {
    banner: "Virtual credits only. No real money, deposits, withdrawals, or cash payouts.",
    learnMore: "Read the disclosure",
  },
  home: {
    title: "Discover markets",
    subtitle:
      "Browse markets by category and forecast the outcome. Trading opens in a later milestone.",
    featuredTitle: "Featured markets",
    featuredEmpty: "No markets yet",
    featuredEmptyBody:
      "Market data is not connected in this foundation milestone. Cards here are simulated placeholders.",
    categoriesTitle: "Categories",
  },
  categories: {
    politics: "Politics",
    economy: "Economy",
    technology: "Technology",
    sports: "Sports",
    climate: "Climate",
    culture: "Culture",
  },
  status: {
    open: "Open",
    closingSoon: "Closing soon",
    closed: "Closed",
    resolved: "Resolved",
  },
  market: {
    yes: "YES",
    no: "NO",
    probability: "Probability",
    volume: "Volume",
    closes: "Closes",
    simulated: "SIMULATED",
  },
  controls: {
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    switchTo: "Switch to {language}",
  },
  states: {
    loadingTitle: "Loading",
    loadingBody: "Fetching the latest view…",
    emptyTitle: "Nothing here yet",
    emptyBody: "When content is available it will appear here.",
    errorTitle: "Something went wrong",
    errorBody: "We could not load this view. You can retry.",
    unavailableTitle: "Temporarily unavailable",
    unavailableBody: "This section is not available right now. Please try again later.",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist or has moved.",
    backHome: "Back to home",
  },
  footer: {
    disclaimer:
      "Khant Hman Prediction Market trades virtual credits only. There is no real money, no payment processing, and no monetary value.",
    rights: "Planning foundation. Milestone 0 delivered; Milestone 1 in progress.",
  },
} as const;

export type Dictionary = Widen<typeof en>;

/** Preserve the key structure of the English dictionary while widening values to `string`. */
type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

const my: Dictionary = {
  common: {
    appName: "ခန့်မှန်း ဈေးကွက်",
    tagline: "ဖြစ်နိုင်ခြေရှိသော ရလဒ်များကို ကိုယ်ပိုင် YES/NO အစုများဖြင့် ခန့်မှန်းပါ",
    skipToContent: "အဓိကအကြောင်းအရာသို့ ကျော်သွားရန်",
    openMenu: "လမ်းညွှန်မီနူး ဖွင့်ရန်",
    closeMenu: "လမ်းညွှန်မီနူး ပိတ်ရန်",
    loading: "ဖွင့်နေသည်…",
    retry: "ထပ်ကြိုးစားရန်",
    dismiss: "ပိတ်ရန်",
    comingSoon: "မကြာမီ ရရှိမည်",
    simulatedNotice: "ဖွံ့ဖြိုးရေး ဒေတာများသည် ပုံစံတူ (SIMULATED) ဖြစ်သည် — တကယ့်ဒေတာ မဟုတ်ပါ။",
  },
  nav: {
    primaryLabel: "အဓိက",
    home: "ပင်မ",
    markets: "ဈေးကွက်များ",
    categories: "အမျိုးအစားများ",
    portfolio: "အစုစု",
    activity: "လှုပ်ရှားမှု",
    about: "အကြောင်း",
  },
  disclosure: {
    banner: "ကိုယ်ပိုင်ခရက်ဒစ်များသာ။ တကယ့်ငွေ၊ အပ်ငွေ၊ ထုတ်ယူမှု သို့မဟုတ် ငွေသားပေးချေမှု မရှိပါ။",
    learnMore: "ထုတ်ဖော်ချက်ကို ဖတ်ရန်",
  },
  home: {
    title: "ဈေးကွက်များကို ရှာဖွေပါ",
    subtitle: "အမျိုးအစားအလိုက် ဈေးကွက်များကို ကြည့်ရှုပြီး ရလဒ်ကို ခန့်မှန်းပါ။ အရောင်းအဝယ်သည် နောက်မှတ်တိုင်တွင် ဖွင့်မည်။",
    featuredTitle: "ထူးခြားသော ဈေးကွက်များ",
    featuredEmpty: "ဈေးကွက် မရှိသေးပါ",
    featuredEmptyBody: "ဤအခြေခံမှတ်တိုင်တွင် ဈေးကွက်ဒေတာ မချိတ်ဆက်ရသေးပါ။ ဤကတ်များသည် ပုံစံတူ (SIMULATED) ဖြစ်သည်။",
    categoriesTitle: "အမျိုးအစားများ",
  },
  categories: {
    politics: "နိုင်ငံရေး",
    economy: "စီးပွားရေး",
    technology: "နည်းပညာ",
    sports: "အားကစား",
    climate: "ရာသီဥတု",
    culture: "ယဉ်ကျေးမှု",
  },
  status: {
    open: "ဖွင့်ထားသည်",
    closingSoon: "မကြာမီ ပိတ်မည်",
    closed: "ပိတ်ထားသည်",
    resolved: "ဖြေရှင်းပြီး",
  },
  market: {
    yes: "YES",
    no: "NO",
    probability: "ဖြစ်နိုင်ခြေ",
    volume: "ပမာဏ",
    closes: "ပိတ်မည့်အချိန်",
    simulated: "SIMULATED",
  },
  controls: {
    language: "ဘာသာစကား",
    theme: "အပြင်အဆင်",
    themeLight: "အလင်း",
    themeDark: "အမှောင်",
    themeSystem: "စနစ်အတိုင်း",
    switchTo: "{language} သို့ ပြောင်းရန်",
  },
  states: {
    loadingTitle: "ဖွင့်နေသည်",
    loadingBody: "နောက်ဆုံးအခြေအနေကို ရယူနေသည်…",
    emptyTitle: "ဤနေရာတွင် မရှိသေးပါ",
    emptyBody: "အကြောင်းအရာ ရရှိလာပါက ဤနေရာတွင် ပေါ်လာမည်။",
    errorTitle: "တစ်ခုခု မှားယွင်းသွားသည်",
    errorBody: "ဤအခြေအနေကို မဖွင့်နိုင်ပါ။ ထပ်ကြိုးစားနိုင်သည်။",
    unavailableTitle: "ယာယီ မရရှိနိုင်ပါ",
    unavailableBody: "ဤအပိုင်းသည် ယခုအချိန်တွင် မရရှိနိုင်ပါ။ နောက်မှ ထပ်ကြိုးစားပါ။",
    notFoundTitle: "စာမျက်နှာ မတွေ့ပါ",
    notFoundBody: "သင်ရှာနေသော စာမျက်နှာ မရှိပါ သို့မဟုတ် ရွှေ့ပြောင်းသွားပါသည်။",
    backHome: "ပင်မသို့ ပြန်ရန်",
  },
  footer: {
    disclaimer:
      "ခန့်မှန်း ဈေးကွက်သည် ကိုယ်ပိုင်ခရက်ဒစ်များသာ အရောင်းအဝယ်ပြုသည်။ တကယ့်ငွေ၊ ငွေပေးချေမှု သို့မဟုတ် ငွေကြေးတန်ဖိုး မရှိပါ။",
    rights: "စီစဉ်ရေး အခြေခံ။ မှတ်တိုင် ၀ ပေးအပ်ပြီး၊ မှတ်တိုင် ၁ လုပ်ဆောင်နေသည်။",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, my };
