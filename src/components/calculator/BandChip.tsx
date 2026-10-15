import type { BandTone } from "@/data/coldEmailBenchmarks";
import { cn } from "@/lib/utils";

const toneClass: Record<BandTone, string> = {
  bad: "bg-red-50 text-red-700 border-red-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  average: "bg-secondary text-foreground/80 border-border",
  good: "bg-blue-50 text-blue-700 border-blue-200",
  great: "bg-green-50 text-green-800 border-green-200",
};

export function BandChip({ label, tone, className }: { label: string; tone: BandTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4",
        toneClass[tone],
        className,
      )}
    >
      <span className="sr-only">Where you stand: </span>
      {label}
    </span>
  );
}
