import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BENCHMARKS, MYNTMORE_2026, SOFT_WARNING_COPY, type MetricKey } from "@/data/coldEmailBenchmarks";
import { bandFor, isAboveBestPublished } from "@/lib/coldEmailRoi";
import { decimalsForStep, formatInteger, formatPercent } from "@/lib/format";
import { BandChip } from "./BandChip";
import { DetailsPopover, DetailsSection, SourceLinks } from "./DetailsPopover";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { cn } from "@/lib/utils";

interface RateSliderProps {
  metric: MetricKey;
  value: number;
  onChange: (value: number) => void;
  /** Count at the funnel stage this rate produces, shown as "= 2,009". */
  count: number;
  countNoun: string;
  locale: string;
  /** Extra block for the details card, such as the positive reply rate. */
  details?: React.ReactNode;
}

/** Small tick that marks the Myntmore average, on the track and in the caption. */
function AvgTick({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block h-2.5 w-[3px] rounded-full bg-[#16a34a]", className)} />;
}

export function RateSlider({ metric, value, onChange, count, countNoun, locale, details }: RateSliderProps) {
  const b = BENCHMARKS[metric];
  // Counts are people or meetings, so they are always whole numbers. The math underneath is not rounded.
  const countText = formatInteger(count, locale);
  // Show as many decimals as the slider step allows, e.g. 1.67% for bounce rate.
  const pct = (v: number) => formatPercent(v, locale, decimalsForStep(b.slider.step));
  const band = bandFor(metric, value);
  const warn = isAboveBestPublished(metric, value);
  const labelId = `${metric}-label`;
  const captionId = `${metric}-caption`;
  const avgPosition = b.myntmore ? ((b.myntmore.value - b.slider.min) / (b.slider.max - b.slider.min)) * 100 : null;

  return (
    <div className="space-y-1">
      {/* Wraps the value cluster under the label on narrow screens instead of cutting the label off. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-1">
          <Label id={labelId} className="text-sm font-medium">
            {b.label}
          </Label>
          <InfoTip label={b.label}>
            {b.help} <span className="text-muted-foreground">Measured {b.appliesTo}.</span>
          </InfoTip>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {band && <BandChip label={band.label} tone={band.tone} />}
          <span className="text-sm font-bold text-accent">{pct(value)}</span>
          <span className="text-xs text-muted-foreground">
            = {countText}
            <span className="sr-only"> {countNoun}</span>
          </span>
        </div>
      </div>

      <div className="relative">
        {avgPosition !== null && (
          // Marks the Myntmore average on the track: above the track (z-5), below the thumb (z-10).
          <span className="pointer-events-none absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2" style={{ left: `${avgPosition}%` }}>
            <AvgTick className="block opacity-70" />
          </span>
        )}
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
      </div>

      <div id={captionId} className="flex items-center gap-1.5 text-[11px] leading-none text-muted-foreground">
        {b.myntmore && (
          <>
            <AvgTick />
            <span>
              Myntmore avg <span className="font-semibold text-foreground">{pct(b.myntmore.value)}</span>
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>
          Benchmark <span className="font-semibold text-foreground">{b.shortRange}</span>
        </span>
        <DetailsPopover label={`${b.label} benchmark details`}>
          <div className="space-y-3">
            <p className="text-base font-bold">{b.label}</p>
            {b.myntmore && (
              <DetailsSection title="Myntmore 2026 average">
                <p className="text-lg font-black">{pct(b.myntmore.value)}</p>
                <Lines className="text-xs text-muted-foreground" items={[...b.myntmore.detail, MYNTMORE_2026.source]} />
              </DetailsSection>
            )}
            <DetailsSection title="Published benchmark">
              <Lines items={b.typicalRange} />
            </DetailsSection>
            {details}
            <DetailsSection title="Sources">
              <SourceLinks sources={b.sources} />
            </DetailsSection>
          </div>
        </DetailsPopover>
      </div>

      {warn && (
        <p role="status" className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-900">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          {SOFT_WARNING_COPY}
        </p>
      )}
    </div>
  );
}
