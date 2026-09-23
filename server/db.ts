import { and, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { IncompleteCheckoutLead, InsertIncompleteCheckoutLead, InsertInstallmentOrder, InsertUser, incompleteCheckoutLeads, installmentOrders, conversationMessages, conversations, customerPayments, customers, storeSettings, storedFiles, users, visitorSessions } from "../drizzle/schema";
import { ENV } from './_core/env';
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createInstallmentOrder(order: InsertInstallmentOrder) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(installmentOrders).values(order);
}

export async function getInstallmentOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(installmentOrders).orderBy(desc(installmentOrders.createdAt));
}

export async function createIncompleteCheckoutLead(lead: InsertIncompleteCheckoutLead) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(incompleteCheckoutLeads).values(lead);
}

export async function getIncompleteCheckoutLeads(): Promise<IncompleteCheckoutLead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incompleteCheckoutLeads).orderBy(desc(incompleteCheckoutLeads.createdAt));
}

export async function updateIncompleteCheckoutLeadStatus(
  id: number,
  status: "new" | "contacted" | "converted" | "closed",
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.update(incompleteCheckoutLeads).set({ status }).where(eq(incompleteCheckoutLeads.id, id));
}

export async function updateInstallmentOrderStatus(
  id: number,
  status: "new" | "under_review" | "approved" | "needs_contact" | "cancelled",
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.update(installmentOrders).set({ status }).where(eq(installmentOrders.id, id));
}

export async function reviewInstallmentPaymentProof(
  id: number,
  paymentProofStatus: "approved" | "rejected",
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.update(installmentOrders).set({ paymentProofStatus, paymentProofReviewedAt: new Date() }).where(eq(installmentOrders.id, id));
}

export async function getStoreSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, key)).limit(1);
    return rows[0]?.value ?? null;
  } catch (error) {
    console.warn("[Settings] read failed (run `pnpm db:push`?):", error);
    return null;
  }
}

export async function setStoreSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متصلة");
  try {
    await db.insert(storeSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  } catch (error) {
    console.error("[Settings] write failed:", error);
    throw new Error("تعذر حفظ الإعداد — تأكد من تشغيل pnpm db:push على الخادم");
  }
}

/** Applies pending SQL migrations from ./drizzle so a fresh database gets its tables on boot. */
export const migrationState: { status: "pending" | "ok" | "skipped" | "failed"; error: string | null; folder: string } = { status: "pending", error: null, folder: "" };

function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    const e = current as { message?: string; code?: string; cause?: unknown };
    parts.push([e.code, e.message].filter(Boolean).join(" "));
    current = e.cause;
  }
  return parts.join(" <- ");
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  if (!db) { migrationState.status = "skipped"; console.warn("[Database] DATABASE_URL not set; skipping migrations"); return; }
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  migrationState.folder = migrationsFolder;
  try {
    await migrate(db, { migrationsFolder });
    migrationState.status = "ok"; migrationState.error = null;
    console.log("[Database] Migrations up to date");
  } catch (error) {
    migrationState.status = "failed"; migrationState.error = describeError(error);
    console.error("[Database] Migration failed:", migrationState.error);
  }
}

export async function listTables(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(sql`SHOW TABLES`);
  return (rows as unknown as Record<string, unknown>[]).map(row => String(Object.values(row)[0]));
}

export async function saveStoredFile(file: { key: string; name: string; mimeType: string; data: Buffer }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متصلة");
  await db.insert(storedFiles).values({ ...file, size: file.data.length });
}

export async function getStoredFile(key: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(storedFiles).where(eq(storedFiles.key, key)).limit(1);
  return rows[0] ?? null;
}

/** Syria is UTC+3 all year, so "today" is computed against that offset rather than the server clock. */
const SYRIA_OFFSET_MS = 3 * 60 * 60 * 1000;
function startOfSyrianDay(daysAgo = 0): Date {
  const local = new Date(Date.now() + SYRIA_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - SYRIA_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000);
}

