import { ArrowRight, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendSegment, SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { InfoTip } from "./InfoTip";

interface Row {
  label: string;
  month: SendMonth;
  ongoing: boolean;
}

/** Month 1, Month 2, ... then "Month N onward" once volume stops changing. */
function rowsFor(plan: SendingPlan): Row[] {
  const fullMonth = plan.fullSpeedPerDay * SENDING_SOP.daysPerMonth;
  const rows: Row[] = [];
  for (const m of plan.months) {
    if (fullMonth > 0 && m.sent === fullMonth) {
      rows.push({ label: `Month ${m.month} onward`, month: m, ongoing: true });
      break;
    }
    rows.push({ label: `Month ${m.month}`, month: m, ongoing: false });
  }
  return rows;
}

function describe(seg: SendSegment, locale: string) {
  const days = seg.fromDay === 1 && seg.toDay === SENDING_SOP.daysPerMonth ? "Every day" : `Days ${seg.fromDay} to ${seg.toDay}`;
  if (seg.idsSending === 0) return `${days}: warm-up, no sending`;
  return `${days}: ${formatInteger(seg.idsSending, locale)} ids, ${formatInteger(seg.emailsPerDay, locale)} a day`;
}

interface Props {
  rampPlan: SendingPlan;
  /** Plan for the chosen duration, used for the total line. */
  durationPlan: SendingPlan;
  durationMonths: number;
  locale: string;
}

export function SendingRampCard({ rampPlan, durationPlan, durationMonths, locale }: Props) {
  if (rampPlan.domains === 0) return null;
  const rows = rowsFor(rampPlan);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-2.5" style={{ backgroundColor: "#16a34a15" }}>
            <Mail className="h-5 w-5" style={{ color: "#16a34a" }} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-bold text-foreground">Sending ramp</h3>
              <InfoTip label="Sending ramp">
                Each domain starts with {SENDING_SOP.firstBatchIds} ids on day 1, warmed for {SENDING_SOP.warmupDays} days. One month later the
                other {SENDING_SOP.idsPerDomain - SENDING_SOP.firstBatchIds} ids are added and warmed for {SENDING_SOP.warmupDays} days. Every id
                sends up to {SENDING_SOP.emailsPerIdPerDay} emails a day, every day. A month is counted as {SENDING_SOP.daysPerMonth} days.
              </InfoTip>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatInteger(rampPlan.domains, locale)} {rampPlan.domains === 1 ? "domain" : "domains"}, {formatInteger(rampPlan.ids, locale)} ids (
              {SENDING_SOP.idsPerDomain} per domain, {SENDING_SOP.emailsPerIdPerDay} emails per id per day)
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">Month</th>
              <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">Who is sending</th>
              <th scope="col" className="py-2 text-right font-medium">Emails sent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-border/60 align-top last:border-0">
                <th scope="row" className="py-2.5 pr-3 font-semibold sm:whitespace-nowrap">
                  {r.label}
                  {/* On phones the details sit under the month instead of in their own column. */}
                  <span className="mt-0.5 block font-normal text-muted-foreground sm:hidden">
                    {r.month.segments.map((seg) => (
                      <span key={seg.fromDay} className="block">
                        {describe(seg, locale)}
                      </span>
                    ))}
                  </span>
                </th>
                <td className="hidden py-2.5 pr-3 text-muted-foreground sm:table-cell">
                  {r.month.segments.map((seg) => (
                    <span key={seg.fromDay} className="block">
                      {describe(seg, locale)}
                    </span>
                  ))}
                </td>
                <td className="whitespace-nowrap py-2.5 text-right font-bold text-foreground">
                  {formatInteger(r.month.sent, locale)}
                  {r.ongoing && <span className="block text-xs font-normal text-muted-foreground">per month</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          Total over {durationMonths} {durationMonths === 1 ? "month" : "months"}:{" "}
          <strong>{formatInteger(durationPlan.totalSent, locale)} emails</strong>
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
