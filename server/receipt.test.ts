import { describe, expect, it } from "vitest";
import { normalizeArabicName } from "./receiptVerifier";

describe("normalizeArabicName", () => {
  it("treats common Arabic spelling variants as the same name", () => {
    const expected = normalizeArabicName("هيثم يوسف سعيد");
    expect(normalizeArabicName("هَيثم  يُوسف سعيد")).toBe(expected);
    expect(normalizeArabicName("هيثم يوسف سعيد.")).toBe(expected);
    expect(normalizeArabicName("هيثم يوسف سعيد ")).toBe(expected);
  });
  it("does not collapse different people", () => {
    expect(normalizeArabicName("محمد عماد ماجد عبد العال")).not.toBe(normalizeArabicName("هيثم يوسف سعيد"));
  });
});
