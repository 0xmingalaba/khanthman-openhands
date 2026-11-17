"use client";

import { useTranslate } from "@/i18n/locale-provider";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChip } from "@/components/ui/category-chip";
import { EmptyState } from "@/components/states/async-states";

const categoryKeys = [
  "categories.politics",
  "categories.economy",
  "categories.technology",
  "categories.sports",
  "categories.climate",
  "categories.culture",
] as const;

export function HomeContent() {
  const t = useTranslate();
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="kh-my text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-fg-muted">{t("home.subtitle")}</p>
      </section>

      <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
        <h2 id="featured-heading" className="kh-my text-xl font-semibold text-fg">
          {t("home.featuredTitle")}
        </h2>
        <EmptyState title={t("home.featuredEmpty")} body={t("home.featuredEmptyBody")} />
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-col gap-4">
        <h2 id="categories-heading" className="kh-my text-xl font-semibold text-fg">
          {t("home.categoriesTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {categoryKeys.map((key) => (
            <CategoryChip key={key} label={t(key)} disabled />
          ))}
        </div>
      </section>

      <section aria-labelledby="foundation-heading" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="kh-my" id="foundation-heading">
              {t("common.tagline")}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm leading-6 text-fg-muted">{t("common.simulatedNotice")}</p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
