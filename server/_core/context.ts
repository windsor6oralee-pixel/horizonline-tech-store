import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import { ADMIN_SESSION_COOKIE, adminUser, verifyAdminSession } from "../adminAuth";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "../customerAuth";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  customerId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  if (!user) {
    const adminSession = parseCookieHeader(opts.req.headers.cookie ?? "")[ADMIN_SESSION_COOKIE];
    if (await verifyAdminSession(adminSession)) user = adminUser();
  }

  const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
  const customerId = await verifyCustomerSession(cookies[CUSTOMER_SESSION_COOKIE]);

  return {
    req: opts.req,
    res: opts.res,
    user,
    customerId,
  };
}
