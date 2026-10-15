import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HandUnderline, PillBadge } from "@/components/site/HandUnderline";
import { BENCHMARKS, DURATION_OPTIONS, FOOTNOTE, INDUSTRIES, RATE_ORDER } from "@/data/coldEmailBenchmarks";
import { exportResultsPdf } from "@/lib/exportPdf";
import { formatInteger, formatPercent, getCurrency } from "@/lib/format";
import { ConversionFunnel } from "./ConversionFunnel";
import { GrowthChart } from "./GrowthChart";
import { HighlightCards } from "./HighlightCards";
import { IndustryBenchmarks } from "./IndustryBenchmarks";
import { InputsPanel } from "./InputsPanel";
import { SendingCapacityCard } from "./SendingCapacityCard";
import { StatRow } from "./StatRow";
import { useColdEmailCalculator } from "./useColdEmailCalculator";

export function ColdEmailRoiCalculator({ logoSrc = "/logo.png" }: { logoSrc?: string }) {
  const api = useColdEmailCalculator();
  const { state, result, capacity } = api;
  const currency = getCurrency(state.currency);
  const hasDealValue = (state.dealValue ?? 0) > 0;
  const hasInvestment = (state.monthlyInvestment ?? 0) > 0;
  const resultsRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      const money = (v: number | null) => (v === null ? "not set" : `${currency.code} ${formatInteger(v, currency.locale)}`);
      const industry = INDUSTRIES.find((i) => i.key === state.industry)?.label;
      await exportResultsPdf(resultsRef.current, {
        title: "Cold Email ROI Report",
        subtitle: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        assumptions: [
          ...(industry ? [`Industry: ${industry}`] : []),
          `Monthly emails sent: ${formatInteger(state.monthlyEmails, currency.locale)}`,
          `Duration: ${DURATION_OPTIONS.find((d) => d.months === state.durationMonths)?.label ?? `${state.durationMonths} months`}`,
          ...RATE_ORDER.map((k) => `${BENCHMARKS[k].label}: ${formatPercent(state[k])}`),
          `Average deal value: ${money(state.dealValue)}`,
          `Invoices per year: ${state.invoicesPerYear}  |  Retention: ${state.retentionMonths} months`,
          `Monthly investment: ${money(state.monthlyInvestment)}`,
          `Warm-up: ${state.warmup ? "on" : "off"}  |  Sales cycle lag: ${state.salesCycleLagMonths} months`,
        ],
        footnote: FOOTNOTE,
        fileName: "myntmore-cold-email-roi.pdf",
        logoSrc,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <div className="mb-4">
            <PillBadge>ROI Calculator</PillBadge>
          </div>
          <h2 className="mb-3 text-4xl font-black leading-tight text-foreground sm:text-5xl">
            <HandUnderline>ROI Calculator</HandUnderline>
          </h2>
          <p className="text-lg text-muted-foreground">Calculate your cold email ROI in real time</p>
        </div>
        <Button variant="accent" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
          {exporting ? "Exporting..." : "Export Results"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <InputsPanel api={api} />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-8">
          <div ref={resultsRef} className="space-y-6" aria-live="off">
            <HighlightCards result={result} currency={currency} hasDealValue={hasDealValue} hasInvestment={hasInvestment} durationMonths={state.durationMonths} />
            <StatRow result={result} currency={currency} hasInvestment={hasInvestment} />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ConversionFunnel result={result} currency={currency} />
              <GrowthChart result={result} currency={currency} hasInvestment={hasInvestment} />
            </div>
            <SendingCapacityCard monthlyEmails={state.monthlyEmails} mailboxes={capacity.mailboxes} domains={capacity.domains} locale={currency.locale} />
          </div>
          <IndustryBenchmarks selected={state.industry} />
          <p className="text-xs leading-relaxed text-muted-foreground">{FOOTNOTE}</p>
        </div>
      </div>
    </TooltipProvider>
  );
}
