import { customType, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const longblob = customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return "longblob"; } });

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

export const storeSettings = mysqlTable("storeSettings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InsertUser = typeof users.$inferInsert;

export const installmentOrders = mysqlTable("installmentOrders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 48 }).notNull().unique(),
  userId: int("userId"),
  shopifyCartId: varchar("shopifyCartId", { length: 255 }),
  productTitle: varchar("productTitle", { length: 255 }).notNull(),
  productHandle: varchar("productHandle", { length: 255 }),
  gift: varchar("gift", { length: 120 }).notNull(),
  priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }).notNull(),
  priceSyp: decimal("priceSyp", { precision: 14, scale: 0 }).notNull(),
  downPaymentUsd: decimal("downPaymentUsd", { precision: 10, scale: 2 }).notNull(),
  downPaymentSyp: decimal("downPaymentSyp", { precision: 14, scale: 0 }).notNull(),
  discountPercent: int("discountPercent").default(0).notNull(),
  months: int("months").notNull(),
  monthlyInstallmentUsd: decimal("monthlyInstallmentUsd", { precision: 10, scale: 2 }).notNull(),
  monthlyInstallmentSyp: decimal("monthlyInstallmentSyp", { precision: 14, scale: 0 }).notNull(),
  eligibilityStatus: mysqlEnum("eligibilityStatus", ["eligible", "review_required"]).notNull(),
  status: mysqlEnum("status", ["new", "under_review", "approved", "needs_contact", "cancelled"]).default("new").notNull(),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  age: int("age").notNull(),
  jobNature: varchar("jobNature", { length: 160 }).notNull(),
  hasExistingInstallments: mysqlEnum("hasExistingInstallments", ["yes", "no"]).default("no").notNull(),
  identityDocumentType: mysqlEnum("identityDocumentType", ["syrian_id", "passport", "residence_permit", "driving_license"]),
  identityDocumentKey: varchar("identityDocumentKey", { length: 512 }),
  identityDocumentName: varchar("identityDocumentName", { length: 255 }),
  identityDocumentMimeType: varchar("identityDocumentMimeType", { length: 120 }),
  province: varchar("province", { length: 80 }).notNull(),
  area: varchar("area", { length: 120 }).notNull(),
  landmark: varchar("landmark", { length: 255 }),
  recipientName: varchar("recipientName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  alternatePhone: varchar("alternatePhone", { length: 32 }),
  paymentMethod: mysqlEnum("paymentMethod", ["sham_cash"]).notNull(),
  paymentProofKey: varchar("paymentProofKey", { length: 512 }),
  paymentProofUrl: varchar("paymentProofUrl", { length: 512 }),
  paymentProofName: varchar("paymentProofName", { length: 255 }),
  paymentProofMimeType: varchar("paymentProofMimeType", { length: 120 }),
  paymentProofStatus: mysqlEnum("paymentProofStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  paymentProofReviewedAt: timestamp("paymentProofReviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstallmentOrder = typeof installmentOrders.$inferSelect;
export type InsertInstallmentOrder = typeof installmentOrders.$inferInsert;

/** Minimal, consent-based lead record for a checkout that was not completed. */
export const incompleteCheckoutLeads = mysqlTable("incompleteCheckoutLeads", {
  id: int("id").autoincrement().primaryKey(),
  productTitle: varchar("productTitle", { length: 255 }).notNull(),
  productHandle: varchar("productHandle", { length: 255 }),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  /** Null for WhatsApp contacts: the customer writes from their own number before reaching the delivery form. */
  phone: varchar("phone", { length: 32 }),
  province: varchar("province", { length: 80 }),
  downPaymentUsd: decimal("downPaymentUsd", { precision: 10, scale: 2 }).notNull(),
  months: int("months").notNull(),
  checkoutStep: mysqlEnum("checkoutStep", ["payment", "delivery", "eligibility"]).default("payment").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "converted", "closed"]).default("new").notNull(),
  /** "whatsapp" rows are logged when the customer opens a chat instead of finishing the form. */
  source: mysqlEnum("source", ["form", "whatsapp"]).default("form").notNull(),
  /** Browsing session, used to keep repeated WhatsApp clicks as a single follow-up. */
  sessionId: varchar("sessionId", { length: 64 }),
  consentAt: timestamp("consentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IncompleteCheckoutLead = typeof incompleteCheckoutLeads.$inferSelect;
export type InsertIncompleteCheckoutLead = typeof incompleteCheckoutLeads.$inferInsert;

/** Customer uploads (identity documents, payment proofs). Served to admins only via /api/files/<key>. */
export const storedFiles = mysqlTable("storedFiles", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 512 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  size: int("size").notNull(),
  data: longblob("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StoredFile = typeof storedFiles.$inferSelect;

/** One row per browsing session, for daily visitor stats. No personal data is stored. */
export const visitorSessions = mysqlTable("visitorSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  device: mysqlEnum("device", ["mobile", "tablet", "desktop"]).notNull(),
  lastView: varchar("lastView", { length: 64 }).notNull(),
  /** Furthest funnel step reached, as an index into PRESENCE_STEPS. */
  furthestStage: int("furthestStage").default(0).notNull(),
  productTitle: varchar("productTitle", { length: 255 }),
  firstSeen: timestamp("firstSeen").defaultNow().notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().onUpdateNow().notNull(),
});
export type VisitorSession = typeof visitorSessions.$inferSelect;

/**
 * A private message thread with one customer, opened by the admin from the panel.
 * The customer reaches it through a secret token in the URL, so no account is needed.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  /** Unguessable secret that stands in for a login. */
  token: varchar("token", { length: 48 }).notNull().unique(),
  leadId: int("leadId"),
  orderId: int("orderId"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  productTitle: varchar("productTitle", { length: 255 }).notNull(),
  closed: mysqlEnum("closed", ["no", "yes"]).default("no").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;

export const conversationMessages = mysqlTable("conversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  sender: mysqlEnum("sender", ["admin", "customer"]).notNull(),
  body: varchar("body", { length: 2000 }).notNull(),
  readByAdmin: mysqlEnum("readByAdmin", ["no", "yes"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConversationMessage = typeof conversationMessages.$inferSelect;
