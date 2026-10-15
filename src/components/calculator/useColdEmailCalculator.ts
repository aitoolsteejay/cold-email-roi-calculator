import { useCallback, useMemo, useState } from "react";
import { DEFAULT_STATE, type CalculatorState, type MetricKey } from "@/data/coldEmailBenchmarks";
import { calculateRoi, calculateSendingCapacity } from "@/lib/coldEmailRoi";

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

  const capacity = useMemo(() => calculateSendingCapacity(state.monthlyEmails), [state.monthlyEmails]);

  return { state, update, setRate, reset, result, capacity };
}

export type CalculatorApi = ReturnType<typeof useColdEmailCalculator>;
