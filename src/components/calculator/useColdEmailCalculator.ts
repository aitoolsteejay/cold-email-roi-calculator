import { useCallback, useMemo, useState } from "react";
import { DEFAULT_STATE, type CalculatorState, type MetricKey } from "@/data/coldEmailBenchmarks";
import { calculateRoi, calculateSendingPlan } from "@/lib/coldEmailRoi";

export function useColdEmailCalculator() {
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);

  const update = useCallback(<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const setRate = useCallback((key: MetricKey, value: number) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const result = useMemo(
    () =>
      calculateRoi({
        ...state,
        dealValue: state.dealValue ?? 0,
        monthlyInvestment: state.monthlyInvestment ?? 0,
      }),
    [state],
  );

  /** Ramp for the sending card. Always covers 3 months so the climb to full speed is visible. */
  const rampPlan = useMemo(
    () => calculateSendingPlan(state.dailyEmailTarget, Math.max(state.durationMonths, 3)),
    [state.dailyEmailTarget, state.durationMonths],
  );

  return { state, update, setRate, reset, result, rampPlan };
}

export type CalculatorApi = ReturnType<typeof useColdEmailCalculator>;
