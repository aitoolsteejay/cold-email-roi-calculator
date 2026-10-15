import { describe, expect, it } from "vitest";
import { calculateRoi, calculateSendingCapacity, meetingsPer1000, type RoiInputs } from "./coldEmailRoi";
import { DEFAULT_STATE } from "@/data/coldEmailBenchmarks";

const base: RoiInputs = {
  monthlyEmails: 5000,
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
  warmup: false,
  salesCycleLagMonths: 0,
};

describe("calculateRoi", () => {
  it("matches the Realistic test case", () => {
    const r = calculateRoi(base);
    expect(r.sent).toBe(60000);
    expect(r.delivered).toBeCloseTo(59100, 6);
    expect(Math.round(r.replies)).toBe(2009);
    expect(Math.round(r.positive)).toBe(804);
    expect(Math.round(r.booked)).toBe(322);
    expect(Math.round(r.held)).toBe(241);
    expect(r.deals).toBeCloseTo(28.9, 1);
    expect(r.effectiveLTV).toBe(12000);
    expect(Math.round(r.revenue / 100) * 100).toBeCloseTo(347200, -2);
    expect(r.cost).toBe(30000);
    expect(Math.round(r.roiPercent ?? 0)).toBe(1057);
    expect(Math.round(r.costPerBookedMeeting ?? 0)).toBe(93);
  });

  it("returns null ROI and no NaN when cost is zero", () => {
    const r = calculateRoi({ ...base, monthlyInvestment: 0 });
    expect(r.roiPercent).toBeNull();
    expect(r.costPerBookedMeeting).toBe(0);
    expect(r.costPerCustomer).toBe(0);
    expect(Number.isFinite(r.revenue)).toBe(true);
  });

  it("handles zero volume", () => {
    const r = calculateRoi({ ...base, monthlyEmails: 0 });
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

  it("sends half volume in month one with warm-up", () => {
    const r = calculateRoi({ ...base, warmup: true });
    expect(r.sent).toBe(5000 * 11.5);
  });

  it("drops deals closed in the final lag months", () => {
    const r = calculateRoi({ ...base, salesCycleLagMonths: 3 });
    expect(r.dealsCounted).toBeCloseTo(r.deals * (9 / 12), 6);
  });

  it("sanitises bad input", () => {
    const r = calculateRoi({ ...base, monthlyEmails: NaN, dealValue: Infinity });
    expect(Number.isFinite(r.revenue)).toBe(true);
  });
});

describe("helpers", () => {
  it("default rates give about 5.4 meetings per 1,000 emails", () => {
    expect(meetingsPer1000(DEFAULT_STATE)).toBeCloseTo(5.4, 1);
  });

  it("sizes sending capacity from the SOP", () => {
    expect(calculateSendingCapacity(5000)).toEqual({ mailboxes: 10, domains: 3 });
  });
});
