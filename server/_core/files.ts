import { parse as parseCookieHeader } from "cookie";
import type { Express } from "express";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "../adminAuth";
import { getStoredFile } from "../db";
import { sdk } from "./sdk";

/** Serves customer uploads from MySQL to authenticated admins only. */
export function registerFileRoutes(app: Express) {
  app.get("/api/files/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0] ?? "";
    if (!key) { res.status(400).send("Missing file key"); return; }

    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    let allowed = await verifyAdminSession(cookies[ADMIN_SESSION_COOKIE]);
    if (!allowed) {
      try { allowed = (await sdk.authenticateRequest(req)).role === "admin"; } catch { allowed = false; }
    }
    if (!allowed) { res.status(403).send("Forbidden"); return; }

    const file = await getStoredFile(key);
    if (!file) { res.status(404).send("Not found"); return; }
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", String(file.size));
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(file.data);
  });
}
