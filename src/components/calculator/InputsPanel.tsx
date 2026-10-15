import { RotateCcw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COST_REFERENCE, CURRENCIES, MODEL, MYNTMORE_2026, POSITIVE_REPLY_RATE_REFERENCE } from "@/data/coldEmailBenchmarks";
import { stageCounts } from "@/lib/coldEmailRoi";
import { formatCount, formatMoney, formatPercent, getCurrency } from "@/lib/format";
import { InfoTip } from "./InfoTip";
import { NumberField } from "./NumberField";
import { Lines } from "./Lines";
import { RateSlider } from "./RateSlider";
import { SourcesPopover } from "./SourcesPopover";
import type { CalculatorApi } from "./useColdEmailCalculator";

export function InputsPanel({ api }: { api: CalculatorApi }) {
  const { state, update, setRate, reset, result } = api;
  const currency = getCurrency(state.currency);
  const locale = currency.locale;
  const counts = stageCounts(result, state.bounceRate);
  const positiveReplyRate = (state.replyRate * state.positiveShare) / 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-black text-foreground">Your Inputs</h2>
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <RotateCcw aria-hidden="true" />
          Reset
        </Button>
      </div>

      <div className="space-y-8">
        {/* Currency */}
        <div className="space-y-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="currency" className="font-semibold">Currency</Label>
              <InfoTip label="Currency">Used for deal value, investment and every money figure in the results.</InfoTip>
            </div>
            <Select value={state.currency} onValueChange={(v) => update("currency", v)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rates */}
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Funnel Rates</h3>
            <Lines className="text-xs leading-snug text-muted-foreground" items={MYNTMORE_2026.summary} />
          </div>

          <RateSlider metric="bounceRate" value={state.bounceRate} onChange={(v) => setRate("bounceRate", v)} count={counts.bounceRate} countNoun="prospects bounced" locale={locale} />

          <RateSlider
            metric="replyRate"
            value={state.replyRate}
            onChange={(v) => setRate("replyRate", v)}
            count={counts.replyRate}
            countNoun="replies"
            locale={locale}
          />

          <RateSlider metric="positiveShare" value={state.positiveShare} onChange={(v) => setRate("positiveShare", v)} count={counts.positiveShare} countNoun="positive replies" locale={locale}>
            <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-[11px] leading-snug">
              <p>
                <span className="font-semibold">{POSITIVE_REPLY_RATE_REFERENCE.formulaLabel}:</span>{" "}
                <span className="font-bold text-foreground">{formatPercent(positiveReplyRate, locale)}</span>
              </p>
              <Lines className="mt-0.5 text-muted-foreground" items={POSITIVE_REPLY_RATE_REFERENCE.lines} />
            </div>
          </RateSlider>

          {/* Auto-calculated, mirrors "Disengagement Rate (auto)" on the LinkedIn calculator */}
          <div className="space-y-2 opacity-60" aria-label="Negative or not interested replies, calculated automatically">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Negative / not interested (auto)</span>
                <InfoTip label="Negative replies">Replies that are not interested. Always 100% minus the positive reply share.</InfoTip>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-muted-foreground">{formatPercent(100 - state.positiveShare, locale)}</span>
                <span className="text-xs text-muted-foreground">= {formatCount(counts.negative, locale)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-secondary">
              <div className="h-full rounded-full bg-muted-foreground/50 transition-all" style={{ width: `${100 - state.positiveShare}%` }} />
            </div>
          </div>

          <RateSlider metric="bookingRate" value={state.bookingRate} onChange={(v) => setRate("bookingRate", v)} count={counts.bookingRate} countNoun="meetings booked" wholeCount locale={locale} />
          <RateSlider metric="showRate" value={state.showRate} onChange={(v) => setRate("showRate", v)} count={counts.showRate} countNoun="meetings held" locale={locale} />
          <RateSlider metric="closeRate" value={state.closeRate} onChange={(v) => setRate("closeRate", v)} count={counts.closeRate} countNoun="deals closed" locale={locale} />
        </div>

        {/* Revenue */}
        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="font-semibold text-foreground">Revenue</h3>
          <NumberField
            id="dealValue"
            label="Average deal value"
            help="Average value of one invoice from a new customer."
            value={state.dealValue}
            onChange={(v) => update("dealValue", v)}
            locale={locale}
            prefix={currency.symbol}
            placeholder="e.g. 1,000"
          />
          <NumberField
            id="invoicesPerYear"
            label="Invoices raised per year"
            help="How many times a year you bill one customer. 12 for a monthly retainer, 1 for a one-off project."
            value={state.invoicesPerYear}
            onChange={(v) => update("invoicesPerYear", v ?? 0)}
            locale={locale}
            integer
          />
          <NumberField
            id="retentionMonths"
            label="Customer retention period (months)"
            help="How long an average customer keeps paying you."
            value={state.retentionMonths}
            onChange={(v) => update("retentionMonths", v ?? 0)}
            locale={locale}
            integer
          />
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">Customer LTV (Lifetime)</span>
                <InfoTip label="Customer LTV">Deal value x invoices per year x retention months / 12.</InfoTip>
              </div>
              <span className="shrink-0 text-lg font-bold text-accent">{formatMoney(result.fullLTV, currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/20 bg-accent/10 p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">Effective LTV (for duration)</span>
                <InfoTip label="Effective LTV">The most one customer can pay inside the chosen duration (a customer won in month 1). Uses the shorter of duration and retention.</InfoTip>
              </div>
              <span className="shrink-0 text-lg font-bold text-accent">{formatMoney(result.effectiveLTV, currency)}</span>
            </div>
          </div>
          <NumberField
            id="monthlyInvestment"
            label="Monthly investment"
            help="What you pay for cold email outreach each month: agency or team, tools, data and infrastructure."
            value={state.monthlyInvestment}
            onChange={(v) => update("monthlyInvestment", v)}
            locale={locale}
            prefix={currency.symbol}
            placeholder="e.g. 2,500"
            hint={
              <div className="flex items-start gap-1">
                <Lines items={COST_REFERENCE.lines} />
                <SourcesPopover title="Cost per meeting" sources={COST_REFERENCE.sources} />
              </div>
            }
          />
        </div>

        {/* Advanced */}
        <Accordion type="single" collapsible className="border-t border-border pt-2">
          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced</AccordionTrigger>
            <AccordionContent className="space-y-5">
              <NumberField
                id="salesCycleLagMonths"
                label="Sales cycle lag (months)"
                help="Months between a first meeting and the first payment. Deals that would pay out after the duration ends are not counted as revenue."
                value={state.salesCycleLagMonths}
                onChange={(v) => update("salesCycleLagMonths", v ?? 0)}
                locale={locale}
                integer
                max={MODEL.maxSalesCycleLagMonths}
                hint={
                  state.salesCycleLagMonths > 0 && result.deals > result.dealsCounted
                    ? `${formatCount(result.deals - result.dealsCounted, locale)} deals land after month ${state.durationMonths} and are not counted.`
                    : undefined
                }
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

