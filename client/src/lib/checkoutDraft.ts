/**
 * A customer who presses "pay" may transfer money and then lose the tab before uploading the receipt.
 * The draft keeps everything except the two uploaded files, so reopening the store lands them back on
 * the payment step with the same reference — the money is never orphaned.
 */
export type CheckoutDraft = {
  handle: string;
  productTitle: string;
  gift: string;
  downPayment: 100 | 150 | 300;
  months: number;
  eligibility: { fullName: string; age: string; jobNature: string; hasExistingInstallments: "yes" | "no"; identityDocumentType: string };
  delivery: { province: string; area: string; landmark: string; recipientName: string; phone: string; alternatePhone: string };
  leadId: number | null;
  reference: string | null;
  stage: "pay" | "confirm";
  savedAt: number;
};

const KEY = "hz:checkout-draft";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function readCheckoutDraft(): CheckoutDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as CheckoutDraft;
    if (!draft?.handle || Date.now() - draft.savedAt > TTL_MS) { localStorage.removeItem(KEY); return null; }
    return draft;
  } catch { return null; }
}

export function writeCheckoutDraft(draft: Omit<CheckoutDraft, "savedAt">) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() })); } catch { /* private mode */ }
}

export function clearCheckoutDraft() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
