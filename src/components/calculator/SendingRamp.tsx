import { forwardRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import type { IdSegment, SendMonth, SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lines } from "./Lines";

interface MonthCard {
  title: string;
  month: SendMonth;
  /** True for the card that stands for every month once all ids are live. */
  ongoing: boolean;
}

/** Month 1, Month 2, ... then "Month N onwards" from the first month every id sends all month. */
function cardsFor(plan: SendingPlan): MonthCard[] {
  const cards: MonthCard[] = [];
  for (const m of plan.months) {
    const allMonth = m.idSegments.length === 1 && m.idSegments[0].idsSending === plan.ids;
    if (allMonth) {
      cards.push({ title: `Month ${m.month} onwards`, month: m, ongoing: true });
      break;
    }
    cards.push({ title: `Month ${m.month}`, month: m, ongoing: false });
  }
  return cards;
}

type Kind = "warmup" | "some" | "all";

const KINDS: Record<Kind, { label: string; className: string }> = {
  warmup: { label: "Warm-up", className: "bg-muted-foreground/25" },
  some: { label: "Half the ids sending", className: "bg-primary/50" },
  all: { label: "All ids sending", className: "bg-primary" },
};

function kindOf(seg: IdSegment, totalIds: number): Kind {
  if (seg.idsSending === 0) return "warmup";
  return seg.idsSending >= totalIds ? "all" : "some";
}

/**
 * One coloured stretch of the bar. Its details open on mouse hover, keyboard focus or tap,
 * and close when the pointer leaves, focus moves on, or the visitor taps elsewhere.
 */
function BarSegment({ seg, kind, lines }: { seg: IdSegment; kind: Kind; lines: string[] }) {
  const [open, setOpen] = useState(false);
  const days = SENDING_SOP.daysPerMonth;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={lines.join(", ")}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={(e) => {
            // Always open on click or tap; tapping elsewhere closes it.
            e.preventDefault();
            setOpen(true);
          }}
          className={cn(
            "absolute inset-y-0 cursor-help transition-[filter] hover:brightness-95 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            KINDS[kind].className,
          )}
          style={{ left: `${((seg.fromDay - 1) / days) * 100}%`, width: `${((seg.toDay - seg.fromDay + 1) / days) * 100}%` }}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="pointer-events-none w-auto px-3 py-2 text-xs"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Lines items={lines} />
      </PopoverContent>
    </Popover>
  );
}

function Timeline({ month, plan, locale }: { month: SendMonth; plan: SendingPlan; locale: string }) {
  const days = SENDING_SOP.daysPerMonth;
  const n = (v: number) => formatInteger(v, locale);
  const marks = [1, ...month.idSegments.slice(1).map((s) => s.fromDay), days];
  return (
    <div>
      <div className="relative h-4 overflow-hidden rounded-full bg-secondary">
        {month.idSegments.map((seg) => {
          const kind = kindOf(seg, plan.ids);
          const lines =
            kind === "warmup"
              ? [`Days ${seg.fromDay} to ${seg.toDay}`, "Ids warm up, nothing is sent"]
              : [
                  `Days ${seg.fromDay} to ${seg.toDay}`,
                  `${n(seg.idsSending)} ids sending`,
                  `${n(seg.idsSending * plan.emailsPerIdPerDay)} emails a day`,
                ];
          return <BarSegment key={seg.fromDay} seg={seg} kind={kind} lines={lines} />;
        })}
      </div>
      <div className="relative mt-1 h-3 text-[10px] text-muted-foreground" aria-hidden="true">
        {marks.map((d, i) => (
          <span
            key={d}
            className={cn("absolute", i === 0 ? "left-0" : i === marks.length - 1 ? "right-0" : "-translate-x-1/2")}
            style={i === 0 || i === marks.length - 1 ? undefined : { left: `${((d - 0.5) / days) * 100}%` }}
          >
            {i === 0 ? "Day 1" : d}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Props {
  rampPlan: SendingPlan;
  durationPlan: SendingPlan;
  durationMonths: number;
  locale: string;
}

/** The ramp month by month: a 30 day bar showing when ids warm up and send, plus the month's totals. */
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
  const liveDay = SENDING_SOP.warmupDays + 1;

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
              ? `${n(month.idsAdded)} ids, live from day ${liveDay}`
              : month.idsAdded > 0
                ? `+${n(month.idsAdded)} ids, live from day ${liveDay}`
                : `All ${n(rampPlan.ids)} ids, every day`;
          // From the point every id is live, new prospects vary a little month to month as lists finish
          // on different days, so the card shows the monthly average (the target).
          const prospects = ongoing ? rampPlan.prospectsPerMonth : month.prospects;
          const sent = ongoing ? rampPlan.emailsPerDay * SENDING_SOP.daysPerMonth : month.sent;
          return (
            <div key={title} className={cn("flex flex-col rounded-xl border p-4", ongoing ? "border-[#16a34a]/30 bg-[#16a34a]/5" : "border-border bg-secondary/20")}>
              <div className="mb-3">
                <h4 className="text-base font-black text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">
                  {n(rampPlan.domains)} domains · {idsLine}
                </p>
              </div>

              <Timeline month={month} plan={rampPlan} locale={locale} />

              <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">New prospects{ongoing ? " a month" : ""}</dt>
                  <dd className="font-bold text-foreground">
                    {ongoing ? "~" : ""}
                    {n(prospects)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Emails sent{ongoing ? " a month" : ""}</dt>
                  <dd className="font-bold text-foreground">{n(sent)}</dd>
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
