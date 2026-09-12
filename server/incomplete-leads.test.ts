import { describe, expect, it } from "vitest";
import { incompleteLeadInput } from "./routers/orders";

describe("incomplete checkout lead input", () => {
  const validInput = {
    productTitle: "iPhone 17 Pro Max",
    customerName: "أحمد محمد",
    phone: "0991234567",
    province: "دمشق",
    downPaymentUsd: 100 as const,
    months: 24,
    checkoutStep: "payment" as const,
    consent: true as const,
  };

  it("accepts the minimal consent-based contact record", () => {
    const parsed = incompleteLeadInput.parse(validInput);
    expect(parsed.customerName).toBe("أحمد محمد");
    expect(parsed.consent).toBe(true);
    expect(parsed).not.toHaveProperty("identityDocument");
    expect(parsed).not.toHaveProperty("paymentProof");
  });

  it("rejects saving without explicit consent", () => {
    expect(() => incompleteLeadInput.parse({ ...validInput, consent: false })).toThrow();
  });

  it("rejects missing contact fields", () => {
    expect(() => incompleteLeadInput.parse({ ...validInput, phone: "" })).toThrow();
    expect(() => incompleteLeadInput.parse({ ...validInput, province: "" })).toThrow();
  });
});
