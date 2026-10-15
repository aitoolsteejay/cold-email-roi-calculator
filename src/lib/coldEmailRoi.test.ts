import { describe, expect, it } from "vitest";
import {
  bookedPerProspect,
  calculateInfrastructure,
  calculateRoi,
  calculateSendingPlan,
  dailyEmailsFromProspects,
  meetingsPer1000Prospects,
  prospectsFromDailyEmails,
  type RoiInputs,
} from "./coldEmailRoi";
import { DEFAULT_STATE } from "@/data/coldEmailBenchmarks";

const base: RoiInputs = {
  monthlyProspectTarget: 7500,
  durationMonths: 12,
  bounceRate: 1.5,
  replyRate: 3.4,
  positiveShare: 40,
  bookingRate: 40,
  showRate: 75,
  closeRate: 12,
  dealValue: 1000,
  invoicesPerYear: 12,
  retentionMonths: 12,
  monthlyInvestment: 2500,
  salesCycleLagMonths: 0,
};

describe("volume inputs", () => {
  it("converts emails per day and prospects per month through 4 emails and 30 days", () => {
    expect(prospectsFromDailyEmails(1000)).toBe(7500);
    expect(dailyEmailsFromProspects(7500)).toBe(1000);
  });

  it("sizes ids at 150 prospects each, rounded up to whole domains of 4", () => {
    // 7,500 / 150 = 50 ids, so 13 domains and 52 ids.
    expect(calculateInfrastructure(7500)).toEqual({ domains: 13, ids: 52, prospectsPerMonth: 7500, emailsPerDay: 1000 });
    expect(calculateInfrastructure(600)).toMatchObject({ domains: 1, ids: 4 });
    expect(calculateInfrastructure(601)).toMatchObject({ domains: 2, ids: 8 });
    expect(calculateInfrastructure(0)).toMatchObject({ domains: 0, ids: 0 });
  });
});

describe("sending plan", () => {
  const plan = calculateSendingPlan(7500, 4);

  it("records ids added and warm-up per month", () => {
    expect(plan.months[0]).toMatchObject({ idsAdded: 26, warmupUntilDay: 14, idsSendingAtEnd: 26 });
    expect(plan.months[1]).toMatchObject({ idsAdded: 26, warmupUntilDay: 14, idsSendingAtEnd: 52 });
    expect(plan.months[2]).toMatchObject({ idsAdded: 0, warmupUntilDay: 0, idsSendingAtEnd: 52 });
  });

  it("month 1: warm-up to day 14, then 26 ids start 130 prospects a day", () => {
    expect(plan.months[0].segments).toEqual([
      { fromDay: 1, toDay: 14, idsSending: 0, newProspectsPerDay: 0 },
      { fromDay: 15, toDay: 30, idsSending: 26, newProspectsPerDay: 130 },
    ]);
    expect(plan.months[0].prospects).toBe(16 * 130);
    // First emails, plus follow ups due on days 20+, 25+ and 30.
    expect(plan.months[0].sent).toBe(2080 + 11 * 130 + 6 * 130 + 1 * 130);
  });

  it("month 2: 26 ids to day 14, all 52 from day 15 at the 250 a day target", () => {
    expect(plan.months[1].prospects).toBe(14 * 130 + 16 * 250);
    expect(plan.months[1].sent).toBe(5820 + 5220 + 4620 + 4020);
  });

  it("month 3 onward runs at the full target", () => {
    expect(plan.months[2]).toMatchObject({ prospects: 7500, sent: 30000 });
    expect(plan.months[3]).toMatchObject({ prospects: 7500, sent: 30000 });
  });

  it("never sends more than 25 emails per live id per day", () => {
    const busy = calculateSendingPlan(7500, 12);
    busy.months.forEach((m) => m.segments.forEach((s) => expect(s.newProspectsPerDay * 4).toBeLessThanOrEqual(s.idsSending * 25)));
  });
});

