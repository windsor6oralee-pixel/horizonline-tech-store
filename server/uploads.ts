const DATA_URL = /^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=]+)$/;

/** Decodes a browser data URL, checking the declared type and a size ceiling. */
export function decodeDataUrl(dataUrl: string, mimeType: string, maxBytes: number, label: string): Buffer {
  const match = DATA_URL.exec(dataUrl);
  if (!match || match[1] !== mimeType) throw new Error(`صيغة ${label} غير صالحة`);
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > maxBytes) throw new Error(`يجب ألا يتجاوز حجم ${label} ${Math.round(maxBytes / 1024 / 1024)} ميغابايت`);
  return bytes;
}

export function safeFileName(fileName: string, mimeType: string, fallback = "file") {
  const base = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120) || fallback;
  const ext = mimeType === "application/pdf" ? ".pdf" : mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}