export async function recordVisitorSession(visit: {
  sessionId: string;
  device: "mobile" | "tablet" | "desktop";
  lastView: string;
  furthestStage: number;
  productTitle: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(visitorSessions).values(visit).onDuplicateKeyUpdate({
    set: {
      lastView: visit.lastView,
      productTitle: visit.productTitle,
      device: visit.device,
      furthestStage: sql`GREATEST(${visitorSessions.furthestStage}, ${visit.furthestStage})`,
      lastSeen: new Date(),
    },
  });
}

export async function getVisitorStats() {
  const db = await getDb();
  if (!db) return null;
  const today = startOfSyrianDay();
  const week = startOfSyrianDay(6);
  const [stages, devices, weekRows] = await Promise.all([
    db.select({ stage: visitorSessions.furthestStage, total: sql<number>`count(*)` })
      .from(visitorSessions).where(gte(visitorSessions.firstSeen, today)).groupBy(visitorSessions.furthestStage),
    db.select({ device: visitorSessions.device, total: sql<number>`count(*)` })
      .from(visitorSessions).where(gte(visitorSessions.firstSeen, today)).groupBy(visitorSessions.device),
    db.select({ total: sql<number>`count(*)` }).from(visitorSessions).where(gte(visitorSessions.firstSeen, week)),
  ]);
  const byStage: Record<number, number> = {};
  let todaySessions = 0;
  for (const row of stages) { const total = Number(row.total); byStage[row.stage] = total; todaySessions += total; }
  const byDevice: Record<string, number> = {};
  for (const row of devices) byDevice[row.device] = Number(row.total);
  return { todaySessions, byStage, byDevice, weekSessions: Number(weekRows[0]?.total ?? 0) };
}

/** Logs a WhatsApp chat as a follow-up. Repeated clicks in the same session update one row instead of piling up. */
export async function recordWhatsAppContact(contact: {
  sessionId: string;
  productTitle: string;
  productHandle: string | null;
  customerName: string;
  phone: string | null;
  province: string | null;
  downPaymentUsd: string;
  months: number;
  checkoutStep: "payment" | "delivery" | "eligibility";
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  const existing = await db.select({ id: incompleteCheckoutLeads.id })
    .from(incompleteCheckoutLeads)
    .where(and(eq(incompleteCheckoutLeads.sessionId, contact.sessionId), eq(incompleteCheckoutLeads.source, "whatsapp")))
    .limit(1);
  const row = { ...contact, source: "whatsapp" as const };
  if (existing[0]) {
    await db.update(incompleteCheckoutLeads).set(row).where(eq(incompleteCheckoutLeads.id, existing[0].id));
    return;
  }
  await db.insert(incompleteCheckoutLeads).values({ ...row, status: "new", consentAt: null });
}

export async function findConversationByLead(leadId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(conversations).where(eq(conversations.leadId, leadId)).limit(1);
  return rows[0] ?? null;
}

export async function createConversation(input: { token: string; leadId: number | null; orderId: number | null; customerName: string; phone: string | null; productTitle: string; customerId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(conversations).values(input);
  const rows = await db.select().from(conversations).where(eq(conversations.token, input.token)).limit(1);
  return rows[0]!;
}

export async function getConversationByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(conversations).where(eq(conversations.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function listConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(conversationMessages.createdAt);
}

export async function addConversationMessage(input: { conversationId: number; sender: "admin" | "customer"; body: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(conversationMessages).values({ ...input, readByAdmin: input.sender === "admin" ? "yes" : "no" });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, input.conversationId));
}

export async function markConversationRead(conversationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversationMessages).set({ readByAdmin: "yes" })
    .where(and(eq(conversationMessages.conversationId, conversationId), eq(conversationMessages.sender, "customer")));
}

/** Threads with the number of customer messages the admin has not read yet. */
export async function listConversationsWithUnread() {
  const db = await getDb();
  if (!db) return [];
  const threads = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  const unread = await db.select({ conversationId: conversationMessages.conversationId, total: sql<number>`count(*)` })
    .from(conversationMessages)
    .where(and(eq(conversationMessages.sender, "customer"), eq(conversationMessages.readByAdmin, "no")))
    .groupBy(conversationMessages.conversationId);
  const map = new Map(unread.map(row => [row.conversationId, Number(row.total)]));
  return threads.map(thread => ({ ...thread, unread: map.get(thread.id) ?? 0 }));
}

export async function createCustomer(input: { phone: string; name: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(customers).values(input);
  const rows = await db.select().from(customers).where(eq(customers.phone, input.phone)).limit(1);
  return rows[0]!;
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  return rows[0] ?? null;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function touchCustomerLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, id));
}

/** Everything the store already knows about this phone number, newest first. */
export async function getCustomerRecords(phone: string) {
  const db = await getDb();
  if (!db) return { orders: [], leads: [] };
  const [orders, leads] = await Promise.all([
    db.select().from(installmentOrders).where(eq(installmentOrders.phone, phone)).orderBy(desc(installmentOrders.createdAt)),
    db.select().from(incompleteCheckoutLeads).where(eq(incompleteCheckoutLeads.phone, phone)).orderBy(desc(incompleteCheckoutLeads.createdAt)),
  ]);
  return { orders, leads };
}

export async function findConversationByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(conversations).where(eq(conversations.customerId, customerId)).limit(1);
  return rows[0] ?? null;
}

/** Attaches threads already opened for this phone's follow-ups to the new account. */
export async function linkConversationsToCustomer(customerId: number, leadIds: number[]) {
  const db = await getDb();
  if (!db || leadIds.length === 0) return;
  for (const leadId of leadIds) {
    await db.update(conversations).set({ customerId }).where(eq(conversations.leadId, leadId));
  }
}

