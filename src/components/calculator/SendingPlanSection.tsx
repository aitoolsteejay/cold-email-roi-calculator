import { forwardRef } from "react";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DURATION_OPTIONS, SENDING_SOP } from "@/data/coldEmailBenchmarks";
import { bookedPerProspect } from "@/lib/coldEmailRoi";
import { getCurrency } from "@/lib/format";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { SendingRamp } from "./SendingRamp";
import type { CalculatorApi } from "./useColdEmailCalculator";
import { VolumeInput } from "./VolumeInput";

/** Volume input and duration on the left, the live sending ramp on the right. */
export const SendingPlanSection = forwardRef<HTMLDivElement, { api: CalculatorApi }>(function SendingPlanSection({ api }, rampRef) {
  const { state, update, setVolumeMode, result, rampPlan } = api;
  const locale = getCurrency(state.currency).locale;
  const sop = SENDING_SOP;

  return (
    <section aria-labelledby="sending-plan-title" className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: "#16a34a15" }}>
          <Mail className="h-5 w-5" style={{ color: "#16a34a" }} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 id="sending-plan-title" className="text-2xl font-black text-foreground">Your Sending Plan</h2>
            <InfoTip label="Sending plan rules">
              <Lines
                items={[
                  `Each domain starts with ${sop.firstBatchIds} ids on day 1`,
                  `New ids warm up for ${sop.warmupDays} days, then send`,
                  `One month later the other ${sop.idsPerDomain - sop.firstBatchIds} ids are added`,
                  `Each id: up to ${sop.prospectsPerIdPerMonth} new prospects a month, max ${sop.emailsPerIdPerDay} emails a day`,
                  `Each prospect: first email and ${sop.emailsPerProspect - 1} follow ups, ${sop.followUpGapDays} days apart`,
                  `Ids send every day. A month is ${sop.daysPerMonth} days`,
                ]}
              />
            </InfoTip>
          </div>
          <p className="text-sm text-muted-foreground">Enter your volume. The ramp updates as you type.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-4">
          <VolumeInput
            mode={state.volumeMode}
            onModeChange={setVolumeMode}
            dailyEmailTarget={state.dailyEmailTarget}
            monthlyProspectTarget={state.monthlyProspectTarget}
            onChange={(mode, v) => update(mode === "emails" ? "dailyEmailTarget" : "monthlyProspectTarget", v)}
            plan={result.plan}
            locale={locale}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="duration" className="font-semibold">Duration</Label>
              <InfoTip label="Duration">How many months of outreach to project. Cost and revenue are counted over this period.</InfoTip>
            </div>
            <Select value={String(state.durationMonths)} onValueChange={(v) => update("durationMonths", Number(v))}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d.months} value={String(d.months)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-8">
          <SendingRamp
            ref={rampRef}
            rampPlan={rampPlan}
            durationPlan={result.plan}
            durationMonths={state.durationMonths}
            bookedPerProspect={bookedPerProspect(state)}
            locale={locale}
          />
        </div>
      </div>
    </section>
  );
});
