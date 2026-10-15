import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BenchmarkSource } from "@/data/coldEmailBenchmarks";

export function SourcesPopover({ title, sources }: { title: string; sources: BenchmarkSource[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Sources for ${title}`}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3 w-3" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sources: {title}</p>
        <ul className="space-y-2">
          {sources.map((s) => (
            <li key={s.name + s.note} className="text-sm leading-snug">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline decoration-primary decoration-2 underline-offset-2 hover:text-foreground/80"
              >
                {s.name}
              </a>
              <span className="block text-xs text-muted-foreground">{s.note}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
