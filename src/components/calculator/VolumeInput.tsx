import { useRef } from "react";
import { SENDING_SOP, type VolumeMode } from "@/data/coldEmailBenchmarks";
import type { SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { NumberField } from "./NumberField";

const MODES: { mode: VolumeMode; label: string }[] = [
  { mode: "emails", label: "Emails per day" },
  { mode: "prospects", label: "Prospects per month" },
];

interface Props {
  mode: VolumeMode;
  onModeChange: (mode: VolumeMode) => void;
  dailyEmailTarget: number;
  monthlyProspectTarget: number;
  onChange: (mode: VolumeMode, value: number) => void;
  plan: SendingPlan;
  locale: string;
}

/** Visitors fill in one volume figure. The other is calculated and shown underneath. */
export function VolumeInput({ mode, onModeChange, dailyEmailTarget, monthlyProspectTarget, onChange, plan, locale }: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const sequence = `Each prospect gets a first email and ${SENDING_SOP.emailsPerProspect - 1} follow ups, ${SENDING_SOP.followUpGapDays} days apart.`;
  const n = (v: number) => formatInteger(v, locale);

  const hint =
    plan.domains > 0 ? (
      <Lines
        className="mt-1"
        items={[
          mode === "emails" ? (
            <>
              = <strong className="text-foreground">{n(plan.prospectsPerMonth)}</strong> new prospects a month
            </>
          ) : (
            <>
              = <strong className="text-foreground">{n(plan.emailsPerDay)}</strong> emails a day
            </>
          ),
          <>
            Needs <strong className="text-foreground">{n(plan.domains)}</strong> {plan.domains === 1 ? "domain" : "domains"}
          </>,
          <>
            <strong className="text-foreground">{n(plan.ids)}</strong> ids ({SENDING_SOP.idsPerDomain} per domain)
          </>,
          <>Full speed from month {SENDING_SOP.secondBatchMonth}, day {SENDING_SOP.warmupDays + 1}</>,
        ]}
      />
    ) : undefined;

  // Arrow keys move between the two options, as in a native radio group.
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + MODES.length) % MODES.length;
    onModeChange(MODES[next].mode);
    buttons.current[next]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span id="volume-mode-label" className="text-sm font-semibold">Set your volume by</span>
          <InfoTip label="Volume">
            Fill in either box and the other is worked out. {sequence} Ids work through lists of about {SENDING_SOP.prospectsPerIdPerList}{" "}
            prospects each, and start the next list as soon as one is done.
          </InfoTip>
        </div>
        <div role="radiogroup" aria-labelledby="volume-mode-label" className="grid grid-cols-2 rounded-lg bg-secondary p-1">
          {MODES.map((m, i) => (
            <button
              key={m.mode}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={mode === m.mode}
              tabIndex={mode === m.mode ? 0 : -1}
              onClick={() => onModeChange(m.mode)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mode === m.mode && "bg-card font-bold text-foreground shadow-sm",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "emails" ? (
        <NumberField
          id="dailyEmailTarget"
          label="Emails per day at full speed"
          help={`Daily emails once every domain runs all ${SENDING_SOP.idsPerDomain} ids. Months 1 and 2 send less while ids warm up. ${sequence}`}
          value={dailyEmailTarget}
          onChange={(v) => onChange("emails", v ?? 0)}
          locale={locale}
          integer
          placeholder="1,000"
          hint={hint}
        />
      ) : (
        <NumberField
          id="monthlyProspectTarget"
          label="New prospects per month at full speed"
          help={`New people contacted each month once every domain runs all ${SENDING_SOP.idsPerDomain} ids. Months 1 and 2 reach fewer while ids warm up. ${sequence}`}
          value={monthlyProspectTarget}
          onChange={(v) => onChange("prospects", v ?? 0)}
          locale={locale}
          integer
          placeholder="7,500"
          hint={hint}
        />
      )}
    </div>
  );
}
