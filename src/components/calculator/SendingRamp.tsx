import { forwardRef } from "react";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { SendMonth, SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Column {
  title: string;
  month: SendMonth;
  /** True for the column that stands for every month once all ids are live. */
  ongoing: boolean;
}

/** Month 1, Month 2, ... then "Month N onwards" from the first month every id sends all month. */
function columnsFor(plan: SendingPlan): Column[] {
  const cols: Column[] = [];
  for (const m of plan.months) {
    const allMonth = m.idSegments.length === 1 && m.idSegments[0].idsSending === plan.ids;
    if (allMonth) {
      cols.push({ title: `Month ${m.month} onwards`, month: m, ongoing: true });
      break;
    }
    cols.push({ title: `Month ${m.month}`, month: m, ongoing: false });
  }
  return cols;
}

/** "20 from day 15", "20, then 40 from day 15" or "40". */
function idsSending(month: SendMonth, locale: string) {
  const n = (v: number) => formatInteger(v, locale);
  const sending = month.idSegments.filter((s) => s.idsSending > 0);
  if (sending.length === 0) return "None yet";
  const first = sending[0];
  if (sending.length === 1) return first.fromDay === 1 ? n(first.idsSending) : `${n(first.idsSending)} from day ${first.fromDay}`;
  const last = sending[sending.length - 1];
  return `${n(first.idsSending)}, then ${n(last.idsSending)} from day ${last.fromDay}`;
}

interface Props {
  rampPlan: SendingPlan;
  durationPlan: SendingPlan;
  durationMonths: number;
  locale: string;
}

/** The ramp as a small table: ids sending, new prospects, follow ups and total emails for each month. */
export const SendingRamp = forwardRef<HTMLDivElement, Props>(function SendingRamp({ rampPlan, durationPlan, durationMonths, locale }, ref) {
  const n = (v: number) => formatInteger(v, locale);

  if (rampPlan.domains === 0) {
    return (
      <div ref={ref} className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Enter a volume to see your sending ramp.
      </div>
    );
  }

  const cols = columnsFor(rampPlan);
  // Once every id is live, new prospects vary a little month to month as lists finish on different days,
  // so that column shows the monthly average (the target). Emails are the same every month.
  const figures = cols.map(({ month, ongoing }) => {
    const prospects = ongoing ? rampPlan.prospectsPerMonth : month.prospects;
    const emails = ongoing ? rampPlan.emailsPerDay * SENDING_SOP.daysPerMonth : month.sent;
    return { prospects, followUps: emails - prospects, emails, approx: ongoing ? "~" : "" };
  });

  const rows: { label: string; values: string[]; strong?: boolean }[] = [
    { label: "Ids sending", values: cols.map((c) => idsSending(c.month, locale)) },
    { label: "New prospects reached", values: figures.map((f) => `${f.approx}${n(f.prospects)}`) },
    { label: "Follow-ups sent", values: figures.map((f) => `${f.approx}${n(f.followUps)}`) },
    { label: "Total emails sent", values: figures.map((f) => n(f.emails)), strong: true },
  ];

  const totals = [
    { label: "New prospects reached", value: durationPlan.totalProspects },
    { label: "Follow-ups sent", value: durationPlan.totalSent - durationPlan.totalProspects },
    { label: "Total emails sent", value: durationPlan.totalSent },
  ];

  return (
    <div ref={ref} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">{n(rampPlan.domains)} domains</strong> · <strong className="text-foreground">{n(rampPlan.ids)} ids</strong> ({SENDING_SOP.idsPerDomain}{" "}
        per domain). New ids warm up for {SENDING_SOP.warmupDays} days before sending.
      </p>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Measure</span>
              </th>
              {cols.map((c) => (
                <th
                  key={c.title}
                  scope="col"
                  className={cn("px-3 py-2.5 text-right font-black text-foreground", c.ongoing && "bg-[#16a34a]/10")}
                >
                  {c.title}
                  {c.ongoing && <span className="block text-[11px] font-normal text-muted-foreground">per month</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={cn("border-b border-border/60 last:border-0", r.strong && "bg-secondary/20")}>
                <th scope="row" className={cn("px-3 py-2.5 font-medium text-muted-foreground", r.strong && "font-semibold text-foreground")}>
                  {r.label}
                </th>
                {r.values.map((v, i) => (
                  <td
                    key={cols[i].title}
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums text-foreground",
                      r.strong ? "font-black" : "font-semibold",
                      cols[i].ongoing && "bg-[#16a34a]/5",
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: the same rows, one month at a time, so nothing scrolls sideways. */}
      <div className="space-y-2 sm:hidden">
        {cols.map((c, i) => (
          <div key={c.title} className={cn("rounded-xl border p-3", c.ongoing ? "border-[#16a34a]/30 bg-[#16a34a]/5" : "border-border bg-secondary/20")}>
            <p className="mb-1.5 text-sm font-black text-foreground">
              {c.title}
              {c.ongoing && <span className="font-normal text-muted-foreground"> (per month)</span>}
            </p>
            <dl className="space-y-1 text-[13px]">
              {rows.map((r) => (
                <div key={r.label} className="flex items-baseline justify-between gap-3">
                  <dt className={cn("text-muted-foreground", r.strong && "font-semibold text-foreground")}>{r.label}</dt>
                  <dd className={cn("text-right tabular-nums text-foreground", r.strong ? "font-black" : "font-semibold")}>{r.values[i]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Over {durationMonths} {durationMonths === 1 ? "month" : "months"}
        </p>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {totals.map((t, i) => (
            <div key={t.label} className="flex flex-col-reverse">
              <dt className="text-xs text-muted-foreground">{t.label}</dt>
              <dd className={cn("text-lg text-foreground sm:text-xl", i === totals.length - 1 ? "font-black" : "font-bold")}>{n(t.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
});
