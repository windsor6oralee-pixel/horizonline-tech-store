import { MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { BrandLockup } from "@/components/BrandLogo";

export default function StoreFooter() {
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
            </div>
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-white">خدمات Horizonline Tech Store</h2>
            <ul className="mt-5 space-y-3 text-sm text-[#a9bdcb]">
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
