import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import StoreFooter from "@/components/StoreFooter";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, ExternalLink, FileText, IdCard, Laptop, Loader2, MessageCircle, PhoneCall, ShieldAlert, Smartphone, Tablet, Truck, Users, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatWhatsAppNumber, normalizeWhatsAppNumber } from "@shared/whatsapp";
import { DEVICE_LABELS, PRESENCE_STEPS, type Device, stepIndex, stepLabel } from "@shared/presence";

const statusLabels = { new: "جديد", under_review: "قيد المراجعة", approved: "معتمد", needs_contact: "يتطلب تواصلاً", cancelled: "ملغي" } as const;
const leadStatusLabels = { new: "جديد", contacted: "تم التواصل", converted: "تحوّل إلى طلب", closed: "مغلق" } as const;

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery(undefined, { enabled: isAdmin });
  const { data: incompleteLeads = [], isLoading: leadsLoading, refetch: refetchLeads } = trpc.orders.incompleteList.useQuery(undefined, { enabled: isAdmin });
  const update = trpc.orders.updateStatus.useMutation({ onSuccess: () => { toast.success("تم تحديث حالة الطلب"); refetch(); }, onError: () => toast.error("تعذر تحديث الطلب") });
  const updateLead = trpc.orders.updateIncompleteStatus.useMutation({ onSuccess: () => { toast.success("تم تحديث حالة المتابعة"); refetchLeads(); }, onError: () => toast.error("تعذر تحديث حالة المتابعة") });
  const reviewProof = trpc.orders.reviewPaymentProof.useMutation({ onSuccess: (_, variables) => { toast.success(variables.decision === "approved" ? "تم اعتماد إثبات السداد" : "تم رفض إثبات السداد"); refetch(); }, onError: () => toast.error("تعذر تحديث حالة إثبات السداد") });
  const total = orders.length;
  const approved = orders.filter(order => order.status === "approved").length;
  const pendingProofs = orders.filter(order => order.paymentProofStatus === "pending").length;
  const newLeads = incompleteLeads.filter(lead => lead.status === "new").length;

  return <DashboardLayout>
    {!isAdmin ? <section className="mx-auto max-w-2xl rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-center"><ShieldAlert className="mx-auto h-9 w-9 text-amber-600" /><h1 className="mt-4 text-xl font-extrabold text-amber-950">هذه الصفحة للمدير فقط</h1><p className="mt-2 text-sm leading-7 text-amber-800">سجّل الدخول بالحساب المعيّن كمدير للمشروع لعرض البيانات الحساسة للطلبات.</p></section> : <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">HORIZONLINE / OPERATIONS</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0a2342]">طلبات التقسيط</h1><p className="mt-2 text-sm text-slate-500">راجع التأهل المبدئي وبيانات التسليم ثم حدّث الحالة.</p></div><span className="rounded-full bg-[#e8f3fa] px-4 py-2 text-sm font-bold text-[#1f6f96]">لا تُشارك بيانات العملاء خارج نطاق الطلب</span></div>
      <div className="mt-7 grid gap-4 md:grid-cols-4"><Stat icon={ClipboardList} value={total} label="إجمالي الطلبات" /><Stat icon={CheckCircle2} value={approved} label="طلبات معتمدة" tone="green" /><Stat icon={FileText} value={pendingProofs} label="إيصالات بانتظار المراجعة" tone="yellow" /><Stat icon={PhoneCall} value={newLeads} label="متابعات جديدة" tone="blue" /></div>
      <LiveVisitors />
      <WhatsAppSettings />
      <section className="mt-7 overflow-hidden rounded-[25px] border border-[#d8e7e6] bg-[#fbfefe]"><div className="flex flex-col gap-2 border-b border-[#e4efed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold text-[#0a2342]">طلبات غير مكتملة</h2><p className="mt-1 text-xs text-slate-500">بيانات التواصل التي حفظها العميل بموافقته فقط، من دون وثائق هوية أو إثبات دفع.</p></div><span className="rounded-full bg-[#e8f3fa] px-3 py-1 text-xs font-bold text-[#1f6f96]">{incompleteLeads.length} متابعة</span></div>{leadsLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#1f6f96]" /></div> : incompleteLeads.length === 0 ? <div className="px-6 py-10 text-center"><PhoneCall className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">لا توجد متابعات محفوظة بعد.</p></div> : <div className="grid gap-3 p-4 md:grid-cols-2">{incompleteLeads.map(lead => <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-[#0a2342]">{lead.customerName}</p><p className="mt-1 text-xs text-slate-500">{lead.phone} · {lead.province}</p></div><span className="rounded-full bg-[#eff5fa] px-2 py-1 text-[10px] font-extrabold text-[#1f6f96]">بموافقة العميل</span></div><p className="mt-4 font-bold text-slate-700">{lead.productTitle}</p><p className="mt-1 text-xs text-slate-500">دفعة {lead.downPaymentUsd}$ · {lead.months} شهر · {new Date(lead.createdAt).toLocaleDateString("ar-SY")}</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-slate-400">لا توجد وثائق ضمن هذا السجل</span><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700" value={lead.status} onChange={event => updateLead.mutate({ id: lead.id, status: event.target.value as keyof typeof leadStatusLabels })} disabled={updateLead.isPending}>{Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></article>)}</div>}</section>
      <section className="mt-7 overflow-hidden rounded-[25px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold text-[#0a2342]">سجل الطلبات</h2><span className="text-xs font-bold text-slate-400">{total} طلب</span></div>
        {isLoading ? <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#1f6f96]" /></div> : orders.length === 0 ? <div className="px-6 py-20 text-center"><ClipboardList className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-500">لا توجد طلبات مسجلة بعد.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1340px] text-right"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4 font-bold">الطلب</th><th className="px-4 py-4 font-bold">العميل</th><th className="px-4 py-4 font-bold">الهاتف والتقسيط</th><th className="px-4 py-4 font-bold">الهوية والالتزامات</th><th className="px-4 py-4 font-bold">إثبات شام كاش</th><th className="px-4 py-4 font-bold">التوصيل</th><th className="px-4 py-4 font-bold">الحالة</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-t border-slate-100 align-top"><td className="px-6 py-5"><p className="font-mono text-xs font-bold text-[#1f6f96]">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("ar-SY")}</p></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.customerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><PhoneCall className="h-3 w-3" />{order.phone}</p><p className="mt-1 text-xs text-slate-400">{order.age} سنة · {order.jobNature}</p></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.productTitle}</p><p className="mt-1 text-xs text-slate-500">دفعة {order.downPaymentUsd}$ · {order.months} شهر</p><p className="text-xs font-bold text-[#1f6f96]">{order.monthlyInstallmentUsd}$ شهرياً</p></td><td className="px-4 py-5"><IdentityCell order={order} /></td><td className="px-4 py-5"><PaymentProofCell order={order} busy={reviewProof.isPending} onReview={decision => reviewProof.mutate({ id: order.id, decision })} /></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.province}، {order.area}</p><p className="mt-1 text-xs text-slate-500">{order.recipientName} · {order.landmark || "لا يوجد معلم"}</p></td><td className="px-4 py-5"><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" value={order.status} onChange={event => update.mutate({ id: order.id, status: event.target.value as keyof typeof statusLabels })} disabled={update.isPending}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div>}
      </section>
    </>}
    <StoreFooter />
  </DashboardLayout>;
}

function duration(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ساعة${minutes % 60 ? ` و${minutes % 60} دقيقة` : ""}`;
}

const deviceIcons = { mobile: Smartphone, tablet: Tablet, desktop: Laptop } as const;

function LiveVisitors() {
  const { data, isLoading } = trpc.presence.live.useQuery(undefined, { refetchInterval: 5_000 });
  const online = data?.online ?? [];
  const today = data?.today ?? null;
  // Someone who reached the payment step also passed every step before it, so counts are cumulative.
  const reachedToday = (stage: number) =>
    today ? Object.keys(today.byStage).reduce((sum, key) => Number(key) >= stage ? sum + (today.byStage[Number(key) as keyof typeof today.byStage] ?? 0) : sum, 0) : 0;

  return <section className="mt-7 overflow-hidden rounded-[25px] border border-slate-200 bg-white">
    <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3fa] text-[#1f6f96]">
          <Users className="h-5 w-5" />
          {online.length > 0 && <span className="absolute -left-0.5 -top-0.5 flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>}
        </span>
        <div>
          <h2 className="font-extrabold text-[#0a2342]">الزوار الآن</h2>
          <p className="mt-1 text-xs text-slate-500">{isLoading ? "جارٍ القراءة…" : online.length ? `${online.length} زائر على الموقع حالياً` : "لا يوجد زوار على الموقع الآن"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="rounded-full bg-[#eef6fb] px-3 py-1.5 text-[#1f6f96]">زوار اليوم: {today?.todaySessions ?? "—"}</span>
        <span className="rounded-full bg-[#eef6fb] px-3 py-1.5 text-[#1f6f96]">آخر 7 أيام: {today?.weekSessions ?? "—"}</span>
        <span className="rounded-full bg-[#f4f7fa] px-3 py-1.5 text-slate-500">أعلى تواجد متزامن: {data?.peakOnline ?? 0}</span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-[#fbfdfe] p-4 sm:grid-cols-4 lg:grid-cols-8">
      {PRESENCE_STEPS.map((step, index) => {
        const now = data?.byStep?.[step.key] ?? 0;
        return <div key={step.key} className={`rounded-2xl border p-3 text-center ${now ? "border-[#8ad9e3] bg-white shadow-sm" : "border-slate-200/70 bg-white/60"}`}>
          <p className={`font-mono text-xl font-extrabold ${now ? "text-[#0a2342]" : "text-slate-300"}`}>{now}</p>
          <p className="mt-1 text-[10px] font-extrabold leading-4 text-slate-500">{step.short}</p>
          <p className="mt-1 text-[10px] text-slate-400">اليوم: {reachedToday(index)}</p>
        </div>;
      })}
    </div>

    {online.length === 0
      ? <div className="px-6 py-14 text-center text-sm text-slate-400">سيظهر هنا كل زائر لحظة دخوله، مع الخطوة التي يقف عندها.</div>
      : <div className="divide-y divide-slate-100">
          {online.map(visitor => {
            const DeviceIcon = deviceIcons[visitor.device as Device] ?? Laptop;
            const idle = visitor.secondsIdle > 45;
            return <div key={visitor.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${idle ? "bg-amber-400" : "bg-emerald-500"}`} title={idle ? "غير نشط" : "نشط الآن"} />
              <div className="min-w-[190px] flex-1">
                <p className="text-sm font-extrabold text-[#0a2342]">{stepLabel(visitor.view)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{visitor.product || "لم يختر جهازاً بعد"}</p>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500"><DeviceIcon className="h-3.5 w-3.5" />{DEVICE_LABELS[visitor.device as Device]}</span>
              <span className="text-[11px] font-bold text-slate-500">في الموقع منذ {duration(visitor.secondsOnSite)}</span>
              <span className={`text-[11px] font-bold ${idle ? "text-amber-600" : "text-emerald-600"}`}>{idle ? `آخر نشاط قبل ${duration(visitor.secondsIdle)}` : "نشط الآن"}</span>
              <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400">#{visitor.id}</span>
            </div>;
          })}
        </div>}

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-[#fbfdfe] px-6 py-4 text-[11px] text-slate-500">
      <span>التحديث تلقائي كل 5 ثوانٍ · الزائر يُحتسب متصلاً ما دام نشطاً خلال آخر 75 ثانية.</span>
      {today && <span className="flex flex-wrap gap-3 font-bold">
        {(Object.keys(DEVICE_LABELS) as Device[]).map(device => <span key={device}>{DEVICE_LABELS[device]}: {today.byDevice[device] ?? 0}</span>)}
      </span>}
    </div>
  </section>;
}

