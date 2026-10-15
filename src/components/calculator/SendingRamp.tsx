import { forwardRef } from "react";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lines } from "./Lines";

interface MonthCard {
  title: string;
  month: SendMonth;
  ongoing: boolean;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/** Month 1, Month 2, ... then "Month N onwards" once the plan runs at the full target. */
function cardsFor(plan: SendingPlan): MonthCard[] {
  const cards: MonthCard[] = [];
  for (const m of plan.months) {
    const full =
      plan.prospectsPerMonth > 0 && close(m.prospects, plan.prospectsPerMonth) && close(m.sent, plan.prospectsPerMonth * SENDING_SOP.emailsPerProspect);
    if (full) {
      cards.push({ title: `Month ${m.month} onwards`, month: m, ongoing: true });
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

/** What the campaigns do in a month: last month's follow ups finishing, then any new list launched. */
function campaignLines(plan: SendingPlan, month: SendMonth, locale: string): string[] {
  const days = SENDING_SOP.daysPerMonth;
  const monthStart = (month.month - 1) * days + 1;
  const monthEnd = month.month * days;
  const n = (v: number) => formatInteger(v, locale);
  const dayOf = (abs: number) => abs - (Math.ceil(abs / days) - 1) * days;
  // "day 8" in this month, "next month, day 8" after it.
  const when = (abs: number) => {
    const m = Math.ceil(abs / days);
    if (m === month.month) return `day ${dayOf(abs)}`;
    return m === month.month + 1 ? `next month, day ${dayOf(abs)}` : `month ${m}, day ${dayOf(abs)}`;
  };
  // "days 15 to 20" inside one month, "day 20 to next month, day 8" across months.
  const range = (from: number, to: number) =>
    Math.ceil(from / days) === Math.ceil(to / days) && Math.ceil(from / days) === month.month
      ? from === to
        ? `day ${dayOf(from)}`
        : `days ${dayOf(from)} to ${dayOf(to)}`
      : `${when(from)} to ${when(to)}`;
  const lines: string[] = [];

  const firstLaunch = plan.campaigns[0]?.launchDay ?? Infinity;
  if (firstLaunch > monthStart && firstLaunch <= monthEnd + 1) {
    lines.push(`Days 1 to ${Math.min(dayOf(firstLaunch - 1), days)}: ids warm up, nothing sent`);
  }

  for (const c of plan.campaigns) {
    if (c.launchDay < monthStart && c.followUpsTo !== null && c.followUpsTo >= monthStart) {
      const launchedIn = Math.ceil(c.launchDay / days);
      const whose = launchedIn === month.month - 1 ? "last month's list" : `month ${launchedIn}'s list`;
      lines.push(`Days 1 to ${dayOf(Math.min(c.followUpsTo, monthEnd))}: follow ups for ${whose}`);
    }
  }

  for (const c of plan.campaigns.filter((x) => x.launchDay >= monthStart && x.launchDay <= monthEnd)) {
    const allIds = c.ids === plan.ids ? `all ${n(c.ids)} ids` : `${n(c.ids)} ids`;
    lines.push(`Day ${dayOf(c.launchDay)}: new list of ${n(c.listSize)} prospects on ${allIds}`);
    lines.push(`First emails to all of them: ${range(c.firstEmailsFrom, c.firstEmailsTo)} (up to ${n(c.firstEmailsPerDay)} a day)`);
    if (c.followUpsFrom !== null && c.followUpsTo !== null) {
      lines.push(`Then ${SENDING_SOP.emailsPerProspect - 1} follow ups, ${SENDING_SOP.followUpGapDays} days apart: ${range(c.followUpsFrom, c.followUpsTo)}`);
    }
  }
  return lines;
}

interface Props {
  rampPlan: SendingPlan;
  durationPlan: SendingPlan;
  durationMonths: number;
  locale: string;
}

/** The ramp month by month: domains, ids added, warm-up, who is sending, and that month's prospects and emails. */
export const SendingRamp = forwardRef<HTMLDivElement, Props>(function SendingRamp(
  { rampPlan, durationPlan, durationMonths, locale },
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
                <Section label="Campaigns">
                  <Lines className="space-y-1" items={campaignLines(rampPlan, month, locale)} />
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
        <dl className="grid grid-cols-2 gap-2 text-center">
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">prospects</dt>
            <dd className="text-lg font-black text-foreground sm:text-xl">{n(durationPlan.totalProspects)}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">emails</dt>
            <dd className="text-lg font-black text-foreground sm:text-xl">{n(durationPlan.totalSent)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
});
