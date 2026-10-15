import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COST_REFERENCE, CURRENCIES, MODEL, MYNTMORE_2026, POSITIVE_REPLY_RATE_REFERENCE } from "@/data/coldEmailBenchmarks";
import { stageCounts } from "@/lib/coldEmailRoi";
import { formatCount, formatInteger, formatMoney, formatPercent, getCurrency } from "@/lib/format";
import { DetailsPopover, DetailsSection, SourceLinks } from "./DetailsPopover";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { NumberField } from "./NumberField";
import { RateSlider } from "./RateSlider";
import type { CalculatorApi } from "./useColdEmailCalculator";

/**
 * Compact inputs card. Each slider shows one caption line; the full benchmark, Myntmore data and
 * sources sit in a details card behind the info button, so the card stays about as tall as the funnel.
 */
export function InputsPanel({ api }: { api: CalculatorApi }) {
  const { state, update, setRate, reset, result } = api;
  const currency = getCurrency(state.currency);
  const locale = currency.locale;
  const counts = stageCounts(result, state.bounceRate);
  const positiveReplyRate = (state.replyRate * state.positiveShare) / 100;
  // Rounded first, so "reached − bounced" always adds up to the delivered figure shown.
  const reached = Math.round(result.prospects);
  const delivered = Math.round(result.delivered);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-2xl font-black text-foreground">Your Inputs</h2>
        <div className="flex items-center gap-1">
          <Label htmlFor="currency" className="sr-only">
            Currency
          </Label>
          <Select value={state.currency} onValueChange={(v) => update("currency", v)}>
            <SelectTrigger id="currency" aria-label={`Currency: ${currency.label}`} className="h-8 w-auto gap-1.5 px-2.5 text-xs font-semibold">
              <SelectValue>{`${currency.symbol} ${currency.code}`}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end" className="w-64">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={reset} className="-mr-2 h-8 px-2 text-muted-foreground">
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Rates */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-foreground">Funnel Rates</h3>
            <InfoTip label="Funnel rates">
              <Lines items={MYNTMORE_2026.summary} />
            </InfoTip>
          </div>

          <RateSlider metric="bounceRate" value={state.bounceRate} onChange={(v) => setRate("bounceRate", v)} count={counts.bounceRate} countNoun="prospects bounced" locale={locale} />

          {/* The base for every rate below: prospects reached minus bounces. */}
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground">Delivered prospects</span>
                <InfoTip label="Delivered prospects">
                  Prospects reached minus the ones that bounced. The reply rate and every step after it are calculated on this number.
                </InfoTip>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {formatInteger(reached, locale)} reached − {formatInteger(reached - delivered, locale)} bounced
              </p>
            </div>
            <span className="shrink-0 text-base font-bold text-foreground">{formatInteger(delivered, locale)}</span>
          </div>

          <RateSlider metric="replyRate" value={state.replyRate} onChange={(v) => setRate("replyRate", v)} count={counts.replyRate} countNoun="replies" locale={locale} />
          <RateSlider
            metric="positiveShare"
            value={state.positiveShare}
            onChange={(v) => setRate("positiveShare", v)}
            count={counts.positiveShare}
            countNoun="positive replies"
            locale={locale}
            details={
              <DetailsSection title={POSITIVE_REPLY_RATE_REFERENCE.formulaLabel}>
                <p className="text-lg font-black">{formatPercent(positiveReplyRate, locale)}</p>
                <Lines className="text-xs text-muted-foreground" items={POSITIVE_REPLY_RATE_REFERENCE.lines} />
              </DetailsSection>
            }
          />

          {/* Auto-calculated, mirrors "Disengagement Rate (auto)" on the LinkedIn calculator */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground opacity-70">
            <div className="flex items-center gap-1">
              <span className="font-medium">Negative / not interested (auto)</span>
              <InfoTip label="Negative replies">Replies that are not interested. Always 100% minus the positive reply share.</InfoTip>
            </div>
            <span>
              <span className="font-bold">{formatPercent(100 - state.positiveShare, locale)}</span> = {formatCount(counts.negative, locale)}
            </span>
          </div>

          <RateSlider metric="bookingRate" value={state.bookingRate} onChange={(v) => setRate("bookingRate", v)} count={counts.bookingRate} countNoun="meetings booked" wholeCount locale={locale} />
          <RateSlider metric="showRate" value={state.showRate} onChange={(v) => setRate("showRate", v)} count={counts.showRate} countNoun="meetings held" locale={locale} />
          <RateSlider metric="closeRate" value={state.closeRate} onChange={(v) => setRate("closeRate", v)} count={counts.closeRate} countNoun="deals closed" locale={locale} />
        </div>

        {/* Revenue */}
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="font-semibold text-foreground">Revenue</h3>
          <div className="grid grid-cols-2 items-end gap-3">
            <NumberField
              id="dealValue"
              label="Deal value"
              help="Average value of one invoice from a new customer."
              value={state.dealValue}
              onChange={(v) => update("dealValue", v)}
              locale={locale}
              prefix={currency.symbol}
              placeholder="1,000"
            />
            <NumberField
              id="monthlyInvestment"
              label="Monthly spend"
              help="What you pay for cold email outreach each month."
              info={
                <DetailsPopover label="Monthly spend details">
                  <div className="space-y-3">
                    <p className="text-base font-bold">Monthly spend</p>
                    <DetailsSection title="What to include">
                      What you pay for cold email outreach each month: agency or team, tools, data and infrastructure.
                    </DetailsSection>
                    <DetailsSection title="Cost per meeting benchmark">
                      <Lines items={COST_REFERENCE.lines} />
                    </DetailsSection>
                    <DetailsSection title="Sources">
                      <SourceLinks sources={COST_REFERENCE.sources} />
                    </DetailsSection>
                  </div>
                </DetailsPopover>
              }
              value={state.monthlyInvestment}
              onChange={(v) => update("monthlyInvestment", v)}
              locale={locale}
              prefix={currency.symbol}
              placeholder="2,500"
            />
          </div>
          <div className="grid grid-cols-3 items-end gap-2">
            <NumberField
              id="invoicesPerYear"
              label="Invoices/yr"
              labelClassName="text-xs"
              help="How many times a year you bill one customer. 12 for a monthly retainer, 1 for a one-off project."
              value={state.invoicesPerYear}
              onChange={(v) => update("invoicesPerYear", v ?? 0)}
              locale={locale}
              integer
            />
            <NumberField
              id="retentionMonths"
              label="Retention (mo)"
              labelClassName="text-xs"
              help="Months an average customer keeps paying you."
              value={state.retentionMonths}
              onChange={(v) => update("retentionMonths", v ?? 0)}
              locale={locale}
              integer
            />
            <NumberField
              id="salesCycleLagMonths"
              label="Sales lag (mo)"
              labelClassName="text-xs"
              help="Months between a first meeting and the first payment. Deals that would pay out after the duration ends are not counted as revenue."
              value={state.salesCycleLagMonths}
              onChange={(v) => update("salesCycleLagMonths", v ?? 0)}
              locale={locale}
              integer
              max={MODEL.maxSalesCycleLagMonths}
            />
          </div>
          {state.salesCycleLagMonths > 0 && result.deals > result.dealsCounted && (
            <p className="text-xs text-muted-foreground">
              {formatCount(result.deals - result.dealsCounted, locale)} deals land after month {state.durationMonths} and are not counted.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                Customer LTV
                <InfoTip label="Customer LTV">Lifetime value: deal value x invoices per year x retention months / 12.</InfoTip>
              </div>
              <p className="text-base font-bold text-accent">{formatMoney(result.fullLTV, currency)}</p>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                Effective LTV
                <InfoTip label="Effective LTV">
                  The most one customer can pay inside the chosen duration (a customer won in month 1). Uses the shorter of duration and retention.
                </InfoTip>
              </div>
              <p className="text-base font-bold text-accent">{formatMoney(result.effectiveLTV, currency)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
