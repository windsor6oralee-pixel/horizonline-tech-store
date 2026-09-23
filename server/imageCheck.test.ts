import { describe, expect, it } from "vitest";
import { imageDimensions, localReceiptProblem, sha256 } from "./imageCheck";

const onePx = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

describe("local receipt checks", () => {
  it("reads PNG dimensions and rejects tiny images", () => {
    expect(imageDimensions(onePx, "image/png")).toEqual({ width: 1, height: 1 });
    expect(localReceiptProblem(onePx, "image/png")).toMatch(/صغيرة/);
  });
  it("rejects bytes that are not an image", () => {
    expect(imageDimensions(Buffer.from("hello"), "image/jpeg")).toBeNull();
    expect(localReceiptProblem(Buffer.from("hello"), "image/jpeg")).toMatch(/ليس صورة/);
  });
  it("accepts a plausible receipt-sized PNG header", () => {
    const big = Buffer.from(onePx); big.writeUInt32BE(1080, 16); big.writeUInt32BE(1920, 20);
    expect(localReceiptProblem(big, "image/png")).toBeNull();
  });
  it("hashes deterministically", () => {
    expect(sha256(onePx)).toBe(sha256(Buffer.from(onePx)));
  });
});
