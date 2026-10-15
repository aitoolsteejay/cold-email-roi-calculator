import { forwardRef } from "react";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendSegment, SendingPlan } from "@/lib/coldEmailRoi";
import { formatCount, formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lines } from "./Lines";

interface MonthCard {
  title: string;
  month: SendMonth;
  ongoing: boolean;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/** Month 1, Month 2, ... then "Month N onward" once the plan runs at the full target. */
function cardsFor(plan: SendingPlan): MonthCard[] {
  const cards: MonthCard[] = [];
  for (const m of plan.months) {
    const full =
      plan.prospectsPerMonth > 0 && close(m.prospects, plan.prospectsPerMonth) && close(m.sent, plan.prospectsPerMonth * SENDING_SOP.emailsPerProspect);
    if (full) {
      cards.push({ title: `Month ${m.month} onward`, month: m, ongoing: true });
      break;
    }
    cards.push({ title: `Month ${m.month}`, month: m, ongoing: false });
  }
  return cards;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm leading-snug text-foreground">{children}</div>
    </div>
  );
}

function sendingLine(seg: SendSegment, locale: string) {
  const days = seg.fromDay === 1 && seg.toDay === SENDING_SOP.daysPerMonth ? "Every day" : `Days ${seg.fromDay} to ${seg.toDay}`;
  if (seg.idsSending === 0) return `${days}: no sending yet`;
  return `${days}: ${formatInteger(seg.idsSending, locale)} ids, ${formatCount(seg.newProspectsPerDay, locale)} new prospects a day`;
}

interface Props {
  rampPlan: SendingPlan;
  durationPlan: SendingPlan;
  durationMonths: number;
  bookedPerProspect: number;
  locale: string;
}

/** The ramp month by month: domains, ids added, warm-up, who is sending and what that month produces. */
export const SendingRamp = forwardRef<HTMLDivElement, Props>(function SendingRamp(
  { rampPlan, durationPlan, durationMonths, bookedPerProspect, locale },
  ref,
) {
  const n = (v: number) => formatInteger(v, locale);

  if (rampPlan.domains === 0) {
    return (
      <div ref={ref} className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Enter a volume to see your sending ramp.
      </div>
    );
  }

  const cards = cardsFor(rampPlan);

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map(({ title, month, ongoing }) => {
          const meetings = month.prospects * bookedPerProspect;
          return (
            <div key={title} className={cn("flex flex-col rounded-xl border p-4", ongoing ? "border-[#16a34a]/30 bg-[#16a34a]/5" : "border-border bg-secondary/20")}>
              <h4 className="mb-3 text-base font-black text-foreground">{title}</h4>
              <div className="flex-1 space-y-3">
                <Section label="Domains">
                  {month.month === 1 ? `${n(rampPlan.domains)} bought on day 1` : `${n(rampPlan.domains)} live`}
                </Section>
                <Section label="Ids">
                  {month.idsAdded > 0 ? (
                    <Lines
                      items={[
                        `${n(month.idsAdded)} added on day 1 (${n(month.idsAdded / rampPlan.domains)} per domain)`,
                        `Warming up: days 1 to ${month.warmupUntilDay}`,
                      ]}
                    />
                  ) : (
                    `All ${n(month.idsSendingAtEnd)} ids live`
                  )}
                </Section>
                <Section label="Sending">
                  <Lines items={month.segments.map((s) => sendingLine(s, locale))} />
                </Section>
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {ongoing ? "Every month" : "This month"}
                </p>
                <dl className="space-y-1 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">New prospects</dt>
                    <dd className="font-bold text-foreground">{n(month.prospects)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">Emails sent</dt>
                    <dd className="font-bold text-foreground">{n(month.sent)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-muted-foreground">Meetings booked</dt>
                    <dd className="font-bold" style={{ color: "#B8860B" }}>
                      {formatCount(meetings, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Over {durationMonths} {durationMonths === 1 ? "month" : "months"}
        </p>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">prospects</dt>
            <dd className="text-lg font-black text-foreground sm:text-xl">
{n(durationPlan.totalProspects)}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">emails</dt>
            <dd className="text-lg font-black text-foreground sm:text-xl">
{n(durationPlan.totalSent)}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">meetings booked</dt>
            <dd className="text-lg font-black sm:text-xl" style={{ color: "#B8860B" }}>
              {formatCount(durationPlan.totalProspects * bookedPerProspect, locale)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
});
