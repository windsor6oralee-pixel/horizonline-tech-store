import { BrandLockup } from "@/components/BrandLogo";
import StoreFooter from "@/components/StoreFooter";
import { trpc } from "@/lib/trpc";
import { digitsOnly } from "@shared/text";
import { ClipboardList, Loader2, LogOut, MessagesSquare, Send } from "lucide-react";
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

        <section className="mt-8">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-[#0a2342]"><MessagesSquare className="h-4 w-4 text-[#1f6f96]" />المحادثة مع المتجر</p>
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
        </section>
      </>}
    </main>
    <StoreFooter />
  </div>;
}
