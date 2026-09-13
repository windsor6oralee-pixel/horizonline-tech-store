import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { ordersRouter } from "./orders";

const { createInstallmentOrderMock, createIncompleteCheckoutLeadMock, getIncompleteCheckoutLeadsMock, getInstallmentOrdersMock, incompleteLeadStore, reviewInstallmentPaymentProofMock, updateIncompleteCheckoutLeadStatusMock } = vi.hoisted(() => {
  const incompleteLeadStore: Array<Record<string, unknown>> = [];
  return {
    createInstallmentOrderMock: vi.fn(),
    createIncompleteCheckoutLeadMock: vi.fn(),
    getIncompleteCheckoutLeadsMock: vi.fn(),
    getInstallmentOrdersMock: vi.fn(),
    incompleteLeadStore,
    reviewInstallmentPaymentProofMock: vi.fn(),
    updateIncompleteCheckoutLeadStatusMock: vi.fn(),
  };
});
const { storagePutMock } = vi.hoisted(() => ({ storagePutMock: vi.fn() }));

vi.mock("../db", () => ({
  createInstallmentOrder: createInstallmentOrderMock,
  createIncompleteCheckoutLead: createIncompleteCheckoutLeadMock,
  getIncompleteCheckoutLeads: getIncompleteCheckoutLeadsMock,
  getInstallmentOrders: getInstallmentOrdersMock,
  reviewInstallmentPaymentProof: reviewInstallmentPaymentProofMock,
  updateIncompleteCheckoutLeadStatus: updateIncompleteCheckoutLeadStatusMock,
  updateInstallmentOrderStatus: vi.fn(),
}));
vi.mock("../storage", () => ({ storagePut: storagePutMock }));

const validOrder = {
  productTitle: "iPhone 16 Pro",
  productHandle: "iphone-16-pro",
  gift: "غطاء حماية فاخر",
  priceUsd: 999,
  downPaymentUsd: 150 as const,
  months: 24,
  fullName: "أحمد محمد علي",
  age: 27,
  jobNature: "موظف حكومي" as const,
  hasExistingInstallments: "no" as const,
  identityDocument: { documentType: "syrian_id" as const, fileName: "syrian-id.png", mimeType: "image/png" as const, dataUrl: "data:image/png;base64,aGVsbG8=" },
  province: "دمشق",
  area: "المزة",
  recipientName: "أحمد محمد علي",
  phone: "0999999999",
  paymentMethod: "sham_cash" as const,
  paymentProof: { fileName: "sham-cash-receipt.png", mimeType: "image/png" as const, dataUrl: "data:image/png;base64,aGVsbG8=" },
};

function guestContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function adminContext(): TrpcContext {
  return {
    user: { id: 1, openId: "appl-admin", email: "admin@appl.sy", name: "مدير Appl", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("orders.submit", () => {
  beforeEach(() => {
    createInstallmentOrderMock.mockReset().mockResolvedValue(undefined);
    storagePutMock.mockReset().mockResolvedValue({ key: "payment-proofs/receipt.png", url: "/manus-storage/payment-proofs/receipt.png" });
    reviewInstallmentPaymentProofMock.mockReset().mockResolvedValue(undefined);
  });

  it("يحفظ طلباً صالحاً مع حساب خصم دفعة 150$", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    const result = await caller.submit(validOrder);

    expect(result.status).toBe("new");
    expect(result.orderNumber).toMatch(/^HZ-/);
    expect(result.plan.discountPercent).toBe(10);
    expect(result.plan.monthlyUsd).toBeCloseTo(31.21, 2);
    expect(createInstallmentOrderMock).toHaveBeenCalledWith(expect.objectContaining({
      customerName: validOrder.fullName,
      paymentMethod: "sham_cash",
      paymentProofStatus: "pending",
      hasExistingInstallments: "no",
      identityDocumentType: "syrian_id",
      status: "new",
    }));
  });

  it("يرفض العمر دون 18 عاماً", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.submit({ ...validOrder, age: 17 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يرفض دفعة أولى ومدة تقسيط خارج السياسة", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.submit({ ...validOrder, downPaymentUsd: 125 as 100 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.submit({ ...validOrder, months: 10 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يرفض غياب الحقول الإلزامية وطريقة دفع غير مدعومة", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.submit({ ...validOrder, fullName: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.submit({ ...validOrder, paymentMethod: "visa" as "sham_cash" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يرفض إثباتاً لا يطابق صيغة شام كاش المسموح بها", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.submit({ ...validOrder, paymentProof: { ...validOrder.paymentProof, dataUrl: "data:text/plain;base64,aGVsbG8=" } })).rejects.toBeDefined();
  });

  it("يرفض وثيقة هوية غير صالحة أو إجابة التزامات خارج الخيارات", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.submit({ ...validOrder, identityDocument: { ...validOrder.identityDocument, dataUrl: "data:text/plain;base64,aGVsbG8=" } })).rejects.toBeDefined();
    await expect(caller.submit({ ...validOrder, hasExistingInstallments: "unknown" as "no" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("orders.list", () => {
  it("يعرض للمدير الطلبات التي يعيدها مخزن الطلبات", async () => {
    getInstallmentOrdersMock.mockResolvedValueOnce([
      { id: 1, orderNumber: "HZ-TEST", customerName: "أحمد محمد", productTitle: "iPhone 17 Pro", identityDocumentKey: null },
    ]);

    const caller = ordersRouter.createCaller(adminContext());
    await expect(caller.list()).resolves.toMatchObject([
      { id: 1, orderNumber: "HZ-TEST", customerName: "أحمد محمد", productTitle: "iPhone 17 Pro", identityDocumentUrl: null },
    ]);
  });

  it("يمنع الزائر من عرض الطلبات", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("orders.incomplete checkout leads", () => {
  const validLead = {
    productTitle: "iPhone 17 Pro Max",
    customerName: "أحمد محمد علي",
    phone: "0999999999",
    province: "دمشق",
    downPaymentUsd: 100 as const,
    months: 24,
    checkoutStep: "payment" as const,
    consent: true as const,
  };

  beforeEach(() => {
    incompleteLeadStore.length = 0;
    createIncompleteCheckoutLeadMock.mockReset().mockImplementation(async (record: Record<string, unknown>) => { incompleteLeadStore.push({ id: incompleteLeadStore.length + 1, ...record, createdAt: new Date(), updatedAt: new Date() }); });
    getIncompleteCheckoutLeadsMock.mockReset().mockImplementation(async () => incompleteLeadStore);
    updateIncompleteCheckoutLeadStatusMock.mockReset().mockResolvedValue(undefined);
  });

  it("يحفظ الحد الأدنى من البيانات بعد موافقة العميل", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.saveIncomplete(validLead)).resolves.toEqual({ success: true });
    expect(createIncompleteCheckoutLeadMock).toHaveBeenCalledWith(expect.objectContaining({
      customerName: validLead.customerName,
      phone: validLead.phone,
      province: validLead.province,
      productTitle: validLead.productTitle,
      status: "new",
    }));
    const savedRecord = createIncompleteCheckoutLeadMock.mock.calls[0][0];
    expect(savedRecord).not.toHaveProperty("identityDocument");
    expect(savedRecord).not.toHaveProperty("paymentProof");
  });

  it("يحفظ السجل ثم يعرضه للمدير في المسار نفسه", async () => {
    const guest = ordersRouter.createCaller(guestContext());
    const admin = ordersRouter.createCaller(adminContext());
    await guest.saveIncomplete(validLead);
    const leads = await admin.incompleteList();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ customerName: validLead.customerName, productTitle: validLead.productTitle, status: "new" });
  });

  it("يعرض السجل للمدير فقط ويحدّث حالته", async () => {
    const caller = ordersRouter.createCaller(adminContext());
    incompleteLeadStore.push({ id: 9, ...validLead, status: "new", consentAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
    await expect(caller.incompleteList()).resolves.toHaveLength(1);
    await expect(caller.updateIncompleteStatus({ id: 9, status: "contacted" })).resolves.toEqual({ success: true });
    expect(updateIncompleteCheckoutLeadStatusMock).toHaveBeenCalledWith(9, "contacted");
  });

  it("يمنع الزائر من عرض المتابعات أو تعديلها", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.incompleteList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.updateIncompleteStatus({ id: 9, status: "closed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("orders.reviewPaymentProof", () => {
  it("يسمح للمدير باعتماد إثبات السداد", async () => {
    const caller = ordersRouter.createCaller(adminContext());
    await expect(caller.reviewPaymentProof({ id: 25, decision: "approved" })).resolves.toEqual({ success: true });
    expect(reviewInstallmentPaymentProofMock).toHaveBeenCalledWith(25, "approved");
  });

  it("يمنع الزائر من مراجعة إثبات السداد", async () => {
    const caller = ordersRouter.createCaller(guestContext());
    await expect(caller.reviewPaymentProof({ id: 25, decision: "rejected" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
