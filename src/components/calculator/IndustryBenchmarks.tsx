import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { INDUSTRIES, INDUSTRY_ESTIMATE_NOTE, INDUSTRY_NOTE, INDUSTRY_SOURCES } from "@/data/coldEmailBenchmarks";
import { formatPercent } from "@/lib/format";
import { SourcesPopover } from "./SourcesPopover";

export function IndustryBenchmarks() {
  const hasEstimates = INDUSTRIES.some((r) => r.positiveReplyEstimated);
  return (
    <Card className="px-5 sm:px-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="industries">
          <AccordionTrigger className="py-4 text-lg">Benchmarks by industry</AccordionTrigger>
          <AccordionContent>
            <div className="mb-3 flex items-start gap-1 text-sm text-muted-foreground">
              <p>{INDUSTRY_NOTE}</p>
              <SourcesPopover title="Industry benchmarks" sources={INDUSTRY_SOURCES} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">Industry</th>
                    <th scope="col" className="whitespace-nowrap py-2 pr-3 font-medium">Reply rate</th>
                    <th scope="col" className="whitespace-nowrap py-2 font-medium">Positive reply rate</th>
                  </tr>
                </thead>
                <tbody>
                  {INDUSTRIES.map((row) => (
                    <tr key={row.key} className="border-b border-border/60 last:border-0">
                      <th scope="row" className="py-2 pr-3 font-normal">{row.label}</th>
                      <td className="whitespace-nowrap py-2 pr-3">
                        {formatPercent(row.replyMin)} to {formatPercent(row.replyMax)}
                      </td>
                      <td className="whitespace-nowrap py-2">
                        {row.positiveReplyRange}
                        {row.positiveReplyEstimated && (
                          <sup className="ml-0.5 text-muted-foreground" aria-label="estimate">
                            *
                          </sup>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasEstimates && <p className="mt-3 text-xs text-muted-foreground">* {INDUSTRY_ESTIMATE_NOTE}</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
