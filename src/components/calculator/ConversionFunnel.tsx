import { Card } from "@/components/ui/card";
import type { Currency } from "@/data/coldEmailBenchmarks";
import type { RoiResult } from "@/lib/coldEmailRoi";
import { formatCount, formatInteger, formatMoney, formatPercent } from "@/lib/format";

const BAR_STYLE = {
  background: "linear-gradient(135deg, rgb(255,201,71) 0%, rgb(255,182,39) 50%, rgb(255,165,0) 100%)",
  boxShadow:
    "rgba(255,201,71,0.3) 0px 4px 6px -1px, rgba(255,255,255,0.4) 2px 2px 8px inset, rgba(0,0,0,0.1) -2px -2px 8px inset",
};

/** Bar width on a log scale so later stages stay visible. Floor keeps the label readable. */
function barWidth(value: number, top: number) {
  const MIN = 24;
  if (top <= 0 || value <= 0) return MIN;
  return MIN + (100 - MIN) * (Math.log1p(value) / Math.log1p(top));
}

export function ConversionFunnel({ result, currency }: { result: RoiResult; currency: Currency }) {
  const loc = currency.locale;
  const stages = [
    { label: "Prospects reached", value: result.prospects },
    { label: "Delivered", value: result.delivered },
    { label: "Replies", value: result.replies },
    { label: "Positive replies", value: result.positive },
    { label: "Meetings booked", value: result.booked },
    { label: "Meetings held", value: result.held },
    { label: "Deals closed", value: result.deals },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-1 text-center text-2xl font-black text-foreground">Conversion Funnel</h3>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-muted-foreground">
        {formatInteger(result.sent, loc)} emails to {formatInteger(result.prospects, loc)} prospects. Bars show share of prospects reached.
        Brackets show conversion from the step above.
      </p>
      <ol className="mx-auto w-full max-w-2xl space-y-2">
        {stages.map((s, i) => {
          const prev = i === 0 ? null : stages[i - 1].value;
          const step = prev && prev > 0 ? (s.value / prev) * 100 : null;
          const ofSent = result.prospects > 0 ? (s.value / result.prospects) * 100 : 0;
          return (
            <li key={s.label}>
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground">{s.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-base font-bold text-accent">{formatCount(s.value, loc)}</span>
                  {step !== null && <span className="text-xs text-muted-foreground">({formatPercent(step, loc)})</span>}
                </span>
              </div>
              <div className="flex justify-center">
                <div
                  data-pdf-flat
                  className="relative flex h-12 items-center justify-center rounded-2xl transition-all duration-500 ease-out sm:h-14"
                  style={{ ...BAR_STYLE, width: `${barWidth(s.value, result.prospects)}%` }}
                >
                  <span className="text-sm font-bold text-gray-900">{formatPercent(ofSent, loc)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <dl className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 border-t border-border pt-5">
        <div className="rounded-lg bg-secondary/40 p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenue</dt>
          <dd className="text-2xl font-black" style={{ color: "#B8860B" }}>
            {formatMoney(result.revenue, currency)}
          </dd>
        </div>
        <div className="rounded-lg bg-secondary/40 p-3 text-center">
          <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI</dt>
          <dd className="text-2xl font-black" style={{ color: "#3B82F6" }}>
            {result.roiPercent === null ? "N/A" : formatPercent(result.roiPercent, loc)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
