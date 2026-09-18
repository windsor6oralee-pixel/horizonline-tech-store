// Customer uploads are stored in MySQL (storedFiles) and served to admins only via /api/files/<key>.
import { saveStoredFile } from "./db";

export const FILE_ROUTE_PREFIX = "/api/files/";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function fileUrl(key: string): string {
  return FILE_ROUTE_PREFIX + key.split("/").map(encodeURIComponent).join("/");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await saveStoredFile({ key, name: key.split("/").pop() ?? key, mimeType: contentType, data: buffer });
  return { key, url: fileUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: fileUrl(key) };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  return fileUrl(normalizeKey(relKey));
}