describe("calculateRoi", () => {
  it("runs the funnel on prospects reached", () => {
    const r = calculateRoi(base);
    expect(r.prospects).toBe(2080 + 5820 + 10 * 7500);
    expect(r.sent).toBe(4420 + 19680 + 10 * 30000);
    expect(r.delivered).toBeCloseTo(82900 * 0.985, 6);
    expect(Math.round(r.replies)).toBe(2776);
    expect(Math.round(r.positive)).toBe(1111);
    expect(Math.round(r.booked)).toBe(444);
    expect(Math.round(r.held)).toBe(333);
    expect(r.deals).toBeCloseTo(39.98, 2);
    expect(r.cost).toBe(30000);
  });

  it("pays revenue month by month, so customers won late add less", () => {
    const r = calculateRoi(base);
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    const prospectsByMonth = [2080, 5820, ...Array(10).fill(7500)];
    // $1,000 x 12 invoices / 12 = $1,000 a month per customer, paid from the month won to month 12.
    const expected = prospectsByMonth.reduce((t, p, i) => t + p * perProspect * 1000 * (12 - i), 0);
    expect(r.revenue).toBeCloseTo(expected, 6);
    expect(r.revenue).toBeLessThan(r.deals * r.effectiveLTV);
    // Cumulative chart line ends at the headline revenue.
    expect(r.monthly[11].revenue).toBeCloseTo(r.revenue, 6);
  });

  it("stops payments at the end of the retention period", () => {
    const r = calculateRoi({ ...base, retentionMonths: 3, durationMonths: 3 });
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    // Month 1 customers pay 3 months, month 2 customers 2, month 3 customers 1.
    expect(r.revenue).toBeCloseTo(perProspect * 1000 * (2080 * 3 + 5820 * 2 + 7500 * 1), 6);
  });

  it("does not pay back in month 1 when nothing sends until day 15", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 20000 });
    expect(r.paybackMonth).not.toBe(1);
  });

  it("builds meetings month by month from ramped prospects, not full speed", () => {
    const r = calculateRoi({ ...base, durationMonths: 3 });
    expect(r.prospects).toBe(2080 + 5820 + 7500);
    const perMonth = r.plan.months.map((m) => m.prospects * bookedPerProspect(base));
    expect(perMonth[0]).toBeCloseTo(2080 * 0.985 * 0.034 * 0.4 * 0.4, 9);
    expect(perMonth.reduce((a, b) => a + b, 0)).toBeCloseTo(r.booked, 9);
    // Full speed for all 3 months would have been 22,500 prospects.
    expect(r.booked).toBeLessThan(22500 * bookedPerProspect(base));
  });

  it("returns null ROI and no NaN when cost is zero", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 0 });
    expect(r.roiPercent).toBeNull();
    expect(r.costPerBookedMeeting).toBe(0);
    expect(Number.isFinite(r.revenue)).toBe(true);
  });

  it("handles zero volume", () => {
    const r = calculateRoi({ ...base, monthlyProspectTarget: 0 });
    expect(r.prospects).toBe(0);
    expect(r.sent).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.costPerBookedMeeting).toBeNull();
    expect(r.paybackMonth).toBeNull();
    expect(r.roiPercent).toBe(-100);
  });

  it("handles a 100% close rate", () => {
    const r = calculateRoi({ ...base, closeRate: 100 });
    expect(r.deals).toBeCloseTo(r.held, 9);
  });

  it("drops deals that pay out after the duration ends", () => {
    const r = calculateRoi({ ...base, salesCycleLagMonths: 3 });
    const countedShare = (2080 + 5820 + 7 * 7500) / r.prospects;
    expect(r.dealsCounted).toBeCloseTo(r.deals * countedShare, 6);
    // Month 1 customers start paying in month 4, so they pay 9 months inside the 12.
    const perProspect = 0.985 * 0.034 * 0.4 * 0.4 * 0.75 * 0.12;
    const prospectsByMonth = [2080, 5820, ...Array(7).fill(7500)];
    const expected = prospectsByMonth.reduce((t, p, i) => t + p * perProspect * 1000 * (12 - (i + 3)), 0);
    expect(r.revenue).toBeCloseTo(expected, 6);
  });

  it("sanitises bad input", () => {
    const r = calculateRoi({ ...base, monthlyProspectTarget: NaN, dealValue: Infinity });
    expect(Number.isFinite(r.revenue)).toBe(true);
    expect(r.prospects).toBe(0);
  });
});

describe("helpers", () => {
  it("Myntmore 2026 defaults land close to the Smartlead meeting request rate", () => {
    // (1 - 1.67%) x 3.8% x 59% x 47% = 10.36 per 1,000. Smartlead 2026 shows 10.2 meeting requests per 1,000 prospects.
    expect(meetingsPer1000Prospects(DEFAULT_STATE)).toBeCloseTo(10.36, 1);
  });
});