function WhatsAppSettings() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.settings.public.useQuery();
  const [value, setValue] = useState("");
  useEffect(() => { if (data) setValue(formatWhatsAppNumber(data.whatsappNumber)); }, [data]);
  const save = trpc.settings.updateWhatsApp.useMutation({
    onSuccess: result => { toast.success(`تم حفظ رقم واتساب: ${formatWhatsAppNumber(result.whatsappNumber)}`); utils.settings.public.invalidate(); },
    onError: error => toast.error(error.message || "تعذر حفظ الرقم"),
  });
  const dirty = data ? normalizeWhatsAppNumber(value) !== data.whatsappNumber : false;
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate({ whatsappNumber: value }); };
  return <section className="mt-7 rounded-[25px] border border-slate-200 bg-white p-6">
    <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3fa] text-[#1f6f96]"><MessageCircle className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-extrabold text-[#0a2342]">رقم واتساب المتجر</h2><p className="mt-1 text-xs leading-6 text-slate-500">يُستخدم في زر «ادفع الآن عبر واتساب» داخل صفحة الدفع وفي الفوتر. أدخله بالصيغة الدولية مع رمز الدولة.</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row"><input dir="ltr" inputMode="tel" value={value} onChange={event => setValue(event.target.value)} placeholder="+1 272 746 2228" disabled={isLoading} className="form-field font-mono sm:max-w-xs" /><button type="submit" disabled={!dirty || save.isPending || isLoading} className="button-dark h-[49px] rounded-xl px-6 text-sm disabled:cursor-not-allowed disabled:opacity-50">{save.isPending ? "جارٍ الحفظ…" : "حفظ الرقم"}</button></form>
      {data && <p className="mt-3 text-[11px] font-bold text-slate-400" dir="ltr">الحالي: {formatWhatsAppNumber(data.whatsappNumber)} · wa.me/{data.whatsappNumber}</p>}
    </div></div>
  </section>;
}

