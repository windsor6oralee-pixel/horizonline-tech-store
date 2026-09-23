import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import StoreFooter from "@/components/StoreFooter";
import { trpc } from "@/lib/trpc";
import { CalendarClock, CheckCircle2, ClipboardList, Copy, ExternalLink, FileText, IdCard, Laptop, Link2, Loader2, MapPin, MessageCircle, MessagesSquare, PhoneCall, QrCode, Receipt, Send, ShieldAlert, Smartphone, Tablet, Truck, Users, X, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatWhatsAppNumber, normalizeWhatsAppNumber } from "@shared/whatsapp";
import { DEVICE_LABELS, PRESENCE_STEPS, type Device, stepIndex, stepLabel } from "@shared/presence";
import { PAYMENT_STATUS_LABELS } from "@shared/payment";
import { toInternationalDigits, whatsAppChatLink } from "@shared/whatsapp";

const statusLabels = { new: "جديد", under_review: "قيد المراجعة", approved: "معتمد", needs_contact: "يتطلب تواصلاً", cancelled: "ملغي" } as const;
const leadStatusLabels = { new: "جديد", contacted: "تم التواصل", converted: "تحوّل إلى طلب", closed: "مغلق" } as const;
const leadStepLabels = { eligibility: "التأهل المبدئي", delivery: "بيانات التوصيل", payment: "الدفع" } as const;

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
  const { data: threads = [] } = trpc.conversations.list.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  const unreadByLead = new Map(threads.filter(t => t.leadId).map(t => [t.leadId as number, t.unread]));
  const unreadTotal = threads.reduce((sum, t) => sum + t.unread, 0);
  const [openLead, setOpenLead] = useState<(typeof incompleteLeads)[number] | null>(null);
  const selectedLead = openLead ? incompleteLeads.find(lead => lead.id === openLead.id) ?? openLead : null;

  return <DashboardLayout>
    {!isAdmin ? <section className="mx-auto max-w-2xl rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-center"><ShieldAlert className="mx-auto h-9 w-9 text-amber-600" /><h1 className="mt-4 text-xl font-extrabold text-amber-950">هذه الصفحة للمدير فقط</h1><p className="mt-2 text-sm leading-7 text-amber-800">سجّل الدخول بالحساب المعيّن كمدير للمشروع لعرض البيانات الحساسة للطلبات.</p></section> : <>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">HORIZONLINE / OPERATIONS</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0a2342]">طلبات التقسيط</h1><p className="mt-2 text-sm text-slate-500">راجع التأهل المبدئي وبيانات التسليم ثم حدّث الحالة.</p></div><span className="rounded-full bg-[#e8f3fa] px-4 py-2 text-sm font-bold text-[#1f6f96]">لا تُشارك بيانات العملاء خارج نطاق الطلب</span></div>
      <div className="mt-7 grid gap-4 md:grid-cols-4"><Stat icon={ClipboardList} value={total} label="إجمالي الطلبات" /><Stat icon={CheckCircle2} value={approved} label="طلبات معتمدة" tone="green" /><Stat icon={FileText} value={pendingProofs} label="إيصالات بانتظار المراجعة" tone="yellow" /><Stat icon={PhoneCall} value={newLeads} label="متابعات جديدة" tone="blue" /></div>
      <LiveVisitors />
      <CustomerInbox />
      <ReceiptsReview />
      <PaymentSettings />
      <WhatsAppSettings />
      <section className="mt-7 overflow-hidden rounded-[25px] border border-[#d8e7e6] bg-[#fbfefe]"><div className="flex flex-col gap-2 border-b border-[#e4efed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold text-[#0a2342]">متابعات ومحادثات واتساب</h2><p className="mt-1 text-xs text-slate-500">عملاء بدأوا الطلب ولم يكملوه: إمّا حفظوا بياناتهم بموافقتهم، أو انتقلوا للمحادثة عبر واتساب.</p></div><span className="rounded-full bg-[#e8f3fa] px-3 py-1 text-xs font-bold text-[#1f6f96]">{incompleteLeads.length} متابعة · منها {incompleteLeads.filter(lead => lead.source === "whatsapp").length} واتساب</span>{unreadTotal > 0 && <span className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-bold text-[#8ad9e3]">{unreadTotal} رسالة غير مقروءة</span>}</div>{leadsLoading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#1f6f96]" /></div> : incompleteLeads.length === 0 ? <div className="px-6 py-10 text-center"><PhoneCall className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-500">لا توجد متابعات بعد.</p></div> : <div className="grid gap-3 p-4 md:grid-cols-2">{incompleteLeads.map(lead => <article key={lead.id} onClick={() => setOpenLead(lead)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#8ad9e3] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-[#0a2342]">{lead.customerName}</p><p className="mt-1 text-xs text-slate-500">{[lead.phone, lead.province].filter(Boolean).join(" · ") || "راسلك من رقمه على واتساب"}</p></div><div className="flex shrink-0 flex-col items-end gap-1.5">{(unreadByLead.get(lead.id) ?? 0) > 0 && <span className="flex items-center gap-1 rounded-full bg-[#0a2342] px-2 py-1 text-[10px] font-extrabold text-[#8ad9e3]"><MessagesSquare className="h-3 w-3" />{unreadByLead.get(lead.id)} رسالة جديدة</span>}{lead.source === "whatsapp" ? <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#e7f9ee] px-2 py-1 text-[10px] font-extrabold text-[#128c45]"><MessageCircle className="h-3 w-3" />محادثة واتساب</span> : <span className="shrink-0 rounded-full bg-[#eff5fa] px-2 py-1 text-[10px] font-extrabold text-[#1f6f96]">بموافقة العميل</span>}</div></div><p className="mt-4 font-bold text-slate-700">{lead.productTitle}</p><p className="mt-1 text-xs text-slate-500">دفعة {lead.downPaymentUsd}$ · {lead.months} شهر · {new Date(lead.createdAt).toLocaleDateString("ar-SY")}</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-slate-400">{lead.source === "whatsapp" ? `توقف عند: ${leadStepLabels[lead.checkoutStep]}` : "لا توجد وثائق ضمن هذا السجل"}</span><select onClick={event => event.stopPropagation()} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700" value={lead.status} onChange={event => updateLead.mutate({ id: lead.id, status: event.target.value as keyof typeof leadStatusLabels })} disabled={updateLead.isPending}>{Object.entries(leadStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></article>)}</div>}</section>
      <section className="mt-7 overflow-hidden rounded-[25px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="font-extrabold text-[#0a2342]">سجل الطلبات</h2><span className="text-xs font-bold text-slate-400">{total} طلب</span></div>
        {isLoading ? <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#1f6f96]" /></div> : orders.length === 0 ? <div className="px-6 py-20 text-center"><ClipboardList className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-500">لا توجد طلبات مسجلة بعد.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1340px] text-right"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4 font-bold">الطلب</th><th className="px-4 py-4 font-bold">العميل</th><th className="px-4 py-4 font-bold">الهاتف والتقسيط</th><th className="px-4 py-4 font-bold">الهوية والالتزامات</th><th className="px-4 py-4 font-bold">إثبات شام كاش</th><th className="px-4 py-4 font-bold">التوصيل</th><th className="px-4 py-4 font-bold">الحالة</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} className="border-t border-slate-100 align-top"><td className="px-6 py-5"><p className="font-mono text-xs font-bold text-[#1f6f96]">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("ar-SY")}</p></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.customerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><PhoneCall className="h-3 w-3" />{order.phone}</p><p className="mt-1 text-xs text-slate-400">{order.age} سنة · {order.jobNature}</p></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.productTitle}</p><p className="mt-1 text-xs text-slate-500">دفعة {order.downPaymentUsd}$ · {order.months} شهر</p><p className="text-xs font-bold text-[#1f6f96]">{order.monthlyInstallmentUsd}$ شهرياً</p></td><td className="px-4 py-5"><IdentityCell order={order} /></td><td className="px-4 py-5"><PaymentProofCell order={order} busy={reviewProof.isPending} onReview={decision => reviewProof.mutate({ id: order.id, decision })} /></td><td className="px-4 py-5"><p className="font-bold text-slate-700">{order.province}، {order.area}</p><p className="mt-1 text-xs text-slate-500">{order.recipientName} · {order.landmark || "لا يوجد معلم"}</p></td><td className="px-4 py-5"><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" value={order.status} onChange={event => update.mutate({ id: order.id, status: event.target.value as keyof typeof statusLabels })} disabled={update.isPending}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div>}
      </section>
    </>}
    {selectedLead && <LeadDetail
      lead={selectedLead}
      close={() => setOpenLead(null)}
      setStatus={status => updateLead.mutate({ id: selectedLead.id, status })}
      saving={updateLead.isPending}
    />}
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

type Lead = { id: number; customerName: string; phone: string | null; province: string | null; productTitle: string; productHandle: string | null; downPaymentUsd: string; months: number; checkoutStep: keyof typeof leadStepLabels; status: keyof typeof leadStatusLabels; source: "form" | "whatsapp"; createdAt: string | Date; updatedAt: string | Date };

function LeadDetail({ lead, close, setStatus, saving }: { lead: Lead; close: () => void; setStatus: (status: keyof typeof leadStatusLabels) => void; saving: boolean }) {
  const waDigits = lead.phone ? toInternationalDigits(lead.phone) : "";
  const when = (value: string | Date) => new Date(value).toLocaleString("ar-SY", { dateStyle: "medium", timeStyle: "short" });
  const copyPhone = async () => {
    if (!lead.phone) return;
    try { await navigator.clipboard.writeText(lead.phone); toast.success("نُسخ الرقم"); }
    catch { toast.error("تعذر النسخ — انسخ الرقم يدوياً"); }
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0a2342]/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={close}>
    <section dir="rtl" onClick={event => event.stopPropagation()} className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {lead.source === "whatsapp"
              ? <span className="flex items-center gap-1 rounded-full bg-[#e7f9ee] px-2.5 py-1 text-[10px] font-extrabold text-[#128c45]"><MessageCircle className="h-3 w-3" />محادثة واتساب</span>
              : <span className="rounded-full bg-[#eff5fa] px-2.5 py-1 text-[10px] font-extrabold text-[#1f6f96]">حفظ بموافقة العميل</span>}
            <span className="rounded-full bg-[#f4f7fa] px-2.5 py-1 text-[10px] font-extrabold text-slate-500">{leadStatusLabels[lead.status]}</span>
          </div>
          <h2 className="mt-3 truncate text-xl font-extrabold text-[#0a2342]">{lead.customerName}</h2>
          <p className="mt-1 text-xs text-slate-500">توقف عند خطوة: {leadStepLabels[lead.checkoutStep]}</p>
        </div>
        <button onClick={close} aria-label="إغلاق" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-5 w-5" /></button>
      </header>

      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail icon={PhoneCall} label="رقم الهاتف" value={lead.phone || "لم يُدخله — راسلك من رقمه على واتساب"} mono={Boolean(lead.phone)} />
          <Detail icon={MapPin} label="المحافظة" value={lead.province || "غير محددة"} />
          <Detail icon={Smartphone} label="الجهاز المطلوب" value={lead.productTitle} />
          <Detail icon={ClipboardList} label="الخطة" value={`دفعة ${lead.downPaymentUsd}$ · ${lead.months} شهراً`} />
          <Detail icon={CalendarClock} label="أول تواصل" value={when(lead.createdAt)} />
          <Detail icon={CalendarClock} label="آخر تحديث" value={when(lead.updatedAt)} />
        </div>

        {lead.phone && <div className="grid gap-2 sm:grid-cols-3">
          <a href={`tel:${lead.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a2342] text-xs font-extrabold text-white hover:bg-[#103058]"><PhoneCall className="h-4 w-4" />اتصال</a>
          <a href={whatsAppChatLink(waDigits)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-xs font-extrabold text-white hover:brightness-95"><MessageCircle className="h-4 w-4" />واتساب</a>
          <button onClick={copyPhone} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50"><Copy className="h-4 w-4" />نسخ الرقم</button>
        </div>}

        <LeadConversation lead={lead} />

        <div>
          <p className="text-xs font-extrabold text-slate-500">حالة المتابعة</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(leadStatusLabels) as (keyof typeof leadStatusLabels)[]).map(status => (
              <button
                key={status}
                onClick={() => setStatus(status)}
                disabled={saving || status === lead.status}
                className={`h-11 rounded-xl border text-[11px] font-extrabold transition disabled:cursor-not-allowed ${
                  status === lead.status
                    ? "border-[#0a2342] bg-[#0a2342] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#8ad9e3] disabled:opacity-50"
                }`}
              >{leadStatusLabels[status]}</button>
            ))}
          </div>
        </div>

        <p className="rounded-xl bg-[#f6f9fc] p-3 text-[11px] leading-6 text-slate-500">
          هذه متابعة وليست طلباً مكتملاً: لا تتضمن وثيقة هوية ولا إثبات دفع. لإتمامها، اطلب من العميل إكمال الطلب من الموقع.
        </p>
      </div>
    </section>
  </div>;
}

function CustomerInbox() {
  const utils = trpc.useUtils();
  const [openId, setOpenId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const { data: threads = [], isLoading } = trpc.conversations.list.useQuery(undefined, { refetchInterval: 30_000 });
  const { data: messages = [] } = trpc.conversations.thread.useQuery(
    { id: openId ?? 0, markRead: true },
    { enabled: Boolean(openId), refetchInterval: 15_000 },
  );
  const reply = trpc.conversations.replyAsAdmin.useMutation({
    onSuccess: () => { setBody(""); utils.conversations.thread.invalidate(); utils.conversations.list.invalidate(); },
    onError: error => toast.error(error.message || "تعذر إرسال الرسالة"),
  });
  const selected = threads.find(thread => thread.id === openId) ?? null;
  const unreadTotal = threads.reduce((sum, thread) => sum + thread.unread, 0);

  return <section className="mt-7 overflow-hidden rounded-[25px] border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3fa] text-[#1f6f96]"><MessagesSquare className="h-5 w-5" /></span>
        <div>
          <h2 className="font-extrabold text-[#0a2342]">صندوق رسائل العملاء</h2>
          <p className="mt-1 text-xs text-slate-500">محادثات العملاء المسجّلين داخل الموقع — يراها كل عميل في صفحة حسابه.</p>
        </div>
      </div>
      {unreadTotal > 0 && <span className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-bold text-[#8ad9e3]">{unreadTotal} غير مقروءة</span>}
    </div>

    {isLoading ? <div className="grid min-h-28 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#1f6f96]" /></div>
      : threads.length === 0 ? <p className="px-6 py-12 text-center text-sm text-slate-400">لا توجد محادثات بعد. تظهر هنا فور أن يسجّل عميل حسابه ويراسلك.</p>
      : <div className="grid gap-0 md:grid-cols-[260px_1fr]">
          <ul className="max-h-[340px] divide-y divide-slate-100 overflow-y-auto border-l border-slate-100">
            {threads.map(thread => (
              <li key={thread.id}>
                <button onClick={() => setOpenId(thread.id)} className={`flex w-full items-center justify-between gap-2 px-5 py-3 text-right transition ${openId === thread.id ? "bg-[#f2fafd]" : "hover:bg-slate-50"}`}>
                  <span className="min-w-0">
                    <b className="block truncate text-xs font-extrabold text-[#0a2342]">{thread.customerName}</b>
                    <small className="mt-0.5 block truncate text-[10px] text-slate-400">{thread.productTitle}</small>
                  </span>
                  {thread.unread > 0 && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#0a2342] px-1.5 text-[10px] font-extrabold text-[#8ad9e3]">{thread.unread}</span>}
                </button>
              </li>
            ))}
          </ul>

          <div className="p-5">
            {!selected ? <p className="grid min-h-[240px] place-items-center text-center text-xs text-slate-400">اختر عميلاً من القائمة لعرض محادثته.</p> : <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <b className="text-sm text-[#0a2342]">{selected.customerName}</b>
                {selected.phone && <span className="font-mono text-[11px] text-slate-400" dir="ltr">{selected.phone}</span>}
              </div>
              <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto">
                {messages.length === 0
                  ? <p className="py-8 text-center text-[11px] text-slate-400">لا توجد رسائل بعد — اكتب أول رسالة.</p>
                  : messages.map(message => (
                      <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-5 ${message.sender === "admin" ? "mr-auto bg-[#0a2342] text-white" : "border border-slate-200 bg-white text-[#0a2342]"}`}>
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <time className={`mt-1 block text-[9px] ${message.sender === "admin" ? "text-[#8ab4cc]" : "text-slate-400"}`}>
                          {message.sender === "admin" ? "أنت" : selected.customerName} · {new Date(message.createdAt).toLocaleString("ar-SY", { dateStyle: "short", timeStyle: "short" })}
                        </time>
                      </div>
                    ))}
              </div>
              <form onSubmit={event => { event.preventDefault(); if (body.trim()) reply.mutate({ id: selected.id, body }); }} className="mt-3 flex items-end gap-2">
                <textarea value={body} onChange={event => setBody(event.target.value)} rows={2} maxLength={2000} placeholder="اكتب رسالتك للعميل…" className="form-field h-auto flex-1 resize-none py-2 text-xs leading-5" />
                <button type="submit" disabled={reply.isPending || !body.trim()} className="button-dark grid h-10 w-10 shrink-0 place-items-center rounded-xl disabled:opacity-50" aria-label="إرسال">
                  {reply.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
            </>}
          </div>
        </div>}
  </section>;
}

function LeadConversation({ lead }: { lead: Lead }) {
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const { data: threads = [] } = trpc.conversations.list.useQuery();
  const thread = threads.find(t => t.leadId === lead.id) ?? null;
  const { data: messages = [] } = trpc.conversations.thread.useQuery(
    { id: thread?.id ?? 0, markRead: true },
    { enabled: Boolean(thread), refetchInterval: 20_000 },
  );
  const open = trpc.conversations.openForLead.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
    onError: error => toast.error(error.message || "تعذر فتح المحادثة"),
  });
  const reply = trpc.conversations.replyAsAdmin.useMutation({
    onSuccess: () => { setBody(""); utils.conversations.thread.invalidate(); utils.conversations.list.invalidate(); },
    onError: error => toast.error(error.message || "تعذر إرسال الرسالة"),
  });

  const link = thread ? `${window.location.origin}/t/${thread.token}` : "";
  const invite = `مرحباً ${lead.customerName}، هذه صفحة طلبك الخاصة لدى Horizonline Tech Store — تابع طلبك وراسلنا منها مباشرة:\n${link}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); toast.success("نُسخ الرابط"); }
    catch { toast.error("تعذر النسخ"); }
  };

  if (!thread) {
    return <div className="rounded-2xl border border-dashed border-[#cadce9] bg-[#fbfdfe] p-4 text-center">
      <MessagesSquare className="mx-auto h-6 w-6 text-[#1f6f96]" />
      <p className="mt-2 text-xs leading-6 text-slate-500">افتح صفحة خاصة بهذا العميل يراسلك منها مباشرة، وأرسل له رابطها عبر واتساب.</p>
      <button
        onClick={() => open.mutate({ leadId: lead.id, customerName: lead.customerName, phone: lead.phone, productTitle: lead.productTitle })}
        disabled={open.isPending}
        className="button-dark mt-3 h-10 rounded-xl px-5 text-xs disabled:opacity-50"
      >{open.isPending ? "جارٍ الفتح…" : "فتح محادثة مع العميل"}</button>
    </div>;
  }

  return <div className="rounded-2xl border border-[#d6e5f0] bg-[#fbfdfe] p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-xs font-extrabold text-[#0a2342]"><MessagesSquare className="h-4 w-4 text-[#1f6f96]" />المحادثة</p>
      <div className="flex gap-2">
        <button onClick={copyLink} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-extrabold text-slate-600 hover:bg-slate-50"><Link2 className="h-3.5 w-3.5" />نسخ الرابط</button>
        {lead.phone && <a href={`${whatsAppChatLink(toInternationalDigits(lead.phone))}?text=${encodeURIComponent(invite)}`} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 text-[10px] font-extrabold text-white hover:brightness-95"><MessageCircle className="h-3.5 w-3.5" />أرسل الرابط بواتساب</a>}
      </div>
    </div>

    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
      {messages.length === 0
        ? <p className="py-6 text-center text-[11px] text-slate-400">لا توجد رسائل بعد — اكتب أول رسالة وسيراها عند فتح الرابط.</p>
        : messages.map(message => (
            <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-5 ${message.sender === "admin" ? "mr-auto bg-[#0a2342] text-white" : "border border-slate-200 bg-white text-[#0a2342]"}`}>
              <p className="whitespace-pre-wrap">{message.body}</p>
              <time className={`mt-1 block text-[9px] ${message.sender === "admin" ? "text-[#8ab4cc]" : "text-slate-400"}`}>
                {message.sender === "admin" ? "أنت" : lead.customerName} · {new Date(message.createdAt).toLocaleString("ar-SY", { dateStyle: "short", timeStyle: "short" })}
              </time>
            </div>
          ))}
    </div>

    <form onSubmit={event => { event.preventDefault(); if (body.trim()) reply.mutate({ id: thread.id, body }); }} className="mt-3 flex items-end gap-2">
      <textarea value={body} onChange={event => setBody(event.target.value)} rows={2} maxLength={2000} placeholder="اكتب رسالتك للعميل…" className="form-field h-auto flex-1 resize-none py-2 text-xs leading-5" />
      <button type="submit" disabled={reply.isPending || !body.trim()} className="button-dark grid h-10 w-10 shrink-0 place-items-center rounded-xl disabled:opacity-50" aria-label="إرسال">
        {reply.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      </button>
    </form>
  </div>;
}

