import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { IncompleteCheckoutLead, InsertIncompleteCheckoutLead, InsertInstallmentOrder, InsertUser, incompleteCheckoutLeads, installmentOrders, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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
