import { jwtVerify, SignJWT } from "jose";
import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

export const ADMIN_SESSION_COOKIE = "appl_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function validateAdminCredentials(username: string, password: string) {
  return Boolean(ENV.adminUsername && ENV.adminPassword && username === ENV.adminUsername && password === ENV.adminPassword);
}

export async function createAdminSession() {
  if (!ENV.cookieSecret) throw new Error("JWT secret is not configured");
  return new SignJWT({ kind: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("local-admin")
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAdminSession(token?: string) {
  if (!token || !ENV.cookieSecret) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.kind === "admin" && payload.sub === "local-admin";
  } catch {
    return false;
  }
}

export function adminUser(): User {
  const now = new Date();
  return {
    id: 0,
    openId: "local-admin",
    name: ENV.adminUsername || "admin",
    email: null,
    loginMethod: "admin-password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