function Detail({ icon: Icon, label, value, mono }: { icon: typeof PhoneCall; label: string; value: string; mono?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-[#fbfdfe] p-3">
    <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</p>
    <p className={`mt-1.5 text-[13px] font-bold text-[#0a2342] ${mono ? "font-mono" : ""}`} dir={mono ? "ltr" : undefined}>{value}</p>
  </div>;
}

function PaymentSettings() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.settings.paymentSettings.useQuery();
  const [walletName, setWalletName] = useState("");
  const [walletId, setWalletId] = useState("");
  const [provider, setProvider] = useState("شام كاش");
  const [qr, setQr] = useState<{ fileName: string; mimeType: "image/jpeg" | "image/png" | "image/webp"; dataUrl: string } | null>(null);
  useEffect(() => { if (data) { setWalletName(data.walletName); setWalletId(data.walletId); setProvider(data.provider); } }, [data]);
  const save = trpc.settings.updatePaymentSettings.useMutation({
    onSuccess: () => { setQr(null); toast.success("تم حفظ بيانات الدفع"); utils.settings.paymentSettings.invalidate(); },
    onError: error => toast.error(error.message || "تعذر الحفظ"),
  });
  const pick = (selected?: File) => {
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) return toast.error("ارفع صورة JPG أو PNG أو WEBP");
    if (selected.size > 2 * 1024 * 1024) return toast.error("يجب ألا يتجاوز حجم الصورة 2 ميغابايت");
    const reader = new FileReader();
    reader.onload = () => setQr({ fileName: selected.name, mimeType: selected.type as "image/jpeg" | "image/png" | "image/webp", dataUrl: String(reader.result) });
    reader.readAsDataURL(selected);
  };
  const preview = qr?.dataUrl ?? data?.qrDataUrl ?? null;

  return <section className="mt-7 rounded-[25px] border border-slate-200 bg-white p-6">
    <div className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3fa] text-[#1f6f96]"><QrCode className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="font-extrabold text-[#0a2342]">محفظة استلام الدفعة الأولى</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">يظهر هذا الرمز فقط للعميل المسجّل الذي لديه طلب، ولا يُنشر في أي صفحة عامة. بدّله من هنا إذا تغيّرت المحفظة.</p>
        <form onSubmit={event => { event.preventDefault(); save.mutate({ walletName, walletId, provider, qr: qr ?? undefined }); }} className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
          <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[#cadce9] bg-[#fbfdfe] p-3 text-center">
            {preview ? <img src={preview} alt="رمز الدفع" className="w-full rounded-lg" /> : <span className="py-8 text-[11px] text-slate-400">لم يُرفع رمز بعد<br />اضغط لاختيار الصورة</span>}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => pick(event.target.files?.[0])} />
            <span className="mt-2 text-[10px] font-extrabold text-[#1f6f96]">{qr ? "صورة جديدة جاهزة للحفظ" : "اضغط لتبديل الرمز"}</span>
          </label>
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-600">المزوّد<input value={provider} onChange={event => setProvider(event.target.value)} disabled={isLoading} className="form-field mt-1.5" placeholder="شام كاش" /></label>
            <label className="block text-xs font-bold text-slate-600">اسم صاحب المحفظة<input value={walletName} onChange={event => setWalletName(event.target.value)} disabled={isLoading} className="form-field mt-1.5" placeholder="كما يظهر في التطبيق" /></label>
            <label className="block text-xs font-bold text-slate-600">معرّف المحفظة<input dir="ltr" value={walletId} onChange={event => setWalletId(event.target.value)} disabled={isLoading} className="form-field mt-1.5 font-mono" placeholder="fa56242f…" /></label>
            <button type="submit" disabled={save.isPending || isLoading} className="button-dark h-11 rounded-xl px-6 text-sm disabled:opacity-50">{save.isPending ? "جارٍ الحفظ…" : "حفظ"}</button>
          </div>
        </form>
      </div>
    </div>
  </section>;
}

