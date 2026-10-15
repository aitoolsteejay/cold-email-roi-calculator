import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BENCHMARKS, MYNTMORE_2026, SOFT_WARNING_COPY, type MetricKey } from "@/data/coldEmailBenchmarks";
import { bandFor, isAboveBestPublished } from "@/lib/coldEmailRoi";
import { decimalsForStep, formatCount, formatInteger, formatPercent } from "@/lib/format";
import { BandChip } from "./BandChip";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { SourcesPopover } from "./SourcesPopover";

interface RateSliderProps {
  metric: MetricKey;
  value: number;
  onChange: (value: number) => void;
  /** Count at the funnel stage this rate produces, shown as "= 2,009". */
  count: number;
  countNoun: string;
  /** Show the count as a whole number (meetings cannot be fractional). */
  wholeCount?: boolean;
  locale: string;
  children?: React.ReactNode;
}

export function RateSlider({ metric, value, onChange, count, countNoun, wholeCount, locale, children }: RateSliderProps) {
  const countText = wholeCount ? formatInteger(count, locale) : formatCount(count, locale);
  // Show as many decimals as the slider step allows, e.g. 1.67% for bounce rate.
  const pct = (v: number) => formatPercent(v, locale, decimalsForStep(BENCHMARKS[metric].slider.step));
  const b = BENCHMARKS[metric];
  const band = bandFor(metric, value);
  const warn = isAboveBestPublished(metric, value);
  const labelId = `${metric}-label`;
  const captionId = `${metric}-caption`;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-1.5">
          <Label id={labelId} className="text-sm font-medium">
            {b.label}
          </Label>
          <InfoTip label={b.label}>
            {b.help} <span className="text-muted-foreground">Measured {b.appliesTo}.</span>
          </InfoTip>
        </div>
        <div className="flex items-center gap-2">
          {band && <BandChip label={band.label} tone={band.tone} />}
          <span className="flex items-baseline gap-1.5" aria-live="polite">
            <span className="text-sm font-bold text-accent">{pct(value)}</span>
            <span className="text-xs text-muted-foreground">
              = {countText}
              <span className="sr-only"> {countNoun}</span>
            </span>
          </span>
        </div>
      </div>
      <Slider
        min={b.slider.min}
        max={b.slider.max}
        step={b.slider.step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        thumbLabelledBy={labelId}
        thumbDescribedBy={captionId}
        valueText={`${pct(value)}, ${countText} ${countNoun}`}
      />
      <div id={captionId} className="space-y-1 text-[11px] leading-snug text-muted-foreground">
        {b.myntmore && (
          <div className="flex items-start gap-1">
            <p>
              <span className="font-semibold text-foreground/80">Myntmore 2026 avg:</span>{" "}
              <span className="font-bold text-foreground">{pct(b.myntmore.value)}</span>
            </p>
            <InfoTip label={`Myntmore 2026 ${b.label.toLowerCase()}`}>
              <Lines items={[...b.myntmore.detail, MYNTMORE_2026.source]} />
            </InfoTip>
          </div>
        )}
        <div className="flex items-start gap-1">
          <div>
            <p className="font-semibold text-foreground/70">Published benchmark:</p>
            <Lines items={b.typicalRange} />
          </div>
          <SourcesPopover title={b.label} sources={b.sources} />
        </div>
      </div>
      {warn && (
        <p role="status" className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {SOFT_WARNING_COPY}
        </p>
      )}
      {children}
    </div>
  );
}
