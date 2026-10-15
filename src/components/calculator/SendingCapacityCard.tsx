import { ArrowRight, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SENDING_SOP } from "@/data/coldEmailBenchmarks";
import { formatInteger } from "@/lib/format";

export function SendingCapacityCard({ monthlyEmails, mailboxes, domains, locale }: { monthlyEmails: number; mailboxes: number; domains: number; locale: string }) {
  if (monthlyEmails <= 0) return null;
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: "#16a34a15" }}>
          <Mail className="h-5 w-5" style={{ color: "#16a34a" }} aria-hidden="true" />
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          To send {formatInteger(monthlyEmails, locale)} emails a month safely you need about{" "}
          <strong>{formatInteger(mailboxes, locale)} mailboxes</strong> on <strong>{formatInteger(domains, locale)} domains</strong>, warmed
          for {SENDING_SOP.warmupWeeks} weeks before the first real send.
        </p>
      </div>
      <a
        href="/founder-meeting"
        data-pdf-ignore
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#F5B731] bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[#FFF8E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Book a call to set it up
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </Card>
  );
}
