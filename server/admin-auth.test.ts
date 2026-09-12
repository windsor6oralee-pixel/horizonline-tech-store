import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { validateAdminCredentials, ADMIN_SESSION_COOKIE } from "./adminAuth";
import type { TrpcContext } from "./_core/context";

describe("admin password login", () => {
  it("accepts configured credentials and creates an admin session cookie", async () => {
    const username = process.env.ADMIN_USERNAME ?? "";
    const password = process.env.ADMIN_PASSWORD ?? "";
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        cookie: (name: string, value: string) => cookies.push({ name, value }),
      } as TrpcContext["res"],
    };

    expect(validateAdminCredentials(username, password)).toBe(true);
    const result = await appRouter.createCaller(ctx).adminAuth.login({ username, password });

    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.name).toBe(ADMIN_SESSION_COOKIE);
    expect(cookies[0]?.value).toBeTruthy();
  });
});
