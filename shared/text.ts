const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Arabic-Indic and Persian digits to Latin so numeric inputs accept Arabic keyboards. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, d => String(ARABIC_INDIC.indexOf(d))).replace(/[۰-۹]/g, d => String(PERSIAN.indexOf(d)));
}

export const digitsOnly = (value: string) => toLatinDigits(value).replace(/\D/g, "");
export const phoneDigits = (value: string) => toLatinDigits(value).replace(/[^\d+]/g, "");
