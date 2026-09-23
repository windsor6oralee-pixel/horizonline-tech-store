import { BrandLockup } from "@/components/BrandLogo";
import StoreFooter from "@/components/StoreFooter";
import { trpc } from "@/lib/trpc";
import { digitsOnly } from "@shared/text";
import { ClipboardList, Copy, FileUp, Loader2, Lock, LogOut, MessagesSquare, QrCode, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const orderStatusLabels: Record<string, string> = {
  new: "قيد الاستلام", under_review: "قيد المراجعة", approved: "معتمد",
  needs_contact: "يتطلب تواصلاً", cancelled: "ملغي",
};
const stepLabels: Record<string, string> = { eligibility: "التأهل المبدئي", delivery: "بيانات التوصيل", payment: "الدفع" };

export default function Account() {
  const { data: me, isLoading: loadingMe } = trpc.account.me.useQuery();
  if (loadingMe) return <main className="grid min-h-screen place-items-center bg-[#f6f9fc]"><Loader2 className="h-6 w-6 animate-spin text-[#1f6f96]" /></main>;
  return me ? <Dashboard /> : <AuthForms />;
}

function AuthForms() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const done = () => { utils.account.me.invalidate(); utils.account.overview.invalidate(); };
  const login = trpc.account.login.useMutation({ onSuccess: done, onError: e => toast.error(e.message) });
  const register = trpc.account.register.useMutation({ onSuccess: done, onError: e => toast.error(e.message) });
  const busy = login.isPending || register.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") login.mutate({ phone, password });
    else register.mutate({ phone, name, password });
  };

  return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f6f9fc] px-5 py-10">
    <section className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="mb-6 flex justify-center"><BrandLockup tone="onLight" size="lg" /></div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f2fafd] p-1">
        {(["login", "register"] as const).map(value => (
          <button key={value} onClick={() => setMode(value)} type="button"
            className={`h-10 rounded-lg text-xs font-extrabold transition ${mode === value ? "bg-[#0a2342] text-white" : "text-slate-500"}`}>
            {value === "login" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>
      <p className="mt-5 text-center text-xs leading-6 text-slate-500">
        {mode === "login" ? "ادخل إلى حسابك لمتابعة طلبك ومراسلة فريق المتجر." : "أنشئ حسابك برقم الهاتف نفسه الذي أدخلته في الطلب، فترتبط طلباتك السابقة بحسابك تلقائياً."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3 text-right">
        {mode === "register" && <label className="block text-xs font-bold text-slate-600">الاسم الكامل
          <input required value={name} onChange={e => setName(e.target.value)} className="form-field mt-2" placeholder="اكتب اسمك الثلاثي" />
        </label>}
        <label className="block text-xs font-bold text-slate-600">رقم الهاتف
          <input required dir="ltr" inputMode="tel" value={phone} onChange={e => setPhone(digitsOnly(e.target.value))} className="form-field mt-2 font-mono" placeholder="09XXXXXXXX" />
        </label>
        <label className="block text-xs font-bold text-slate-600">كلمة المرور
          <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="form-field mt-2" placeholder="6 أحرف على الأقل" />
        </label>
        <button type="submit" disabled={busy} className="button-dark mt-2 h-12 w-full rounded-xl text-sm disabled:opacity-60">
          {busy ? "جارٍ المتابعة…" : mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
      </form>
      <a href="/" className="mt-5 block text-center text-xs font-bold text-[#1f6f96] hover:underline">العودة للمتجر</a>
    </section>
  </main>;
}

function Dashboard() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.account.overview.useQuery(undefined, { refetchInterval: 20_000 });
  const [body, setBody] = useState("");
  const send = trpc.account.sendMessage.useMutation({
    onSuccess: () => { setBody(""); utils.account.overview.invalidate(); },
    onError: e => toast.error(e.message || "تعذر إرسال الرسالة"),
  });
  const logout = trpc.account.logout.useMutation({ onSuccess: () => { utils.account.me.invalidate(); setLocation("/"); } });

  return <div dir="rtl" className="min-h-screen bg-[#f6f9fc]">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between px-5">
        <a href="/" aria-label="Horizonline Tech Store"><BrandLockup tone="onLight" size="md" /></a>
        <button onClick={() => logout.mutate()} className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-[#0a2342]"><LogOut className="h-4 w-4" />خروج</button>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-5 py-8">
      {isLoading || !data ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#1f6f96]" /></div> : <>
        <h1 className="text-xl font-extrabold text-[#0a2342]">مرحباً {data.name}</h1>
        <p className="mt-1 text-xs text-slate-500" dir="ltr">{data.phone}</p>

        <section className="mt-6">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#0a2342]"><ClipboardList className="h-4 w-4 text-[#1f6f96]" />طلباتك</p>
          <div className="mt-3 space-y-3">
            {data.orders.length === 0 && data.leads.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[#cadce9] bg-white p-6 text-center text-xs text-slate-400">لا توجد طلبات مرتبطة بهذا الرقم بعد.</p>
            )}
            {data.orders.map(order => (
              <article key={order.orderNumber} className="rounded-2xl border border-[#d6e5f0] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="text-sm text-[#0a2342]">{order.productTitle}</b>
                  <span className="rounded-full bg-[#e8f3fa] px-2.5 py-1 text-[10px] font-extrabold text-[#1f6f96]">{orderStatusLabels[order.status] ?? order.status}</span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-slate-400">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-slate-500">دفعة ${order.downPaymentUsd} · قسط ${order.monthlyInstallmentUsd} × {order.months} شهراً</p>
              </article>
            ))}
            {data.leads.map(lead => (
              <article key={lead.id} className="rounded-2xl border border-dashed border-[#cadce9] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="text-sm text-[#0a2342]">{lead.productTitle}</b>
                  <span className="rounded-full bg-[#fff6e6] px-2.5 py-1 text-[10px] font-extrabold text-[#a5761f]">لم يكتمل · {stepLabels[lead.checkoutStep] ?? lead.checkoutStep}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">دفعة ${lead.downPaymentUsd} · {lead.months} شهراً</p>
              </article>
            ))}
          </div>
        </section>

        <PaymentSection />

        <section className="mt-8">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#0a2342]"><MessagesSquare className="h-4 w-4 text-[#1f6f96]" />المحادثة مع المتجر</p>
          {!data.chatUnlocked ? (
            <div className="mt-3 rounded-2xl border border-dashed border-[#cadce9] bg-white p-6 text-center">
              <Lock className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-2 text-sm font-extrabold text-[#0a2342]">تُفتح المحادثة بعد رفع إيصال الدفعة الأولى</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">ادفع الدفعة إلى محفظة المتجر أعلاه وارفع لقطة عملية الدفع، وسيصبح بإمكانك مراسلة الفريق فوراً.</p>
            </div>
          ) : <>
            <div className="mt-3 space-y-3">
              {data.messages.length === 0
                ? <p className="rounded-2xl border border-dashed border-[#cadce9] bg-white p-6 text-center text-xs text-slate-400">لا توجد رسائل بعد — اكتب سؤالك في الأسفل وسيصلك الرد هنا.</p>
                : data.messages.map(message => (
                    <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === "admin" ? "border border-[#d6e5f0] bg-white text-[#0a2342]" : "mr-auto bg-[#0a2342] text-white"}`}>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <time className={`mt-2 block text-[10px] ${message.sender === "admin" ? "text-slate-400" : "text-[#8ab4cc]"}`}>
                        {message.sender === "admin" ? "فريق Horizonline" : "أنت"} · {new Date(message.createdAt).toLocaleString("ar-SY", { dateStyle: "short", timeStyle: "short" })}
                      </time>
                    </article>
                  ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); if (body.trim()) send.mutate({ body }); }} className="mt-4 flex items-end gap-2">
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} maxLength={2000} placeholder="اكتب رسالتك…" className="form-field h-auto flex-1 resize-none py-3 leading-6" />
              <button type="submit" disabled={send.isPending || !body.trim()} className="button-dark grid h-12 w-12 shrink-0 place-items-center rounded-xl disabled:opacity-50" aria-label="إرسال">
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </>}
        </section>
      </>}
    </main>
    <StoreFooter />
  </div>;
}

function PaymentSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.account.paymentInfo.useQuery();
  const [file, setFile] = useState<{ fileName: string; mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"; dataUrl: string } | null>(null);
  const upload = trpc.account.uploadReceipt.useMutation({
    onSuccess: () => { setFile(null); toast.success("وصلنا إيصالك — المحادثة مفتوحة الآن"); utils.account.paymentInfo.invalidate(); utils.account.overview.invalidate(); },
    onError: e => toast.error(e.message || "تعذر رفع الإيصال"),
  });
  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); toast.success(`نُسخ ${label}`); } catch { toast.error("تعذر النسخ"); }
  };
  const pick = (selected?: File) => {
    if (!selected) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
    if (!allowed.includes(selected.type as (typeof allowed)[number])) return toast.error("ارفع صورة JPG أو PNG أو WEBP أو ملف PDF");
    if (selected.size > 3 * 1024 * 1024) return toast.error("يجب ألا يتجاوز حجم الملف 3 ميغابايت");
    const reader = new FileReader();
    reader.onload = () => setFile({ fileName: selected.name, mimeType: selected.type as (typeof allowed)[number], dataUrl: String(reader.result) });
    reader.onerror = () => toast.error("تعذر قراءة الملف");
    reader.readAsDataURL(selected);
  };

  if (isLoading || !data || !data.hasOrder) return null;

  const amount = Number(data.amountUsd).toFixed(0);
  const latest = data.latest;
  const needsUpload = !latest || latest.status === "rejected";

  return <section className="mt-8">
    <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#0a2342]"><QrCode className="h-4 w-4 text-[#1f6f96]" />الدفعة الأولى</p>

    {latest && latest.status !== "rejected" && (
      <div className={`mt-3 flex items-start gap-3 rounded-2xl border p-4 ${latest.status === "approved" ? "border-[#bfe6d0] bg-[#f0faf4]" : "border-[#d6e5f0] bg-[#f2fafd]"}`}>
        <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${latest.status === "approved" ? "text-[#15915f]" : "text-[#1f6f96]"}`} />
        <div>
          <b className="block text-sm text-[#0a2342]">{latest.status === "approved" ? "تم تأكيد دفعتك" : "وصلنا إيصالك وهو قيد المراجعة"}</b>
          <p className="mt-1 text-xs leading-6 text-slate-500">${Number(latest.amountUsd).toFixed(0)} · {new Date(latest.createdAt).toLocaleString("ar-SY", { dateStyle: "medium", timeStyle: "short" })}{latest.status === "pending" && " — يمكنك مراسلة الفريق الآن، وسنؤكد الدفعة بعد التحقق."}</p>
        </div>
      </div>
    )}

    {needsUpload && (
      <div className="mt-3 overflow-hidden rounded-[24px] border border-[#d6e5f0] bg-white">
        {latest?.status === "rejected" && (
          <p className="border-b border-[#f3d2cc] bg-[#fdf1ef] px-5 py-3 text-xs leading-6 text-[#a5301f]"><b>لم نتمكن من تأكيد الإيصال السابق.</b>{latest.note ? ` ${latest.note}` : ""} ارفع لقطة أوضح لعملية الدفع.</p>
        )}
        <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr] sm:items-start">
          <div className="grid place-items-center rounded-2xl bg-[#f2fafd] p-3">
            {data.qrDataUrl
              ? <img src={data.qrDataUrl} alt={`رمز الدفع — ${data.provider}`} className="w-full max-w-[180px] rounded-xl" />
              : <p className="py-8 text-center text-[11px] text-slate-400">استخدم معرّف المحفظة أدناه للتحويل</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400">ادفع عبر {data.provider} إلى محفظة</p>
            <b className="mt-0.5 block text-base text-[#0a2342]">{data.walletName || "محفظة المتجر"}</b>
            {data.walletId && (
              <button type="button" onClick={() => copy(data.walletId, "معرّف المحفظة")} className="mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#fbfdfe] px-3 py-2 text-right hover:border-[#8ad9e3]">
                <span className="min-w-0 truncate font-mono text-[11px] text-slate-600" dir="ltr">{data.walletId}</span>
                <Copy className="h-4 w-4 shrink-0 text-[#1f6f96]" />
              </button>
            )}
            <div className="mt-3 rounded-2xl bg-[#0a2342] p-4 text-white">
              <p className="text-[11px] font-bold text-[#8ad9e3]">المبلغ المطلوب — أدخله بالضبط</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="font-mono text-3xl font-extrabold">${amount}</span>
                <button type="button" onClick={() => copy(amount, "المبلغ")} className="flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[11px] font-extrabold hover:bg-white/20"><Copy className="h-3.5 w-3.5" />نسخ</button>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-[#c9d7e1]">الدفعة الأولى لطلب {data.productTitle}. أي فرق في المبلغ يؤخر تأكيد طلبك.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-[#fbfdfe] p-5">
          <p className="text-xs font-extrabold text-[#0a2342]">بعد الدفع: ارفع لقطة شاشة لعملية التحويل</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="button-dark inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-xs">
              <FileUp className="h-4 w-4" />{file ? "استبدال الملف" : "اختيار الملف"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => pick(e.target.files?.[0])} />
            </label>
            <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{file ? file.fileName : "JPG أو PNG أو WEBP أو PDF حتى 3 ميغابايت"}</span>
            <button type="button" disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file)} className="h-11 rounded-xl bg-[#15915f] px-5 text-xs font-extrabold text-white disabled:opacity-50">
              {upload.isPending ? "جارٍ الرفع…" : "إرسال الإيصال"}
            </button>
          </div>
        </div>
      </div>
    )}
  </section>;
}
