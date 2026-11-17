import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { ProbabilityBar } from "@/components/ui/probability-bar";

export type MarketCardData = {
  slug: string;
  question: string;
  categoryLabel: string;
  status: { tone: StatusBadgeTone; label: string };
  yes: number;
  no: number;
  yesLabel: string;
  noLabel: string;
  probabilityLabel: string;
  closesLabel: string;
  /** Whether this card shows simulated placeholder data (must be visible to users). */
  simulated?: boolean;
  simulatedLabel?: string;
};

/**
 * Presentational market card for the design system. It renders only the data it is
 * given; M1 does not supply any, so no fabricated market figures appear in the app.
 */
export function MarketCard({ market }: { market: MarketCardData }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-e3">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
            {market.categoryLabel}
          </span>
          <CardTitle className="text-balance">{market.question}</CardTitle>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge tone={market.status.tone} label={market.status.label} />
          {market.simulated && market.simulatedLabel ? (
            <span className="rounded-xs bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              {market.simulatedLabel}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-fg-muted">{market.probabilityLabel}</span>
          <span className="text-lg font-semibold tabular-nums text-fg">{market.yes}%</span>
        </div>
        <ProbabilityBar yes={market.yes} no={market.no} />
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
            {market.yesLabel} {market.yes}%
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-danger/70" />
            {market.noLabel} {market.no}%
          </span>
        </div>
      </CardBody>
      <CardFooter className="text-xs text-fg-subtle">
        <span>{market.closesLabel}</span>
      </CardFooter>
    </Card>
  );
}
