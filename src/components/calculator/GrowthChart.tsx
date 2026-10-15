import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { Currency } from "@/data/coldEmailBenchmarks";
import type { RoiResult } from "@/lib/coldEmailRoi";
import { formatMoney } from "@/lib/format";

// Series colors copied from the live LinkedIn calculator chart.
const SERIES = [
  { key: "revenue", name: "Revenue", color: "hsl(45 100% 64%)", width: 3 },
  { key: "cost", name: "Service Cost", color: "hsl(0 70% 60%)", width: 2 },
  { key: "profit", name: "Profit", color: "hsl(120 70% 50%)", width: 3 },
] as const;

export function GrowthChart({ result, currency, hasInvestment }: { result: RoiResult; currency: Currency; hasInvestment: boolean }) {
  const last = result.monthly[result.monthly.length - 1];
  const summary = last
    ? `By month ${last.month}: revenue ${formatMoney(last.revenue, currency)}, service cost ${formatMoney(last.cost, currency)}, profit ${formatMoney(last.profit, currency)}.` +
      (hasInvestment ? (result.paybackMonth ? ` Pays back in month ${result.paybackMonth}.` : " Does not pay back within the duration.") : "")
    : "No months to show.";

  return (
    <Card className="p-5 sm:p-6">
      <h3 id="growth-chart-title" className="mb-6 text-xl font-bold text-foreground">
        Revenue vs Profit Growth
      </h3>
      <figure role="img" aria-labelledby="growth-chart-title" aria-describedby="growth-chart-summary" className="m-0">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 85%)" />
              <XAxis dataKey="month" tickFormatter={(m) => `Month ${m}`} tick={{ fontSize: 12, fill: "hsl(0 0% 37.5%)" }} minTickGap={16} />
              <YAxis
                width={64}
                tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
                tick={{ fontSize: 12, fill: "hsl(0 0% 37.5%)" }}
              />
              <Tooltip
                formatter={(v: number, name: string) => [formatMoney(v, currency), name]}
                labelFormatter={(m) => `Month ${m}`}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(36 25% 88%)", fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {SERIES.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={s.width} dot={{ r: 3 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <figcaption id="growth-chart-summary" className="mt-3 text-xs text-muted-foreground">
          {summary}
        </figcaption>
      </figure>
    </Card>
  );
}