export async function createCustomerPayment(input: {
  customerId: number; amountUsd: string; fileKey: string; fileName: string; mimeType: string;
  status: "pending" | "approved" | "rejected"; note: string | null; verifiedBy: "auto" | "admin" | null;
  transactionRef: string | null; receiptAt: Date | null; recipientName: string | null; receiptAmountUsd: string | null;
  fileHash?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.insert(customerPayments).values({ ...input, reviewedAt: input.status === "pending" ? null : new Date() });
}

/** True when this transaction number already backs a receipt that was not rejected. */
export async function transactionRefInUse(ref: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: customerPayments.id }).from(customerPayments)
    .where(and(eq(customerPayments.transactionRef, ref), sql`${customerPayments.status} <> 'rejected'`)).limit(1);
  return rows.length > 0;
}

export async function listCustomerPayments(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerPayments).where(eq(customerPayments.customerId, customerId)).orderBy(desc(customerPayments.createdAt));
}

/**
 * Chat opens once a receipt is on file that passed the automatic checks (or the admin's review):
 * either uploaded from the account page, or attached to an order placed with this phone number.
 */
export async function customerChatUnlocked(customerId: number): Promise<boolean> {
  const customer = await getCustomerById(customerId);
  if (!customer) return false;
  const payments = await listCustomerPayments(customerId);
  if (payments.some(payment => payment.status !== "rejected")) return true;
  const { orders } = await getCustomerRecords(customer.phone);
  return orders.some(order => order.paymentProofKey && order.paymentProofStatus !== "rejected");
}

export async function proofHashInUse(hash: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [orders, payments] = await Promise.all([
    db.select({ id: installmentOrders.id }).from(installmentOrders)
      .where(and(eq(installmentOrders.paymentProofHash, hash), sql`${installmentOrders.paymentProofStatus} <> 'rejected'`)).limit(1),
    db.select({ id: customerPayments.id }).from(customerPayments)
      .where(and(eq(customerPayments.fileHash, hash), sql`${customerPayments.status} <> 'rejected'`)).limit(1),
  ]);
  return orders.length > 0 || payments.length > 0;
}

export async function getInstallmentOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(installmentOrders).where(eq(installmentOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listAllCustomerPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: customerPayments.id, customerId: customerPayments.customerId, amountUsd: customerPayments.amountUsd,
    fileKey: customerPayments.fileKey, fileName: customerPayments.fileName, mimeType: customerPayments.mimeType,
    status: customerPayments.status, note: customerPayments.note, reviewedAt: customerPayments.reviewedAt,
    transactionRef: customerPayments.transactionRef, receiptAt: customerPayments.receiptAt, recipientName: customerPayments.recipientName,
    receiptAmountUsd: customerPayments.receiptAmountUsd, verifiedBy: customerPayments.verifiedBy,
    createdAt: customerPayments.createdAt, customerName: customers.name, customerPhone: customers.phone,
  }).from(customerPayments)
    .innerJoin(customers, eq(customers.id, customerPayments.customerId))
    .orderBy(desc(customerPayments.createdAt));
}

export async function reviewCustomerPayment(id: number, status: "approved" | "rejected", note: string | null) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  await db.update(customerPayments).set({ status, note, reviewedAt: new Date(), verifiedBy: "admin" }).where(eq(customerPayments.id, id));
}

/** Records that look like test data: matched by phone or by a name fragment. Never deletes by itself. */
export async function previewTestData(input: { phones: string[]; nameFragments: string[]; sessionPrefixes: string[] }) {
  const db = await getDb();
  if (!db) return { orders: [], leads: [], customers: [], payments: [], conversations: [], visitorSessions: 0 };
  const nameOr = (col: any) => or(...input.nameFragments.map(f => like(col, `%${f}%`)));
  const orders = await db.select({ id: installmentOrders.id, orderNumber: installmentOrders.orderNumber, customerName: installmentOrders.customerName, phone: installmentOrders.phone, productTitle: installmentOrders.productTitle, status: installmentOrders.status })
    .from(installmentOrders).where(or(inArray(installmentOrders.phone, input.phones.length ? input.phones : ["-"]), nameOr(installmentOrders.customerName)));
  const leads = await db.select({ id: incompleteCheckoutLeads.id, customerName: incompleteCheckoutLeads.customerName, phone: incompleteCheckoutLeads.phone, productTitle: incompleteCheckoutLeads.productTitle })
    .from(incompleteCheckoutLeads).where(or(inArray(incompleteCheckoutLeads.phone, input.phones.length ? input.phones : ["-"]), nameOr(incompleteCheckoutLeads.customerName)));
  const custs = await db.select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers).where(or(inArray(customers.phone, input.phones.length ? input.phones : ["-"]), nameOr(customers.name)));
  const custIds = custs.map(c => c.id);
  const payments = custIds.length ? await db.select({ id: customerPayments.id, customerId: customerPayments.customerId, status: customerPayments.status }).from(customerPayments).where(inArray(customerPayments.customerId, custIds)) : [];
  const convs = await db.select({ id: conversations.id, customerName: conversations.customerName, customerId: conversations.customerId, leadId: conversations.leadId })
    .from(conversations).where(or(custIds.length ? inArray(conversations.customerId, custIds) : sql`0`, leads.length ? inArray(conversations.leadId, leads.map(l => l.id)) : sql`0`, nameOr(conversations.customerName)));
  const [vs] = await db.select({ total: sql<number>`count(*)` }).from(visitorSessions)
    .where(or(...input.sessionPrefixes.map(p => like(visitorSessions.sessionId, `${p}%`))));
  return { orders, leads, customers: custs, payments, conversations: convs, visitorSessions: Number(vs?.total ?? 0) };
}