function Stat({ icon: Icon, value, label, tone = "blue" }: { icon: typeof ClipboardList; value: string | number; label: string; tone?: "blue" | "green" | "yellow" }) {
  const tones = { blue: "bg-[#e9f1f8] text-[#25668d]", green: "bg-[#e8f3fa] text-[#1f6f96]", yellow: "bg-[#fff5d8] text-[#aa7412]" };
  return <div className="rounded-[22px] border border-slate-200 bg-white p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-2xl font-extrabold text-[#0a2342]">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>;
}

function PaymentProofCell({ order, busy, onReview }: { order: { paymentProofUrl: string | null; paymentProofName: string | null; paymentProofStatus: "pending" | "approved" | "rejected" }; busy: boolean; onReview: (decision: "approved" | "rejected") => void }) {
  const label = order.paymentProofStatus === "approved" ? "معتمد" : order.paymentProofStatus === "rejected" ? "مرفوض" : "بانتظار المراجعة";
  const tone = order.paymentProofStatus === "approved" ? "bg-[#e8f3fa] text-[#1f6f96]" : order.paymentProofStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700";
  if (!order.paymentProofUrl) return <span className="text-xs font-bold text-slate-400">لا يوجد إيصال</span>;
  return <div className="space-y-2"><a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-extrabold text-[#1f6f96] hover:underline"><FileText className="h-3.5 w-3.5" />فتح الإيصال<ExternalLink className="h-3 w-3" /></a><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold ${tone}`}>{label}</span>{order.paymentProofStatus === "pending" && <div className="flex gap-1.5"><button disabled={busy} onClick={() => onReview("approved")} className="inline-flex items-center gap-1 rounded-lg bg-[#e0f5ee] px-2 py-1.5 text-[10px] font-extrabold text-[#1f6f96] disabled:opacity-50"><CheckCircle2 className="h-3 w-3" />قبول</button><button disabled={busy} onClick={() => onReview("rejected")} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-extrabold text-red-600 disabled:opacity-50"><XCircle className="h-3 w-3" />رفض</button></div>}</div>;
}

function IdentityCell({ order }: { order: { identityDocumentUrl: string | null; identityDocumentName: string | null; identityDocumentType: "syrian_id" | "passport" | "residence_permit" | "driving_license" | null; hasExistingInstallments: "yes" | "no" } }) {
  const documentLabels = { syrian_id: "هوية سورية", passport: "جواز سفر", residence_permit: "إقامة", driving_license: "رخصة قيادة" };
  return <div className="space-y-2"><p className="text-[11px] font-bold text-slate-600">أقساط قائمة: <span className={order.hasExistingInstallments === "yes" ? "text-amber-700" : "text-[#1f6f96]"}>{order.hasExistingInstallments === "yes" ? "نعم" : "لا"}</span></p>{order.identityDocumentUrl && order.identityDocumentType ? <a href={order.identityDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-extrabold text-[#25668d] hover:underline"><IdCard className="h-3.5 w-3.5" />{documentLabels[order.identityDocumentType]}<ExternalLink className="h-3 w-3" /></a> : <span className="text-xs font-bold text-slate-400">وثيقة غير متاحة</span>}</div>;
}
