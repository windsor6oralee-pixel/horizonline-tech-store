import { createHash } from "node:crypto";

export const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

/** Reads pixel dimensions from the file header; null if the bytes are not a recognisable image. */
export function imageDimensions(bytes: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png" && bytes.length > 24 && bytes.toString("ascii", 1, 4) === "PNG") {
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    }
    if (mimeType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let i = 2;
      while (i + 9 < bytes.length) {
        if (bytes[i] !== 0xff) { i++; continue; }
        const marker = bytes[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
        }
        i += 2 + bytes.readUInt16BE(i + 2);
      }
      return null;
    }
    if (mimeType === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
      const chunk = bytes.toString("ascii", 12, 16);
      if (chunk === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
      if (chunk === "VP8L") { const b = bytes.readUInt32LE(21); return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) }; }
      if (chunk === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    }
  } catch { /* fall through */ }
  return null;
}

/**
 * Checks that can run with no external service: the upload must really be an image of a
 * plausible receipt size. Returns a customer-facing reason or null when it passes.
 */
export function localReceiptProblem(bytes: Buffer, mimeType: string): string | null {
  if (mimeType === "application/pdf") return bytes.toString("ascii", 0, 5) === "%PDF-" ? null : "الملف ليس PDF صالحاً.";
  const dims = imageDimensions(bytes, mimeType);
  if (!dims) return "الملف ليس صورة صالحة — ارفع لقطة الشاشة الأصلية لعملية التحويل.";
  if (dims.width < 300 || dims.height < 300) return "الصورة صغيرة جداً لقراءتها — ارفع لقطة الشاشة الأصلية بدقتها الكاملة.";
  return null;
}
