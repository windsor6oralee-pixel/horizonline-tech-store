import { BrandLockup } from "@/components/BrandLogo";
import StoreFooter from "@/components/StoreFooter";
import { trpc } from "@/lib/trpc";
import { Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoute } from "wouter";

/** Private message thread reached through the secret link the store sends the customer. */
export default function Conversation() {
  const [, params] = useRoute("/t/:token");
  const token = params?.token ?? "";
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.conversations.byToken.useQuery({ token }, { enabled: token.length === 32, refetchInterval: 8_000 });
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const send = trpc.conversations.replyAsCustomer.useMutation({
    onSuccess: () => { setBody(""); utils.conversations.byToken.invalidate({ token }); },
    onError: error => toast.error(error.message || "تعذر إرسال الرسالة"),
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [data?.messages.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    send.mutate({ token, body });
  };

  if (token.length !== 32 || (!isLoading && !data)) {
    return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f6f9fc] px-5">
      <section className="w-full max-w-sm rounded-[28px] bg-white p-8 text-center shadow-xl">
        <div className="mb-6 flex justify-center"><BrandLockup tone="onLight" size="lg" /></div>
        <h1 className="text-lg font-extrabold text-[#0a2342]">رابط المحادثة غير صالح</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">تأكد من فتح الرابط كما وصلك من المتجر، أو تواصل معنا لنرسله من جديد.</p>
        <a href="/" className="button-dark mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm">العودة للمتجر</a>
      </section>
    </main>;
  }

  return <div dir="rtl" className="min-h-screen bg-[#f6f9fc]">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between px-5">
        <a href="/" aria-label="Horizonline Tech Store"><BrandLockup tone="onLight" size="md" /></a>
        <span className="text-xs font-bold text-slate-500">محادثة خاصة بطلبك</span>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-5 py-8">
      {isLoading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#1f6f96]" /></div> : data && <>
        <section className="rounded-[24px] border border-[#d6e5f0] bg-white p-5">
          <p className="text-xs font-bold text-slate-400">مرحباً {data.customerName}</p>
          <h1 className="mt-1 text-xl font-extrabold text-[#0a2342]">{data.productTitle}</h1>
          <p className="mt-2 text-xs leading-6 text-slate-500">هذه صفحة خاصة بك وحدك. اكتب هنا أي سؤال عن طلبك وسيصلك ردّ فريق المتجر في المكان نفسه.</p>
        </section>

        <section className="mt-5 space-y-3">
          {data.messages.length === 0
            ? <p className="rounded-2xl border border-dashed border-[#cadce9] bg-white p-6 text-center text-sm text-slate-400">لا توجد رسائل بعد — اكتب أول رسالة في الأسفل.</p>
            : data.messages.map(message => (
                <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.sender === "admin"
                    ? "border border-[#d6e5f0] bg-white text-[#0a2342]"
                    : "mr-auto bg-[#0a2342] text-white"
                }`}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <time className={`mt-2 block text-[10px] ${message.sender === "admin" ? "text-slate-400" : "text-[#8ab4cc]"}`}>
                    {message.sender === "admin" ? "فريق Horizonline" : "أنت"} · {new Date(message.createdAt).toLocaleString("ar-SY", { dateStyle: "short", timeStyle: "short" })}
                  </time>
                </article>
              ))}
          <div ref={endRef} />
        </section>

        {data.closed
          ? <p className="mt-5 rounded-2xl bg-[#eff5fa] p-4 text-center text-xs font-bold text-slate-500">أُغلقت هذه المحادثة. تواصل معنا إذا احتجت فتحها من جديد.</p>
          : <form onSubmit={submit} className="mt-5 flex items-end gap-2">
              <textarea
                value={body}
                onChange={event => setBody(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="اكتب رسالتك…"
                className="form-field h-auto flex-1 resize-none py-3 leading-6"
              />
              <button type="submit" disabled={send.isPending || !body.trim()} className="button-dark grid h-12 w-12 shrink-0 place-items-center rounded-xl disabled:opacity-50" aria-label="إرسال">
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>}
      </>}
    </main>
    <StoreFooter />
  </div>;
}
