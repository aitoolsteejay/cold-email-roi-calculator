import { CalendarCheck, CalendarDays, Gauge, Handshake, Receipt, Timer, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MEETINGS_PER_1000_REFERENCE, type Currency } from "@/data/coldEmailBenchmarks";
import type { RoiResult } from "@/lib/coldEmailRoi";
import { formatCount, formatMoney } from "@/lib/format";
import { InfoTip } from "./InfoTip";
import { Lines } from "./Lines";
import { SourcesPopover } from "./SourcesPopover";

interface StatProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  label: string;
  value: string;
  help: string;
  sub?: string;
}

function Stat({ icon: Icon, color, label, value, help, sub }: StatProps) {
  return (
    <Card
      className="p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ borderTopColor: color, borderTopWidth: 3, boxShadow: "rgba(0,0,0,0.04) 0px 2px 10px" }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} aria-hidden="true" />
        </div>
        <InfoTip label={label}>{help}</InfoTip>
      </div>
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-black text-foreground sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

interface Props {
  result: RoiResult;
  currency: Currency;
  hasInvestment: boolean;
}

export function StatRow({ result, currency, hasInvestment }: Props) {
  const loc = currency.locale;
  const money = (v: number | null) => (hasInvestment && v !== null ? formatMoney(v, currency) : "N/A");
  const payback = !hasInvestment ? "N/A" : result.paybackMonth === null ? "Not within duration" : `Month ${result.paybackMonth}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Stat icon={CalendarDays} color="#7C3AED" label="Meetings booked" value={formatCount(result.booked, loc)} help="Positive replies x meeting booking rate." />
        <Stat icon={CalendarCheck} color="#3B82F6" label="Meetings held" value={formatCount(result.held, loc)} help="Booked meetings x show-up rate." />
        <Stat icon={Handshake} color="#10B981" label="Deals closed" value={formatCount(result.deals, loc)} help="Held meetings x close rate." />
        <Stat
          icon={Gauge}
          color="#14B8A6"
          label="Meetings per 1,000 prospects"
          value={formatCount(result.meetingsPer1000Prospects, loc)}
          help="Meetings booked for every 1,000 prospects reached with the full sequence."
        />
      </div>
      <div className="flex items-start gap-1 text-xs leading-snug text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground/70">Meetings per 1,000, for comparison:</p>
          <Lines items={MEETINGS_PER_1000_REFERENCE.lines} />
        </div>
        <SourcesPopover title="Meetings per 1,000" sources={[MEETINGS_PER_1000_REFERENCE.source]} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat icon={Wallet} color="#F5B731" label="Cost per booked meeting" value={money(result.costPerBookedMeeting)} help="Total investment / meetings booked." />
        <Stat icon={Receipt} color="#F5B731" label="Cost per customer" value={money(result.costPerCustomer)} help="Total investment / deals closed." />
        <Stat icon={Timer} color="#F5B731" label="Payback month" value={payback} help="First month where cumulative revenue is higher than cumulative investment." />
      </div>
    </div>
  );
}
