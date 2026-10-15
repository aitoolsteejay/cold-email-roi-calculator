import { forwardRef } from "react";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

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

type Kind = "warmup" | "first" | "followup";

const KINDS: Record<Kind, { label: string; className: string }> = {
  warmup: { label: "Warm-up", className: "bg-muted-foreground/25" },
  first: { label: "First emails", className: "bg-primary" },
  followup: { label: "Follow-ups", className: "bg-[#16a34a]/70" },
};

interface Segment {
  kind: Kind;
  /** Days within the month, 1 to 30. */
  from: number;
  to: number;
  detail: string;
}

/** What happens on which days of a month, for the timeline bar. */
function segmentsFor(plan: SendingPlan, month: SendMonth, locale: string): Segment[] {
  const days = SENDING_SOP.daysPerMonth;
  const start = (month.month - 1) * days + 1;
  const end = month.month * days;
  const local = (abs: number) => abs - start + 1;
  const n = (v: number) => formatInteger(v, locale);
  const segs: Segment[] = [];

  const firstLaunch = plan.campaigns[0]?.launchDay ?? Infinity;
  if (firstLaunch > start && firstLaunch <= end + 1) {
    segs.push({ kind: "warmup", from: 1, to: local(firstLaunch - 1), detail: `Days 1 to ${local(firstLaunch - 1)}: ids warm up, nothing is sent` });
  }

  for (const c of plan.campaigns) {
    const firstFrom = Math.max(c.firstEmailsFrom, start);
    const firstTo = Math.min(c.firstEmailsTo, end);
    if (firstFrom <= firstTo) {
      segs.push({
        kind: "first",
        from: local(firstFrom),
        to: local(firstTo),
        detail: `Days ${local(firstFrom)} to ${local(firstTo)}: first emails to all ${n(c.listSize)} prospects, up to ${n(c.firstEmailsPerDay)} a day`,
      });
    }
    if (c.followUpsFrom !== null && c.followUpsTo !== null) {
      // Drawn from the day after the first emails finish, so the two never overlap on the bar.
      const fuFrom = Math.max(c.followUpsFrom, c.firstEmailsTo + 1, start);
      const fuTo = Math.min(c.followUpsTo, end);
      if (fuFrom <= fuTo) {
        segs.push({
          kind: "followup",
          from: local(fuFrom),
          to: local(fuTo),
          detail: `Days ${local(fuFrom)} to ${local(fuTo)}: follow ups${c.launchDay < start ? " for last month's list" : ""}`,
        });
      }
    }
  }
  return segs.sort((a, b) => a.from - b.from);
}

function Timeline({ segments }: { segments: Segment[] }) {
  const days = SENDING_SOP.daysPerMonth;
  const launch = SENDING_SOP.warmupDays + 1;
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        {segments.map((s) => (
          <div
            key={`${s.kind}-${s.from}`}
            title={s.detail}
            className={cn("absolute inset-y-0", KINDS[s.kind].className)}
            style={{ left: `${((s.from - 1) / days) * 100}%`, width: `${((s.to - s.from + 1) / days) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1 h-3 text-[10px] text-muted-foreground" aria-hidden="true">
        <span className="absolute left-0">Day 1</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${((launch - 0.5) / days) * 100}%` }}>
          {launch}
        </span>
        <span className="absolute right-0">{days}</span>
      </div>
      <ul className="sr-only">
        {segments.map((s) => (
          <li key={`${s.kind}-${s.from}`}>{s.detail}</li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  rampPlan: SendingPlan;
  durationPlan: SendingPlan;
  durationMonths: number;
  locale: string;
}

/** The ramp month by month: a 30 day bar showing warm-up, first emails and follow-ups, plus that month's totals. */
export const SendingRamp = forwardRef<HTMLDivElement, Props>(function SendingRamp({ rampPlan, durationPlan, durationMonths, locale }, ref) {
  const n = (v: number) => formatInteger(v, locale);

  if (rampPlan.domains === 0) {
    return (
      <div ref={ref} className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Enter a volume to see your sending ramp.
      </div>
    );
  }

  const cards = cardsFor(rampPlan);
  const launchDay = SENDING_SOP.warmupDays + 1;

  return (
    <div ref={ref} className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(Object.keys(KINDS) as Kind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", KINDS[k].className)} aria-hidden="true" />
            {KINDS[k].label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map(({ title, month, ongoing }) => {
          const idsLine =
            month.month === 1
              ? `${n(month.idsAdded)} ids, live from day ${launchDay}`
              : month.idsAdded > 0
                ? `+${n(month.idsAdded)} ids, live from day ${launchDay}`
                : `All ${n(month.idsSendingAtEnd)} ids sending`;
          return (
            <div key={title} className={cn("flex flex-col rounded-xl border p-4", ongoing ? "border-[#16a34a]/30 bg-[#16a34a]/5" : "border-border bg-secondary/20")}>
              <div className="mb-3">
                <h4 className="text-base font-black text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">
                  {n(rampPlan.domains)} domains · {idsLine}
                </p>
              </div>

              <Timeline segments={segmentsFor(rampPlan, month, locale)} />

              <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">New prospects{ongoing ? " a month" : ""}</dt>
                  <dd className="font-bold text-foreground">{n(month.prospects)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Emails sent{ongoing ? " a month" : ""}</dt>
                  <dd className="font-bold text-foreground">{n(month.sent)}</dd>
                </div>
              </dl>
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
