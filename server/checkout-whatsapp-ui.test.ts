import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createWhatsAppOrderLink } from "../shared/whatsapp";

const checkoutSource = readFileSync(new URL("../client/src/pages/CheckoutWizard.tsx", import.meta.url), "utf8");
const paymentStep = checkoutSource.slice(checkoutSource.indexOf("function PaymentStep"), checkoutSource.indexOf("\nfunction ", checkoutSource.indexOf("function PaymentStep") + 10));

describe("PaymentStep payment contract", () => {
  it("pays through the Sham Cash wallet panel, not a WhatsApp link", () => {
    expect(paymentStep).toContain("trpc.settings.paymentGate.useMutation");
    expect(paymentStep).toContain("الدفع عبر شام كاش");
    expect(paymentStep).toContain("wallet.qrDataUrl");
    expect(paymentStep).not.toContain("href={whatsappLink}");
    expect(paymentStep).not.toContain("ادفع الآن عبر واتساب");
  });
  it("still builds a valid WhatsApp link for enquiries", () => {
    const href = createWhatsAppOrderLink({ customerName: "أحمد محمد", productTitle: "iPhone 17 Pro Max", downPaymentUsd: 100, months: 24, monthlyInstallmentUsd: 45.79 });
    expect(new URL(href).origin).toBe("https://wa.me");
    expect(new URL(href).pathname).toBe("/12727462228");
  });
});