/** Deletes exactly the ids given, with their dependent rows and stored files. */
export async function purgeRecords(input: { orderIds: number[]; leadIds: number[]; customerIds: number[]; conversationIds: number[]; sessionPrefixes: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  const removed = { orders: 0, leads: 0, customers: 0, payments: 0, conversations: 0, messages: 0, files: 0, visitorSessions: 0 };
  const fileKeys: string[] = [];

  if (input.orderIds.length) {
    const rows = await db.select({ p: installmentOrders.paymentProofKey, i: installmentOrders.identityDocumentKey }).from(installmentOrders).where(inArray(installmentOrders.id, input.orderIds));
    rows.forEach(r => { if (r.p) fileKeys.push(r.p); if (r.i) fileKeys.push(r.i); });
    const res = await db.delete(installmentOrders).where(inArray(installmentOrders.id, input.orderIds));
    removed.orders = Number((res as any)[0]?.affectedRows ?? input.orderIds.length);
  }
  if (input.customerIds.length) {
    const pays = await db.select({ id: customerPayments.id, key: customerPayments.fileKey }).from(customerPayments).where(inArray(customerPayments.customerId, input.customerIds));
    pays.forEach(p => fileKeys.push(p.key));
    if (pays.length) { await db.delete(customerPayments).where(inArray(customerPayments.id, pays.map(p => p.id))); removed.payments = pays.length; }
    const convs = await db.select({ id: conversations.id }).from(conversations).where(inArray(conversations.customerId, input.customerIds));
    input.conversationIds.push(...convs.map(c => c.id));
    await db.delete(customers).where(inArray(customers.id, input.customerIds));
    removed.customers = input.customerIds.length;
  }
  if (input.leadIds.length) {
    const convs = await db.select({ id: conversations.id }).from(conversations).where(inArray(conversations.leadId, input.leadIds));
    input.conversationIds.push(...convs.map(c => c.id));
    await db.delete(incompleteCheckoutLeads).where(inArray(incompleteCheckoutLeads.id, input.leadIds));
    removed.leads = input.leadIds.length;
  }
  const convIds = Array.from(new Set(input.conversationIds));
  if (convIds.length) {
    const msgs = await db.select({ id: conversationMessages.id }).from(conversationMessages).where(inArray(conversationMessages.conversationId, convIds));
    if (msgs.length) await db.delete(conversationMessages).where(inArray(conversationMessages.conversationId, convIds));
    await db.delete(conversations).where(inArray(conversations.id, convIds));
    removed.messages = msgs.length; removed.conversations = convIds.length;
  }
  if (fileKeys.length) {
    await db.delete(storedFiles).where(inArray(storedFiles.key, fileKeys));
    removed.files = fileKeys.length;
  }
  if (input.sessionPrefixes.length) {
    const rows = await db.select({ id: visitorSessions.id }).from(visitorSessions).where(or(...input.sessionPrefixes.map(p => like(visitorSessions.sessionId, `${p}%`))));
    if (rows.length) await db.delete(visitorSessions).where(inArray(visitorSessions.id, rows.map(r => r.id)));
    removed.visitorSessions = rows.length;
  }
  return removed;
}

export async function countAll() {
  const db = await getDb();
  if (!db) return null;
  const c = async (t: any) => Number((await db.select({ n: sql<number>`count(*)` }).from(t))[0]?.n ?? 0);
  return { orders: await c(installmentOrders), leads: await c(incompleteCheckoutLeads), customers: await c(customers), payments: await c(customerPayments), conversations: await c(conversations), messages: await c(conversationMessages), files: await c(storedFiles), visitorSessions: await c(visitorSessions) };
}
