import { describe, expect, it } from "vitest";
import { calculateInstallmentPlan } from "./installment";

describe("calculateInstallmentPlan", () => {
  it("يحسب التقسيط دون فوائد لدفعة 100 دولار", () => {
    const plan = calculateInstallmentPlan(800, 100, 24);
    expect(plan.discountPercent).toBe(0);
    expect(plan.financedUsd).toBe(700);
    expect(plan.monthlyUsd).toBeCloseTo(29.17, 2);
  });

  it("يطبق خصم 10% عند الدفعة الأولى 150 دولار", () => {
    const plan = calculateInstallmentPlan(1000, 150, 24);
    expect(plan.discountPercent).toBe(10);
    expect(plan.discountUsd).toBe(100);
    expect(plan.financedUsd).toBe(750);
    expect(plan.monthlyUsd).toBeCloseTo(31.25, 2);
  });

  it("يطبق خصم 20% عند الدفعة الأولى 300 دولار", () => {
    const plan = calculateInstallmentPlan(1000, 300, 24);
    expect(plan.discountPercent).toBe(20);
    expect(plan.discountUsd).toBe(200);
    expect(plan.financedUsd).toBe(500);
    expect(plan.monthlyUsd).toBeCloseTo(20.83, 2);
  });

  it("يرفض الدفعات أو المدد غير المطابقة للسياسة", () => {
    expect(() => calculateInstallmentPlan(800, 120, 24)).toThrow();
    expect(() => calculateInstallmentPlan(800, 100, 10)).toThrow();
  });
});

