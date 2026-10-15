import { Card } from "@/components/ui/card";
import type { Currency } from "@/data/coldEmailBenchmarks";
import type { RoiResult } from "@/lib/coldEmailRoi";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InfoTip } from "./InfoTip";

// Card colors copied from the live LinkedIn calculator.
const GOLD = { border: "#F5B731", text: "#B8860B", tint: "rgba(245,183,49,0.08)" };
const BLUE = { border: "#3B82F6", text: "#3B82F6", tint: "rgba(59,130,246,0.08)" };
const TEAL = { border: "#14B8A6", text: "#0F9488", tint: "rgba(20,184,166,0.08)" };

function accentStyle(c: { border: string; tint: string }) {
  return {
    borderTopColor: c.border,
    borderTopWidth: 3,
    background: `linear-gradient(135deg, ${c.tint} 0%, transparent 60%), hsl(var(--card))`,
  };
}

interface Props {
  result: RoiResult;
  currency: Currency;
  hasDealValue: boolean;
  hasInvestment: boolean;
  durationMonths: number;
}

export function HighlightCards({ result, currency, hasDealValue, hasInvestment, durationMonths }: Props) {
  const roi = result.roiPercent;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <Card className="p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5" style={accentStyle(GOLD)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue Generated</p>
            <InfoTip label="Total revenue">
              Deals closed inside the duration x effective LTV, over {durationMonths} months.
            </InfoTip>
          </div>
          <p className="text-3xl font-black break-words" style={{ color: GOLD.text }}>
            {formatMoney(result.revenue, currency)}
          </p>
          {!hasDealValue && <p className="mt-1 text-xs text-muted-foreground">Add your average deal value to see revenue.</p>}
        </Card>
        <Card className="p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5" style={accentStyle(BLUE)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Return on Investment</p>
            <InfoTip label="Return on investment">(Revenue minus total investment) / total investment. Shows N/A until you add a monthly investment.</InfoTip>
          </div>
          <p className="text-3xl font-black" style={{ color: BLUE.text }}>
            {roi === null ? "N/A" : formatPercent(roi, currency.locale)}
          </p>
          {!hasInvestment && <p className="mt-1 text-xs text-muted-foreground">Add your monthly investment to see ROI.</p>}
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Customer LTV</p>
              <InfoTip label="Full customer LTV">Deal value x invoices per year x retention months / 12.</InfoTip>
            </div>
            <p className="text-xl font-bold text-foreground">{formatMoney(result.fullLTV, currency)}</p>
          </div>
        </Card>
        <Card className={cn("p-4")} style={{ background: `linear-gradient(135deg, ${TEAL.tint} 0%, transparent 70%), hsl(var(--card))` }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Effective LTV ({durationMonths} mo)</p>
              <InfoTip label="Effective LTV">Customer value that lands inside the chosen duration: the shorter of duration and retention.</InfoTip>
            </div>
            <p className="text-xl font-bold" style={{ color: TEAL.text }}>
              {formatMoney(result.effectiveLTV, currency)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
