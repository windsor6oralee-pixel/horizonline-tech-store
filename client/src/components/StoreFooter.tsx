import { MapPin, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { SHAM_CASH_WHATSAPP_NUMBER, WHATSAPP_HANDLE, formatWhatsAppNumber, whatsAppChatLink } from "@shared/whatsapp";
import { trpc } from "@/lib/trpc";
import { BrandLockup } from "@/components/BrandLogo";

export default function StoreFooter() {
  const { data: settings } = trpc.settings.public.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const whatsapp = settings?.whatsappNumber ?? SHAM_CASH_WHATSAPP_NUMBER;
  return (
    <footer className="bg-[#061b37] text-[#c9d7e1]" dir="rtl">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.15fr_.85fr_.85fr]">
          <div>
            <BrandLockup tone="onDark" size="lg" />
            <p className="mt-4 max-w-md text-sm leading-8 text-[#a9bdcb]">
              أجهزة خلوية بالتقسيط دون فوائد، مع توصيل DHL مجاني إلى جميع المحافظات السورية.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#8ad9e3]/20 bg-white/[.04] px-4 py-3 text-xs font-bold text-[#8ad9e3]">
              <ShieldCheck className="h-4 w-4" />
              مرخص من قبل الإدارة العامة للتجارة الداخلية وحماية المستهلك
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-white">بيانات المنشأة</h2>
            <div className="mt-5 space-y-4 text-sm leading-7">
              <p className="flex items-start gap-3">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8ad9e3]/10 text-[#8ad9e3]">
                  <Smartphone className="h-4 w-4" />
                </span>
                <span><b className="block text-[#e8f3f2]">رقم السجل التجاري</b>81916</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8ad9e3]/10 text-[#8ad9e3]">
                  <MapPin className="h-4 w-4" />
                </span>
                <span><b className="block text-[#e8f3f2]">العنوان</b>الشارع الرئيسي، دخلة الرينبو، مقابل مطعم الخال، الغوطة، مدينة حمص</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8ad9e3]/10 text-[#8ad9e3]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span><b className="block text-[#e8f3f2]">واتساب</b><a href={whatsAppChatLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="font-mono text-[#8ad9e3] hover:underline" dir="ltr">{formatWhatsAppNumber(whatsapp)}</a><span className="block text-xs text-[#8da5b5]" dir="ltr">{WHATSAPP_HANDLE}</span></span>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-white">خدمات Horizonline Tech Store</h2>
            <ul className="mt-5 space-y-3 text-sm text-[#a9bdcb]">
              <li className="font-bold text-[#f0c987]">لا يوجد دفع عند الاستلام</li>
              <li>تقسيط مرن من 12 إلى 48 شهراً</li>
              <li>دفعة أولى تبدأ من 100$</li>
              <li>هدايا مجانية مع الأجهزة</li>
              <li>توصيل DHL مجاني داخل سوريا</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs leading-6 text-[#8da5b5]">
          <p>© 2026 Horizonline Tech Store · أجهزة وتقسيط بلا فوائد · جميع الحقوق محفوظة</p>
          <p className="mt-1">السجل التجاري: 81916 · مدينة حمص، سوريا</p>
        </div>
      </div>
    </footer>
  );
}

export { StoreFooter };
