import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ProbabilityBar } from "@/components/ui/probability-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CategoryChip } from "@/components/ui/category-chip";
import { MarketCard } from "@/components/ui/market-card";
import { StatePanel } from "@/components/states/state-panel";

function wrap(ui: React.ReactElement) {
  return render(<LocaleProvider locale="en">{ui}</LocaleProvider>);
}

describe("Button", () => {
  it("renders its label and defaults to type=button", () => {
    wrap(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
  });

  it("respects an explicit type", () => {
    wrap(<Button type="submit">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "submit");
  });

  it("can be disabled", () => {
    wrap(<Button disabled>Nope</Button>);
    expect(screen.getByRole("button", { name: "Nope" })).toBeDisabled();
  });
});

describe("Badge", () => {
  it("renders text content", () => {
    wrap(<Badge tone="success">Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("exposes its label", () => {
    wrap(<StatusBadge tone="open" label="Open" />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("renders a title", () => {
    wrap(
      <Card>
        <CardTitle>Heading</CardTitle>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
  });
});

describe("ProbabilityBar", () => {
  it("is decorative and does not throw on odd input", () => {
    const { container } = wrap(<ProbabilityBar yes={0} no={0} />);
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });
});

describe("CategoryChip", () => {
  it("renders as disabled when asked", () => {
    wrap(<CategoryChip label="Politics" disabled />);
    const chip = screen.getByText("Politics");
    expect(chip).toHaveAttribute("aria-disabled", "true");
  });
});

describe("MarketCard", () => {
  it("renders supplied market fields and the simulated label", () => {
    wrap(
      <MarketCard
        market={{
          slug: "example",
          question: "Will it rain tomorrow?",
          categoryLabel: "Climate",
          status: { tone: "open", label: "Open" },
          yes: 62,
          no: 38,
          yesLabel: "YES",
          noLabel: "NO",
          probabilityLabel: "Probability",
          closesLabel: "Closes soon",
          simulated: true,
          simulatedLabel: "SIMULATED",
        }}
      />,
    );
    expect(screen.getByText("Will it rain tomorrow?")).toBeInTheDocument();
    expect(screen.getByText("SIMULATED")).toBeInTheDocument();
  });
});

describe("StatePanel", () => {
  it("renders a title and body", () => {
    wrap(<StatePanel title="Empty" body="Nothing here" />);
    expect(screen.getByRole("heading", { name: "Empty" })).toBeInTheDocument();
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
