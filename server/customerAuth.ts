import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { jwtVerify, SignJWT } from "jose";
import { ENV } from "./_core/env";

export const CUSTOMER_SESSION_COOKIE = "hz_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  // Lengths must match before timingSafeEqual, which throws otherwise.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function createCustomerSession(customerId: number): Promise<string> {
  if (!ENV.cookieSecret) throw new Error("JWT secret is not configured");
  return new SignJWT({ kind: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(customerId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyCustomerSession(token?: string): Promise<number | null> {
  if (!token || !ENV.cookieSecret) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== "customer") return null;
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE_MS = SESSION_TTL_SECONDS * 1000;
