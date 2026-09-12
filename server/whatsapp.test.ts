import { describe, expect, it } from "vitest";
import { createWhatsAppOrderLink, SHAM_CASH_WHATSAPP_NUMBER } from "../shared/whatsapp";

describe("createWhatsAppOrderLink", () => {
  it("builds an international WhatsApp link with the payment details", () => {
    const link = createWhatsAppOrderLink({
      customerName: "أحمد محمد",
      productTitle: "iPhone 17 Pro Max",
      downPaymentUsd: 100,
      months: 24,
      monthlyInstallmentUsd: 45.79,
    });

    const url = new URL(link);
    expect(SHAM_CASH_WHATSAPP_NUMBER).toBe("963990999462");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe(`/${SHAM_CASH_WHATSAPP_NUMBER}`);
    expect(url.searchParams.get("text")).toContain("الاسم: أحمد محمد");
    expect(url.searchParams.get("text")).toContain("الهاتف المطلوب: iPhone 17 Pro Max");
    expect(url.searchParams.get("text")).toContain("قيمة الدفعة الأولى: $100");
    expect(url.searchParams.get("text")).toContain("مدة التقسيط: 24 شهراً");
  });
});