function ReceiptsReview() {
  const utils = trpc.useUtils();
  const { data: receipts = [], isLoading } = trpc.payments.list.useQuery(undefined, { refetchInterval: 30_000 });
  const review = trpc.payments.review.useMutation({
    onSuccess: (_, variables) => { toast.success(variables.status === "approved" ? "تم تأكيد الدفعة" : "تم رفض الإيصال"); utils.payments.list.invalidate(); },
    onError: error => toast.error(error.message || "تعذر الحفظ"),
  });
  const pending = receipts.filter(receipt => receipt.status === "pending").length;
  const reject = (id: number) => {
    const note = window.prompt("سبب الرفض (يظهر للعميل):", "المبلغ أو التفاصيل غير مطابقة");
    if (note === null) return;
    review.mutate({ id, status: "rejected", note });
  };

  return <section className="mt-7 overflow-hidden rounded-[25px] border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f3fa] text-[#1f6f96]"><Receipt className="h-5 w-5" /></span>
        <div><h2 className="font-extrabold text-[#0a2342]">إيصالات الدفعة الأولى</h2><p className="mt-1 text-xs text-slate-500">ما رفعه العملاء المسجّلون بعد الدفع إلى محفظة المتجر. أكّد أو ارفض بعد مطابقة المبلغ في تطبيق المحفظة.</p></div>
      </div>
      {pending > 0 && <span className="rounded-full bg-[#fff5d8] px-3 py-1 text-xs font-bold text-[#aa7412]">{pending} بانتظار المراجعة</span>}
    </div>
    {isLoading ? <div className="grid min-h-28 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#1f6f96]" /></div>
      : receipts.length === 0 ? <p className="px-6 py-12 text-center text-sm text-slate-400">لا توجد إيصالات بعد.</p>
      : <div className="divide-y divide-slate-100">
          {receipts.map(receipt => (
            <div key={receipt.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4">
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-extrabold text-[#0a2342]">{receipt.customerName}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-400" dir="ltr">{receipt.customerPhone}</p>
              </div>
              <span className="font-mono text-sm font-extrabold text-[#0a2342]">${Number(receipt.amountUsd).toFixed(0)}</span>
              <span className="text-[11px] text-slate-500">{new Date(receipt.createdAt).toLocaleString("ar-SY", { dateStyle: "short", timeStyle: "short" })}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${receipt.status === "approved" ? "bg-[#e7f9ee] text-[#128c45]" : receipt.status === "rejected" ? "bg-[#fdf1ef] text-[#a5301f]" : "bg-[#fff5d8] text-[#aa7412]"}`}>{PAYMENT_STATUS_LABELS[receipt.status]}</span>
              <a href={`/api/files/${receipt.fileKey}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-extrabold text-[#1f6f96] hover:underline"><ExternalLink className="h-3.5 w-3.5" />عرض الإيصال</a>
              {receipt.status === "pending" && <div className="flex gap-2">
                <button onClick={() => review.mutate({ id: receipt.id, status: "approved" })} disabled={review.isPending} className="h-9 rounded-lg bg-[#15915f] px-3 text-[11px] font-extrabold text-white disabled:opacity-50">تأكيد</button>
                <button onClick={() => reject(receipt.id)} disabled={review.isPending} className="h-9 rounded-lg border border-slate-200 px-3 text-[11px] font-extrabold text-slate-600 disabled:opacity-50">رفض</button>
              </div>}
              {receipt.note && <p className="w-full text-[11px] text-slate-400">ملاحظة: {receipt.note}</p>}
            </div>
          ))}
        </div>}
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
