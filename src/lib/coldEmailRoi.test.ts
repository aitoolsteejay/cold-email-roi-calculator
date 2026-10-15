import { describe, expect, it } from "vitest";
import { calculateInfrastructure, calculateRoi, calculateSendingPlan, meetingsPer1000, type RoiInputs } from "./coldEmailRoi";
import { DEFAULT_STATE } from "@/data/coldEmailBenchmarks";

const base: RoiInputs = {
  dailyEmailTarget: 1000,
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

describe("sending ramp", () => {
  it("sizes domains and ids so each domain runs 4 ids x 25 emails", () => {
    expect(calculateInfrastructure(1000)).toEqual({ domains: 10, ids: 40, fullCapacityPerDay: 1000, fullSpeedPerDay: 1000 });
    expect(calculateInfrastructure(1050)).toEqual({ domains: 11, ids: 44, fullCapacityPerDay: 1100, fullSpeedPerDay: 1050 });
    expect(calculateInfrastructure(0)).toEqual({ domains: 0, ids: 0, fullCapacityPerDay: 0, fullSpeedPerDay: 0 });
  });

  it("follows the month 1, month 2, month 3+ ramp for 1,000 a day", () => {
    const plan = calculateSendingPlan(1000, 4);
    // Month 1: days 1-14 warm-up, days 15-30 with 20 ids (2 per domain) at 25 a day.
    expect(plan.months[0].sent).toBe(16 * 500);
    expect(plan.months[0].segments).toEqual([
      { fromDay: 1, toDay: 14, idsSending: 0, emailsPerDay: 0 },
      { fromDay: 15, toDay: 30, idsSending: 20, emailsPerDay: 500 },
    ]);
    // Month 2: days 1-14 still 20 ids, days 15-30 all 40 ids.
    expect(plan.months[1].sent).toBe(14 * 500 + 16 * 1000);
    // Month 3 onward: 1,000 a day, every day.
    expect(plan.months[2].sent).toBe(30000);
    expect(plan.months[3].sent).toBe(30000);
  });

  it("never sends more than the daily target", () => {
    const plan = calculateSendingPlan(1050, 3);
    expect(plan.months[0].sent).toBe(16 * 550);
    expect(plan.months[2].sent).toBe(30 * 1050);
  });
});

describe("calculateRoi", () => {
  it("runs the funnel on the ramped volume", () => {
    const r = calculateRoi(base);
    expect(r.sent).toBe(8000 + 23000 + 10 * 30000);
    expect(r.delivered).toBeCloseTo(326035, 6);
    expect(Math.round(r.replies)).toBe(11085);
    expect(Math.round(r.positive)).toBe(4434);
    expect(Math.round(r.booked)).toBe(1774);
    expect(Math.round(r.held)).toBe(1330);
    expect(r.deals).toBeCloseTo(159.63, 2);
    expect(r.effectiveLTV).toBe(12000);
    expect(r.revenue).toBeCloseTo(r.deals * 12000, 6);
    expect(r.cost).toBe(30000);
    expect(r.costPerBookedMeeting).toBeCloseTo(30000 / r.booked, 9);
  });

  it("returns null ROI and no NaN when cost is zero", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 0 });
    expect(r.roiPercent).toBeNull();
    expect(r.costPerBookedMeeting).toBe(0);
    expect(r.costPerCustomer).toBe(0);
    expect(Number.isFinite(r.revenue)).toBe(true);
  });

  it("handles zero volume", () => {
    const r = calculateRoi({ ...base, dailyEmailTarget: 0 });
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

  it("sends nothing in a 1 month plan until day 15", () => {
    const r = calculateRoi({ ...base, durationMonths: 1 });
    expect(r.sent).toBe(8000);
  });

  it("drops deals that pay out after the duration ends", () => {
    const r = calculateRoi({ ...base, salesCycleLagMonths: 3 });
    // Only deals from months 1 to 9 pay out inside 12 months.
    const countedShare = (8000 + 23000 + 7 * 30000) / r.sent;
    expect(r.dealsCounted).toBeCloseTo(r.deals * countedShare, 6);
  });

  it("sanitises bad input", () => {
    const r = calculateRoi({ ...base, dailyEmailTarget: NaN, dealValue: Infinity });
    expect(Number.isFinite(r.revenue)).toBe(true);
    expect(r.sent).toBe(0);
  });
});

describe("helpers", () => {
  it("default rates give about 5.4 meetings per 1,000 emails", () => {
    expect(meetingsPer1000(DEFAULT_STATE)).toBeCloseTo(5.4, 1);
  });
});
