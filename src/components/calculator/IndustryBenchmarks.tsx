import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { INDUSTRIES, INDUSTRY_NOTE, INDUSTRY_SOURCES } from "@/data/coldEmailBenchmarks";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SourcesPopover } from "./SourcesPopover";

export function IndustryBenchmarks({ selected }: { selected: string | null }) {
  const [open, setOpen] = useState("");
  // Picking an industry opens the table so the highlighted row is visible.
  useEffect(() => {
    if (selected) setOpen("industries");
  }, [selected]);

  return (
    <Card className="px-5 sm:px-6">
      <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
        <AccordionItem value="industries">
          <AccordionTrigger className="py-4 text-lg">Benchmarks by industry</AccordionTrigger>
          <AccordionContent>
            <p className="mb-3 flex items-start gap-1 text-sm text-muted-foreground">
              <span>{INDUSTRY_NOTE}</span>
              <SourcesPopover title="Industry benchmarks" sources={INDUSTRY_SOURCES} />
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">Industry</th>
                    <th scope="col" className="py-2 pr-3 font-medium whitespace-nowrap">Reply rate</th>
                    <th scope="col" className="py-2 font-medium whitespace-nowrap">Positive reply rate</th>
                  </tr>
                </thead>
                <tbody>
                  {INDUSTRIES.map((row) => {
                    const active = row.key === selected;
                    return (
                      <tr
                        key={row.key}
                        aria-current={active ? "true" : undefined}
                        className={cn("border-b border-border/60 last:border-0", active && "bg-accent/15 font-semibold")}
                      >
                        <th scope="row" className={cn("py-2 pr-3 font-normal", active && "font-semibold")}>{row.label}</th>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatPercent(row.replyMin)} to {formatPercent(row.replyMax)}
                        </td>
                        <td className="py-2 whitespace-nowrap">{row.positiveReplyRange ?? "n/a"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
