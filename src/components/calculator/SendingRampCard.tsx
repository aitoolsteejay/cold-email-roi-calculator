import { Fragment } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendSegment, SendingPlan } from "@/lib/coldEmailRoi";
import { formatCount, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InfoTip } from "./InfoTip";

interface Row {
  label: string;
  /** Shorter label for phones, e.g. "Month 3+". */
  shortLabel: string;
  month: SendMonth;
  ongoing: boolean;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/** Month 1, Month 2, ... then "Month N onward" once the plan runs at the full target. */
function rowsFor(plan: SendingPlan): Row[] {
  const rows: Row[] = [];
  for (const m of plan.months) {
    const full = plan.prospectsPerMonth > 0 && close(m.prospects, plan.prospectsPerMonth) && close(m.sent, plan.prospectsPerMonth * SENDING_SOP.emailsPerProspect);
    if (full) {
      rows.push({ label: `Month ${m.month} onward`, shortLabel: `Month ${m.month}+`, month: m, ongoing: true });
      break;
    }
    rows.push({ label: `Month ${m.month}`, shortLabel: `Month ${m.month}`, month: m, ongoing: false });
  }
  return rows;
}

function describe(seg: SendSegment, locale: string) {
  const days = seg.fromDay === 1 && seg.toDay === SENDING_SOP.daysPerMonth ? "Every day" : `Days ${seg.fromDay} to ${seg.toDay}`;
  if (seg.idsSending === 0) return `${days}: warm-up, no sending`;
  return `${days}: ${formatInteger(seg.idsSending, locale)} ids, ${formatCount(seg.newProspectsPerDay, locale)} new prospects a day`;
}

function Details({ month, locale }: { month: SendMonth; locale: string }) {
  return (
    <>
      {month.segments.map((seg) => (
        <span key={seg.fromDay} className="block">
          {describe(seg, locale)}
        </span>
      ))}
    </>
  );
}

interface Props {
  rampPlan: SendingPlan;
  /** Plan for the chosen duration, used for the total line. */
  durationPlan: SendingPlan;
  durationMonths: number;
  /** Meetings booked per prospect reached, from the funnel rates. */
  bookedPerProspect: number;
  locale: string;
}

export function SendingRampCard({ rampPlan, durationPlan, durationMonths, bookedPerProspect, locale }: Props) {
  if (rampPlan.domains === 0) return null;
  const rows = rowsFor(rampPlan);
  const sop = SENDING_SOP;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: "#16a34a15" }}>
          <Mail className="h-5 w-5" style={{ color: "#16a34a" }} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xl font-bold text-foreground">Sending ramp</h3>
            <InfoTip label="Sending ramp">
              Each domain starts with {sop.firstBatchIds} ids on day 1, warmed for {sop.warmupDays} days. One month later the other{" "}
              {sop.idsPerDomain - sop.firstBatchIds} ids are added and warmed for {sop.warmupDays} days. Each id gets up to{" "}
              {sop.prospectsPerIdPerMonth} new prospects a month and sends at most {sop.emailsPerIdPerDay} emails a day. Each prospect gets a first
              email and {sop.emailsPerProspect - 1} follow ups, {sop.followUpGapDays} days apart. A month is {sop.daysPerMonth} days.
            </InfoTip>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatInteger(rampPlan.domains, locale)} {rampPlan.domains === 1 ? "domain" : "domains"}, {formatInteger(rampPlan.ids, locale)} ids. Up to{" "}
            {sop.prospectsPerIdPerMonth} new prospects per id a month, {sop.emailsPerProspect} emails per prospect.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
              <th scope="col" className="py-2 pr-2 sm:pr-3 font-medium">Month</th>
              <th scope="col" className="hidden py-2 pr-2 sm:pr-3 font-medium md:table-cell">Who is sending</th>
              <th scope="col" className="py-2 pr-2 sm:pr-3 text-right font-medium">New prospects</th>
              <th scope="col" className="py-2 pr-2 sm:pr-3 text-right font-medium">Emails sent</th>
              <th scope="col" className="py-2 text-right font-medium">Meetings booked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const last = i === rows.length - 1;
              return (
              <Fragment key={r.label}>
              <tr className={cn("align-top", !last && "md:border-b md:border-border/60")}>
                <th scope="row" className="whitespace-nowrap py-2.5 pr-2 sm:pr-3 font-semibold">
                  <span className="md:hidden">{r.shortLabel}</span>
                  <span className="hidden md:inline">{r.label}</span>
                </th>
                <td className="hidden py-2.5 pr-2 sm:pr-3 text-muted-foreground md:table-cell">
                  <Details month={r.month} locale={locale} />
                </td>
                <td className="whitespace-nowrap py-2.5 pr-2 sm:pr-3 text-right font-bold text-foreground">
                  {formatInteger(r.month.prospects, locale)}
                  {r.ongoing && <span className="block text-[11px] font-normal text-muted-foreground sm:text-xs">per month</span>}
                </td>
                <td className="whitespace-nowrap py-2.5 pr-2 sm:pr-3 text-right font-bold text-foreground">
                  {formatInteger(r.month.sent, locale)}
                  {r.ongoing && <span className="block text-[11px] font-normal text-muted-foreground sm:text-xs">per month</span>}
                </td>
                <td className="whitespace-nowrap py-2.5 text-right font-bold text-accent">
                  {formatCount(r.month.prospects * bookedPerProspect, locale)}
                  {r.ongoing && <span className="block text-[11px] font-normal text-muted-foreground sm:text-xs">per month</span>}
                </td>
              </tr>
              {/* On smaller screens the details get their own full-width line under the numbers. */}
              <tr className={cn("md:hidden", !last && "border-b border-border/60")}>
                <td colSpan={4} className="pb-2.5 text-xs text-muted-foreground">
                  <Details month={r.month} locale={locale} />
                </td>
              </tr>
              </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Over {durationMonths} {durationMonths === 1 ? "month" : "months"}: <strong>{formatInteger(durationPlan.totalProspects, locale)} prospects</strong>
          , <strong>{formatInteger(durationPlan.totalSent, locale)} emails</strong>,{" "}
          <strong>{formatCount(durationPlan.totalProspects * bookedPerProspect, locale)} meetings booked</strong>
        </p>
        <a
          href="/founder-meeting"
          data-pdf-ignore
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#F5B731] bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Book a call to set it up
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </Card>
  );
}
