import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createWhatsAppOrderLink } from "../shared/whatsapp";

const checkoutSource = readFileSync(new URL("../client/src/pages/CheckoutWizard.tsx", import.meta.url), "utf8");
const whatsappSource = readFileSync(new URL("../shared/whatsapp.ts", import.meta.url), "utf8");

describe("PaymentStep WhatsApp contract", () => {
  it("uses the generated WhatsApp link for the payment action", () => {
    expect(checkoutSource).toContain("const whatsappLink = createWhatsAppOrderLink({");
    expect(checkoutSource).toContain('href={whatsappLink}');
    expect(checkoutSource).toContain("ادفع الآن عبر واتساب");
    expect(whatsappSource).toContain('SHAM_CASH_WHATSAPP_NUMBER = "96395968133"');
    const generatedHref = createWhatsAppOrderLink({ customerName: "أحمد محمد", productTitle: "iPhone 17 Pro Max", downPaymentUsd: 100, months: 24, monthlyInstallmentUsd: 45.79 });
    expect(new URL(generatedHref).origin).toBe("https://wa.me");
    expect(new URL(generatedHref).pathname).toBe("/96395968133");
    expect(checkoutSource).toContain('<a href={whatsappLink}');
  });
});
