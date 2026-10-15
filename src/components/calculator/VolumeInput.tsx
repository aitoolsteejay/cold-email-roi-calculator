import { SENDING_SOP, type VolumeMode } from "@/data/coldEmailBenchmarks";
import type { SendingPlan } from "@/lib/coldEmailRoi";
import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InfoTip } from "./InfoTip";
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
  const sequence = `Each prospect gets a first email and ${SENDING_SOP.emailsPerProspect - 1} follow ups, ${SENDING_SOP.followUpGapDays} days apart.`;
  const infra =
    plan.domains > 0
      ? ` Needs ${formatInteger(plan.domains, locale)} ${plan.domains === 1 ? "domain" : "domains"} with ${formatInteger(plan.ids, locale)} ids.`
      : "";
  const hint =
    mode === "emails"
      ? `= ${formatInteger(plan.prospectsPerMonth, locale)} new prospects a month at full speed.${infra}`
      : `= ${formatInteger(plan.emailsPerDay, locale)} emails a day at full speed.${infra}`;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span id="volume-mode-label" className="text-sm font-semibold">Set your volume by</span>
          <InfoTip label="Volume">
            Fill in either box and the other is worked out. {sequence} Each id gets up to {SENDING_SOP.prospectsPerIdPerMonth} new prospects a
            month so follow ups go out on time.
          </InfoTip>
        </div>
        <div role="radiogroup" aria-labelledby="volume-mode-label" className="grid grid-cols-2 rounded-lg bg-secondary p-1">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              role="radio"
              aria-checked={mode === m.mode}
              onClick={() => onModeChange(m.mode)}
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
