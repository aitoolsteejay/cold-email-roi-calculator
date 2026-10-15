import { useCallback, useMemo, useState } from "react";
import { DEFAULT_STATE, type CalculatorState, type MetricKey, type VolumeMode } from "@/data/coldEmailBenchmarks";
import { calculateRoi, calculateSendingPlan, dailyEmailsFromProspects, prospectsFromDailyEmails } from "@/lib/coldEmailRoi";

/** Prospects per month from whichever volume box the visitor is using. */
function prospectTarget(s: CalculatorState) {
  return s.volumeMode === "emails" ? prospectsFromDailyEmails(s.dailyEmailTarget) : s.monthlyProspectTarget;
}

export function useColdEmailCalculator() {
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);

  const update = useCallback(<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const setRate = useCallback((key: MetricKey, value: number) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  /** Switching boxes carries the current volume across, so the numbers stay the same. */
  const setVolumeMode = useCallback((mode: VolumeMode) => {
    setState((s) => {
      if (s.volumeMode === mode) return s;
      const prospects = prospectTarget(s);
      return mode === "prospects"
        ? { ...s, volumeMode: mode, monthlyProspectTarget: Math.round(prospects) }
        : { ...s, volumeMode: mode, dailyEmailTarget: Math.round(dailyEmailsFromProspects(prospects)) };
    });
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const monthlyProspects = prospectTarget(state);

  const result = useMemo(
    () =>
      calculateRoi({
        ...state,
        monthlyProspectTarget: monthlyProspects,
        dealValue: state.dealValue ?? 0,
        monthlyInvestment: state.monthlyInvestment ?? 0,
      }),
    [state, monthlyProspects],
  );

  /**
   * Ramp for the sending cards. Covers at least 3 months so the climb to full speed is visible,
   * plus one month so the last card's follow ups are shown finishing rather than cut off.
   */
  const rampPlan = useMemo(
    () => calculateSendingPlan(monthlyProspects, Math.max(state.durationMonths, 3) + 1),
    [monthlyProspects, state.durationMonths],
  );

  return { state, update, setRate, setVolumeMode, reset, result, rampPlan };
}

export type CalculatorApi = ReturnType<typeof useColdEmailCalculator>;
