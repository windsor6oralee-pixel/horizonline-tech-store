import type { Cart, Product } from "@shared/commerce/types";
import { SYRIAN_POUND_PER_USD } from "@shared/storeConstants";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, CircleDollarSign, Gift, Heart, House, Info, LayoutGrid, Menu, Minus, Plus, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Truck, X, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import CheckoutWizard, { type SelectedProduct } from "./CheckoutWizard";
import StoreFooter from "@/components/StoreFooter";

type CatalogProduct = SelectedProduct & { demo?: boolean };

const demoProducts: CatalogProduct[] = [
  {
    id: "demo-iphone-18-pro-max", handle: "iphone-18-pro-max", title: "iPhone 18 Pro Max", description: "256GB · أربعة ألوان حصرية", descriptionHtml: "", productType: "هواتف", vendor: "Apple", tags: ["Apple", "iPhone", "18 Pro Max"], options: [{ name: "اللون", values: ["عنابي", "أزرق سماوي", "أبيض", "أسود"] }, { name: "السعة", values: ["256GB"] }], minDownPayment: 150,
    priceRange: { min: { amount: "1370", currencyCode: "USD" }, max: { amount: "1370", currencyCode: "USD" } }, images: [{ url: "/manus-storage/iphone-18-pro-max-cropped_b393f81d.png", altText: "iPhone 18 Pro Max 256GB باللون العنابي" }],
    variants: [
      { id: "demo-iphone-18-pro-max-burgundy", title: "عنابي · 256GB", availableForSale: true, price: { amount: "1370", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "عنابي" }, { name: "السعة", value: "256GB" }] },
      { id: "demo-iphone-18-pro-max-sky", title: "أزرق سماوي · 256GB", availableForSale: true, price: { amount: "1370", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "أزرق سماوي" }, { name: "السعة", value: "256GB" }] },
      { id: "demo-iphone-18-pro-max-white", title: "أبيض · 256GB", availableForSale: true, price: { amount: "1370", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "أبيض" }, { name: "السعة", value: "256GB" }] },
      { id: "demo-iphone-18-pro-max-black", title: "أسود · 256GB", availableForSale: true, price: { amount: "1370", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "أسود" }, { name: "السعة", value: "256GB" }] },
    ], demo: true,
  },
  {
    id: "demo-iphone-17-pro-max", handle: "iphone-17-pro-max", title: "iPhone 17 Pro Max", description: "256GB · ثلاثة ألوان حصرية", descriptionHtml: "", productType: "هواتف", vendor: "Apple", tags: ["Apple", "iPhone", "17 Pro Max"], options: [{ name: "اللون", values: ["برتقالي كوني", "فضي قمري", "كحلي عميق"] }],
    priceRange: { min: { amount: "1199", currencyCode: "USD" }, max: { amount: "1199", currencyCode: "USD" } }, images: [{ url: "/manus-storage/appl-iphone-17-pro-max_baf0b104.png", altText: "iPhone 17 Pro Max بالألوان البرتقالي والفضي والكحلي" }],
    variants: [
      { id: "demo-iphone-17-pro-max-orange", title: "برتقالي كوني", availableForSale: true, price: { amount: "1199", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "برتقالي كوني" }] },
      { id: "demo-iphone-17-pro-max-silver", title: "فضي قمري", availableForSale: true, price: { amount: "1199", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "فضي قمري" }] },
      { id: "demo-iphone-17-pro-max-navy", title: "كحلي عميق", availableForSale: true, price: { amount: "1199", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [{ name: "اللون", value: "كحلي عميق" }] },
    ], demo: true,
  },
  {
    id: "demo-iphone", handle: "iphone-16-pro", title: "iPhone 16 Pro", description: "256GB · تيتانيوم صحراوي", descriptionHtml: "", productType: "هواتف", vendor: "Apple", tags: ["Apple"], options: [],
    priceRange: { min: { amount: "999", currencyCode: "USD" }, max: { amount: "999", currencyCode: "USD" } }, images: [{ url: "/manus-storage/appl-iphone-16-pro_c18b022c.png", altText: "iPhone 16 Pro" }],
    variants: [{ id: "demo-iphone-variant", title: "256GB", availableForSale: true, price: { amount: "999", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [] }], demo: true,
  },
  {
    id: "demo-samsung", handle: "galaxy-s25-ultra", title: "Galaxy S25 Ultra", description: "256GB · تيتانيوم فضي", descriptionHtml: "", productType: "هواتف", vendor: "Samsung", tags: ["Samsung"], options: [],
    priceRange: { min: { amount: "899", currencyCode: "USD" }, max: { amount: "899", currencyCode: "USD" } }, images: [{ url: "/manus-storage/appl-galaxy-s25-ultra_c47ead4e.png", altText: "Galaxy S25 Ultra" }],
    variants: [{ id: "demo-samsung-variant", title: "256GB", availableForSale: true, price: { amount: "899", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [] }], demo: true,
  },
  {
    id: "demo-huawei", handle: "huawei-pura-70-ultra", title: "HUAWEI Pura 70 Ultra", description: "512GB · أسود ملكي", descriptionHtml: "", productType: "هواتف", vendor: "Huawei", tags: ["Huawei"], options: [],
    priceRange: { min: { amount: "720", currencyCode: "USD" }, max: { amount: "720", currencyCode: "USD" } }, images: [{ url: "/manus-storage/appl-huawei-pura-70-ultra_4c087735.png", altText: "HUAWEI Pura 70 Ultra" }],
    variants: [{ id: "demo-huawei-variant", title: "512GB", availableForSale: true, price: { amount: "720", currencyCode: "USD" }, compareAtPrice: null, selectedOptions: [] }], demo: true,
  },
];

const money = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const lira = (value: number) => new Intl.NumberFormat("ar-SY", { maximumFractionDigits: 0 }).format(value * SYRIAN_POUND_PER_USD);
const minimumDownPayment = (product: Product) => "minDownPayment" in product && typeof product.minDownPayment === "number" ? product.minDownPayment : 100;
const priceOf = (product: Product) => Number(product.priceRange.min.amount);
const brandOf = (product: Product) => ["Apple", "Samsung", "Huawei"].find(brand => `${product.vendor} ${product.title} ${product.tags.join(" ")}`.toLowerCase().includes(brand.toLowerCase())) || product.vendor || "أجهزة";

export default function Home() {
  const { data } = trpc.commerce.products.list.useQuery({ first: 24 }, { retry: false });
  const liveProducts = data ?? [];
  const { cart, isOpen, closeCart, openCart, itemCount, loading, addItem, updateQuantity, removeItem } = useCart();
  const [brand, setBrand] = useState("الكل");
  const [menuOpen, setMenuOpen] = useState(false);
  const [details, setDetails] = useState<CatalogProduct | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("preview") === "iphone17" ? demoProducts[0] : null;
  });
  const [checkoutProduct, setCheckoutProduct] = useState<CatalogProduct | null>(() => {
    if (typeof window === "undefined") return null;
    const preview = new URLSearchParams(window.location.search).get("preview");
    return preview && preview !== "iphone17" ? demoProducts[0] : null;
  });
  const products: CatalogProduct[] = liveProducts.length ? liveProducts : demoProducts;
  const filteredProducts = brand === "الكل" ? products : products.filter(product => brandOf(product) === brand);

  const beginCheckout = async (product: CatalogProduct) => {
    if (!product.demo && product.variants[0]) {
      try {
        await addItem(product.variants[0].id, 1);
      } catch {
        toast.error("تعذر إضافة الهاتف إلى السلة حالياً");
        return;
      }
    }
    setDetails(null);
    setCheckoutProduct(product);
    closeCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkoutCart = () => {
    const firstItem = cart?.items[0];
    if (!firstItem) return;
    setCheckoutProduct({
      id: firstItem.variantId,
      handle: firstItem.productHandle,
      title: firstItem.productTitle,
      description: firstItem.variantTitle === "Default Title" ? "" : firstItem.variantTitle,
      descriptionHtml: "", productType: "هواتف", vendor: "Appl", tags: [], options: [],
      priceRange: { min: firstItem.unitPrice, max: firstItem.unitPrice }, images: firstItem.image ? [firstItem.image] : [], variants: [],
    });
    closeCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (checkoutProduct) return <CheckoutWizard product={checkoutProduct} cartId={cart?.id} onBack={() => setCheckoutProduct(null)} />;
  if (details) return <ProductDetails product={details} onBack={() => setDetails(null)} onCheckout={chosenProduct => beginCheckout(chosenProduct)} onCart={async chosenProduct => {
    if (chosenProduct.demo) return toast.message("أضف منتجاتك إلى Shopify لتفعيل السلة المباشرة.");
    try { await addItem(chosenProduct.variants[0].id, 1); toast.success("أضيف الهاتف إلى السلة"); } catch { toast.error("تعذر إضافة الهاتف إلى السلة"); }
  }} />;

  return <div className="min-h-screen bg-[#f7fafb] pb-[86px] md:pb-0" dir="rtl">
    <header className="app-day-header sticky top-0 z-30 border-b border-[#dbe9e7]">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
        <a className="flex items-center gap-3 text-white" href="#top"><span className="brand-mark">A</span><span className="text-xl font-extrabold">Appl</span></a>
        <nav className="hidden items-center gap-7 md:flex"><a className="nav-link" href="#catalog">الأجهزة</a><a className="nav-link" href="#installment">التقسيط</a><a className="nav-link" href="#delivery">التوصيل</a><a className="nav-link" href="/admin">للمدير</a></nav>
        <div className="flex gap-2"><button onClick={openCart} className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white" aria-label="السلة"><ShoppingBag className="h-4 w-4" />{itemCount > 0 && <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#f6b94f] text-[10px] font-extrabold text-[#071d32]">{itemCount}</span>}</button><button onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white md:hidden"><Menu className="h-5 w-5" /></button></div>
      </div>
      {menuOpen && <div className="border-t border-white/10 px-5 py-4 md:hidden"><div className="flex flex-col gap-3"><a className="nav-link" href="#catalog">الأجهزة</a><a className="nav-link" href="#installment">التقسيط</a><a className="nav-link" href="#delivery">التوصيل</a></div></div>}
    </header>
    <main id="top">
      <section className="day-hero relative overflow-hidden"><div className="absolute left-[8%] top-10 h-64 w-64 rounded-full bg-[#80e1d5]/20 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:pb-24 lg:pt-24">
          <div className="relative z-10"><div className="inline-flex items-center gap-2 rounded-full border border-[#80e1d5]/30 bg-[#80e1d5]/10 px-3 py-2 text-xs font-extrabold text-[#a9f4ea]"><Sparkles className="h-3.5 w-3.5" />تقسيط مرن بلا فوائد</div><h1 className="mt-6 text-4xl font-extrabold leading-[1.28] tracking-tight text-white sm:text-5xl lg:text-6xl">التقنية التي تريدها.<br /><span className="text-[#80e1d5]">بطريقة دفع تناسبك.</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-[#c9d7e1]">اختر هاتفك من Apple أو Samsung أو Huawei، حدّد هديتك، ثم وزّع المبلغ حتى 48 شهراً دون فوائد.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#catalog" className="button-primary inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm"><ShoppingBag className="h-4 w-4" />تصفح الأجهزة<ArrowLeft className="h-4 w-4" /></a><a href="#installment" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-bold text-white hover:bg-white/10"><CircleDollarSign className="h-4 w-4" />احسب قسطك</a></div><div className="mt-12 grid max-w-xl grid-cols-3 border-t border-white/10 pt-6 text-white"><Metric value="100$" label="أقل دفعة" /><Metric value="0%" label="فوائد تقسيط" /><Metric value="48" label="شهراً كحد أقصى" /></div></div>
          <div className="relative mx-auto w-full max-w-[440px]"><div className="day-journey-shadow absolute -inset-4 rotate-3 rounded-[42px] border border-[#80e1d5]/30" /><div className="day-journey-card relative rounded-[34px] border p-5 backdrop-blur-sm"><div className="flex items-center justify-between border-b pb-4"><span className="text-xs font-bold">رحلة طلب بسيطة</span><Zap className="h-4 w-4 text-[#f6b94f]" /></div><div className="space-y-3 py-5"><Journey no="01" title="اختر جهازك" text="السعر بالدولار والليرة" /><Journey no="02" title="اضبط خطتك" text="12 إلى 48 شهراً بلا فوائد" /><Journey no="03" title="استلم مجاناً" text="شحن DHL إلى كل المحافظات" /></div><div className="dhl-card flex items-center gap-3 rounded-2xl p-4"><Truck className="h-6 w-6" /><div><b className="block leading-none">DHL EXPRESS</b><small className="mt-1 block text-[10px] font-bold">شحن سريع ومجاني داخل سوريا</small></div></div></div></div>
        </div>
      </section>
      <section className="grid grid-cols-1 divide-y divide-[#dde9e9] border-b border-[#dde9e9] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Trust icon={<Truck className="h-5 w-5" />} title="توصيل مجاني" text="DHL لكل المحافظات" /><Trust icon={<Gift className="h-5 w-5" />} title="هدية مع كل هاتف" text="اختر ما يناسبك" /><Trust icon={<ShieldCheck className="h-5 w-5" />} title="تأهل مبدئي سريع" text="نتيجة خلال ثوانٍ" /></section>
      <section className="bg-[#071d32] py-12 sm:py-16"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-extrabold tracking-[.15em] text-[#80e1d5]">APPL CAMPAIGN / 03</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">صور الحملة، جاهزة للثقة.</h2><p className="mt-2 max-w-xl text-sm leading-7 text-[#c9d7e1]">تقسيط بلا فوائد، هدايا مع الهاتف، وتوصيل سريع إلى جميع المحافظات.</p></div><div className="hidden items-center gap-2 text-xs font-bold text-[#a9f4ea] sm:flex"><Sparkles className="h-4 w-4" />حملة Apple_shoping_sy</div></div><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><AdCard src="/manus-storage/appl-installment-ad-square_cca29602.png" title="قسط هاتفك براحة" text="دفعة تبدأ من 100$ دون فوائد" /><AdCard src="/manus-storage/appl-installment-ad-portrait_1d5c8511.png" title="اختيارك أسهل" text="أجهزة Apple وSamsung وHuawei" portrait /><AdCard src="/manus-storage/appl-dhl-delivery-ad_f3b57760.png" title="التوصيل علينا" text="DHL سريع ومجاني داخل سوريا" wide /><AdCard src="/manus-storage/appl-whatsapp-ad_58cce1ba.png" title="شارك العرض على واتساب" text="صورة جاهزة للحالات والمشاركة" portrait /></div></div></section>
      <section id="catalog" className="soft-grid scroll-mt-20 py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">CATALOGUE / 01</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#071d32] sm:text-4xl">اختر هاتفك القادم</h2><p className="mt-3 text-sm text-slate-500">أسعار واضحة بالدولار والليرة، وخطة تقسيط مرنة لكل جهاز.</p></div><div className="flex flex-wrap gap-2">{["الكل", "Apple", "Samsung", "Huawei"].map(item => <button key={item} onClick={() => setBrand(item)} className={`rounded-full px-4 py-2 text-xs font-extrabold ${brand === item ? "bg-[#071d32] text-[#80e1d5]" : "border border-slate-200 bg-white text-slate-500 hover:border-[#80e1d5]"}`}>{item}</button>)}</div></div>{!liveProducts.length && <div className="mt-7 flex gap-3 rounded-2xl border border-[#eadca9] bg-[#fffaf0] p-4 text-sm text-[#6d5a1b]"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p><b>كتالوج المعاينة:</b> سيُستبدل تلقائياً بمنتجات Shopify فور إضافتها ونشرها. السعر النهائي يثبت عند مراجعة الطلب.</p></div>}<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map(product => <ProductCard key={product.id} product={product} details={() => setDetails(product)} add={async () => { if (product.demo) return toast.message("أضف منتجاتك إلى Shopify لتفعيل السلة المباشرة."); try { await addItem(product.variants[0].id, 1); toast.success("أضيف الهاتف إلى السلة"); } catch { toast.error("تعذر إضافة الهاتف إلى السلة"); } }} />)}</div></div></section>
      <section id="installment" className="scroll-mt-20 bg-[#edf7f5] py-16 sm:py-20"><div className="mx-auto grid max-w-7xl gap-9 px-5 lg:grid-cols-[.95fr_1.05fr] lg:items-center"><div><p className="eyebrow">FLEXIBLE / 02</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#071d32] sm:text-4xl">تمويل واضح،<br />من دون فوائد.</h2><p className="mt-5 max-w-md text-sm leading-8 text-slate-500">ادفع 100$ كحد أدنى أو اختر 150$ لتحصل على خصم 10% من سعر الجهاز. بعدها تختار المدة المناسبة من سنة إلى أربع سنوات.</p><div className="mt-7 space-y-3"><Feature text="أقساط شهرية ثابتة على المبلغ المتبقي" /><Feature text="لا فوائد ولا رسوم توصيل إضافية" /><Feature text="عرض القسط بالدولار والليرة قبل التأكيد" /></div></div><div className="rounded-[30px] bg-[#071d32] p-6 text-white shadow-2xl sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#80e1d5]">مثال توضيحي</p><p className="mt-1 text-xl font-extrabold">هاتف بسعر 900$</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#80e1d5] text-[#071d32]"><CircleDollarSign className="h-6 w-6" /></span></div><div className="mt-8 grid grid-cols-2 gap-3"><PlanBox title="دفعة 100$" amount="33.33$" note="شهرياً لمدة 24 شهراً" /><PlanBox title="دفعة 150$" amount="27.50$" note="بعد خصم 10% · 24 شهراً" light /></div><p className="mt-6 text-xs leading-6 text-[#c9d7e1]">نتيجة التأهل في الموقع مبدئية وتخضع لمراجعة فريق Appl.</p></div></div></section>
      <section id="delivery" className="scroll-mt-20 bg-white py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5"><div className="grid gap-8 rounded-[32px] bg-[#f8fbfb] p-6 sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><div className="dhl-card inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold"><Truck className="h-5 w-5" />DHL Express</div><h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#071d32] sm:text-4xl">شحن سريع بلا مقابل.</h2><p className="mt-4 max-w-md text-sm leading-8 text-slate-500">نرتّب توصيل هاتفك مجاناً إلى جميع المحافظات والمناطق السورية، مع متابعة للطلب حتى الاستلام.</p><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-[#071d32]"><Info className="h-4 w-4 text-[#25887e]" />استلام موثّق</p><p className="mt-2 text-xs leading-6 text-slate-500">يُرجى إبراز الهوية الشخصية للمندوب عند الاستلام، ثم مراجعة العقد وتوقيعه.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><DeliveryPoint title="كل المحافظات" text="اختيار المحافظة والمنطقة في نموذج التوصيل" /><DeliveryPoint title="معلم قريب" text="وصف يساعد مندوب DHL على الوصول" /><DeliveryPoint title="رقم بديل اختياري" text="لضمان استلام سلس عند تعذر التواصل" /><DeliveryPoint title="توصيل مجاني" text="لا رسوم شحن إضافية على طلبك" /></div></div></div></section>
      <section className="bg-[#071d32] py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 sm:flex-row sm:items-center"><div><p className="text-xl font-extrabold text-white">اختر هاتفك، والباقي علينا.</p><p className="mt-2 text-sm text-[#c9d7e1]">اطلب خلال دقائق وحدد خطة سدادك.</p></div><a href="#catalog" className="button-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm">ابدأ طلبك الآن<ArrowLeft className="h-4 w-4" /></a></div></section>
    </main>
    <StoreFooter />
    <MobileBottomNav itemCount={itemCount} openCart={openCart} />
    {isOpen && <CartDrawer cart={cart} close={closeCart} checkout={checkoutCart} update={updateQuantity} remove={removeItem} loading={loading} />}
  </div>;
}

function ProductDetails({ product, onBack, onCheckout, onCart }: { product: CatalogProduct; onBack: () => void; onCheckout: (product: CatalogProduct) => void; onCart: (product: CatalogProduct) => void }) {
  const firstVariant = product.variants[0];
  const readOption = (variant: typeof firstVariant, matcher: RegExp) => variant?.selectedOptions?.find(option => matcher.test(option.name + " " + option.value))?.value || "";
  const colorMatcher = /color|colour|لون/i;
  const storageMatcher = /storage|capacity|سعة|تخزين/i;
  const colorValues = Array.from(new Set(product.variants.map(variant => readOption(variant, colorMatcher)).filter(Boolean)));
  const storageValues = Array.from(new Set(product.variants.map(variant => readOption(variant, storageMatcher)).filter(Boolean)));
  const [selectedColor, setSelectedColor] = useState(readOption(firstVariant, colorMatcher));
  const [selectedStorage, setSelectedStorage] = useState(readOption(firstVariant, storageMatcher));
  const selectedVariant = product.variants.find(variant => readOption(variant, colorMatcher) === selectedColor && readOption(variant, storageMatcher) === selectedStorage) || firstVariant;
  const selectedProduct: CatalogProduct = selectedVariant ? { ...product, description: product.description + (product.variants.length > 1 ? " · " + selectedVariant.title : ""), priceRange: { min: selectedVariant.price, max: selectedVariant.price }, variants: [selectedVariant] } : product;
  const price = priceOf(selectedProduct);
  const colorClass = (name: string) => name.includes("برتقالي") || name.includes("Orange") ? "bg-[#de6e28]" : name.includes("فضي") || name.includes("Silver") || name.includes("Gray") ? "bg-[#d9dee2] ring-1 ring-slate-300" : name.includes("كحلي") || name.includes("Blue") || name.includes("Navy") ? "bg-[#1c324b]" : name.includes("ذهبي") || name.includes("Gold") ? "bg-[#d2a94b]" : name.includes("عنابي") || name.includes("Burgundy") ? "bg-[#7c2639]" : name.includes("سماوي") || name.includes("Sky") ? "bg-[#8ed8ee]" : name.includes("أبيض") || name.includes("White") ? "bg-white ring-1 ring-slate-300" : name.includes("أسود") || name.includes("Black") ? "bg-[#111827]" : "bg-[#80e1d5]";
  const chooseColor = (value: string) => {
    setSelectedColor(value);
    const next = product.variants.find(variant => readOption(variant, colorMatcher) === value && (!selectedStorage || readOption(variant, storageMatcher) === selectedStorage));
    if (next) setSelectedStorage(readOption(next, storageMatcher));
  };
  const chooseStorage = (value: string) => {
    setSelectedStorage(value);
    const next = product.variants.find(variant => readOption(variant, storageMatcher) === value && (!selectedColor || readOption(variant, colorMatcher) === selectedColor));
    if (next) setSelectedColor(readOption(next, colorMatcher));
  };
  return <div className="min-h-screen bg-[#f7fafb]" dir="rtl">
    <header className="navy-grid border-b border-white/10"><div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5"><button onClick={onBack} className="flex items-center gap-2 text-sm font-extrabold text-[#c9d7e1] hover:text-white"><ArrowRight className="h-4 w-4" />العودة للمتجر</button><a className="flex items-center gap-3 text-white" href="/"><span className="brand-mark">A</span><span className="text-xl font-extrabold">Appl</span></a></div></header>
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-2 lg:items-center">
      <div className="relative order-1 grid min-h-[420px] place-items-center overflow-hidden rounded-[34px] bg-gradient-to-br from-[#eef8f6] to-[#f8fafc] lg:order-2"><div className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-extrabold text-[#25887e]">اختيارك المفضل</div><img src={product.images[0]?.url} alt={product.title} className="h-[360px] w-[310px] object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105" /></div>
      <div className="order-2 lg:order-1"><span className="rounded-full bg-[#eaf8f4] px-3 py-1.5 text-xs font-extrabold text-[#17845e]">{brandOf(product)}</span><h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#071d32]">{product.title}</h1><p className="mt-3 text-sm leading-7 text-slate-500">{product.description || "هاتف ذكي متاح مع خطة تقسيط مرنة."}</p>
        {colorValues.length > 0 && <section className="mt-7 rounded-[24px] border border-[#dbe9e7] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold text-[#071d32]">اختر اللون</p><p className="mt-1 text-[11px] text-slate-400">ألوان أصلية متوفرة لهذا الجهاز</p></div><span className="rounded-full bg-[#effbf8] px-2.5 py-1 text-[10px] font-extrabold text-[#17845e]">{selectedColor || "اختر"}</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{colorValues.map(value => <button key={value} onClick={() => chooseColor(value)} aria-pressed={selectedColor === value} className={`group flex items-center gap-3 rounded-2xl border p-3 text-right transition-all duration-200 ${selectedColor === value ? "border-[#25887e] bg-[#effbf8] shadow-[0_0_0_2px_rgba(37,136,126,.12)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#80e1d5]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${colorClass(value)} shadow-inner`}><span className={`h-2.5 w-2.5 rounded-full bg-white/70 transition ${selectedColor === value ? "scale-100" : "scale-0"}`} /></span><span className="min-w-0"><b className="block truncate text-xs text-[#071d32]">{value}</b><small className="mt-0.5 block text-[10px] text-slate-400">متاح الآن</small></span></button>)}</div></section>}
        {storageValues.length > 0 && <section className="mt-4 rounded-[24px] border border-[#dbe9e7] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm font-extrabold text-[#071d32]">اختر سعة التخزين</p><p className="mt-1 text-[11px] text-slate-400">مساحة أكبر للصور والتطبيقات</p></div><span className="rounded-full bg-[#f6f8fa] px-2.5 py-1 text-[10px] font-extrabold text-slate-500">{selectedStorage || "اختر"}</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{storageValues.map(value => <button key={value} onClick={() => chooseStorage(value)} aria-pressed={selectedStorage === value} className={`relative rounded-2xl border px-3 py-3 text-right transition-all duration-200 ${selectedStorage === value ? "border-[#071d32] bg-[#071d32] text-white shadow-lg" : "border-slate-200 bg-white text-[#071d32] hover:-translate-y-0.5 hover:border-[#80e1d5]"}`}><b className="block text-base font-extrabold">{value}</b><small className={`mt-1 block text-[10px] ${selectedStorage === value ? "text-[#b5eee6]" : "text-slate-400"}`}>سعة التخزين</small>{selectedStorage === value && <Check className="absolute left-3 top-3 h-4 w-4 text-[#80e1d5]" />}</button>)}</div></section>}
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#eaf8f4] px-4 py-3"><span className="text-xs font-bold text-[#3f5a6d]">اختيارك الحالي</span><b className="text-xs text-[#071d32]">{selectedVariant?.title || "المتغير الافتراضي"}</b></div>
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><p className="font-mono text-3xl font-bold text-[#071d32]">${money(price)}</p><p className="mt-1 text-sm font-bold text-slate-500">{lira(price)} ل.س تقريباً</p><p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#17845e]"><Check className="h-4 w-4" />من ${money(Math.max(0, (price - minimumDownPayment(selectedProduct)) / 48))} شهرياً عند خطة 48 شهراً</p></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><Gift className="h-5 w-5 text-[#25887e]" /><b className="mt-3 block text-sm text-[#071d32]">هدية مجانية</b><p className="mt-1 text-xs text-slate-500">تختارها في الخطوة التالية</p></div><div className="rounded-2xl border border-slate-200 p-4"><Truck className="h-5 w-5 text-[#25887e]" /><b className="mt-3 block text-sm text-[#071d32]">توصيل DHL</b><p className="mt-1 text-xs text-slate-500">مجاني لكل المحافظات</p></div></div><div className="mt-7 grid grid-cols-[1fr_54px] gap-3"><button onClick={() => onCheckout(selectedProduct)} className="button-dark h-13 rounded-xl text-sm">ابدأ طلب التقسيط<ArrowLeft className="mr-2 inline h-4 w-4" /></button><button onClick={() => onCart(selectedProduct)} className="grid h-13 place-items-center rounded-xl border border-[#cfe0e2] text-[#25887e]"><ShoppingBag className="h-5 w-5" /></button></div>
      </div>
    </main><StoreFooter />
  </div>;
}

function ProductCard({ product, details, add }: { product: CatalogProduct; details: () => void; add: () => void }) { const price = priceOf(product); return <article className="product-card"><div className="product-image-wrap relative"><span className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-[#25887e]">{brandOf(product)}</span>{product.handle === "iphone-17-pro-max" && <span className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-orange-600 shadow-sm animate-pulse"><Sparkles className="h-3.5 w-3.5" />ملصق جديد</span>}<button className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm hover:text-red-400"><Heart className="h-4 w-4" /></button>{product.images[0]?.url ? <img className="product-image" src={product.handle === "iphone-17-pro-max" ? "/manus-storage/iphone-17-pro-max-orange-sticker_b596cb30.png" : product.images[0].url} alt={product.handle === "iphone-17-pro-max" ? "ملصق iPhone 17 Pro Max باللون البرتقالي" : (product.images[0].altText || product.title)} /> : <Smartphone className="h-20 w-20 text-slate-300" />}</div><div className="p-5"><p className="text-[11px] font-bold text-slate-400">{product.description || "متاح بالتقسيط دون فوائد"}</p><h3 className="mt-1 text-lg font-extrabold text-[#071d32]">{product.title}</h3><div className="mt-5 flex items-end justify-between"><div><p className="font-mono text-2xl font-bold text-[#071d32]">${money(price)}</p><p className="mt-1 text-xs font-bold text-slate-500">{lira(price)} ل.س تقريباً</p></div><span className="rounded-lg bg-[#eaf8f4] px-2.5 py-1.5 text-[10px] font-extrabold text-[#17845e]">من ${money(Math.max(0, (price - minimumDownPayment(product)) / 48))}/شهر</span></div><div className="mt-5 grid grid-cols-[1fr_46px] gap-2"><button onClick={details} className="button-dark h-11 rounded-xl text-sm">التفاصيل والتقسيط</button><button onClick={add} className="grid h-11 place-items-center rounded-xl border border-[#cfe0e2] text-[#25887e] hover:bg-[#eaf8f4]"><ShoppingBag className="h-4 w-4" /></button></div></div></article>; }
function CartDrawer({ cart, close, checkout, update, remove, loading }: { cart: Cart | null; close: () => void; checkout: () => void; update: (line: string, qty: number) => Promise<void>; remove: (line: string) => Promise<void>; loading: boolean }) { return <div className="fixed inset-0 z-50 flex items-end bg-[#071d32]/45 md:block" onClick={close}><aside className="flex h-[86dvh] w-full flex-col rounded-t-[30px] bg-white shadow-2xl md:mr-auto md:h-full md:max-w-md md:rounded-none" onClick={event => event.stopPropagation()}><div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" /><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-extrabold text-[#071d32]">سلة الشراء</h2><p className="text-xs text-slate-500">يُحسب التقسيط في الخطوة التالية</p></div><button onClick={close} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500"><X className="h-5 w-5" /></button></div>{!cart?.items.length ? <div className="grid flex-1 place-items-center text-sm font-bold text-slate-500">سلتك فارغة</div> : <><div className="flex-1 space-y-4 overflow-y-auto p-5">{cart.items.map(item => <div key={item.lineId} className="flex gap-3 rounded-2xl border border-slate-100 p-3"><div className="grid h-16 w-16 place-items-center rounded-xl bg-[#f1f8f7]">{item.image ? <img className="h-14 w-12 object-contain" src={item.image.url} alt="" /> : <Smartphone className="h-6 w-6 text-slate-300" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#071d32]">{item.productTitle}</p><p className="font-mono mt-1 text-sm font-bold text-[#25887e]">${item.unitPrice.amount}</p><div className="mt-2 flex justify-between"><span className="flex items-center rounded-lg border border-slate-200"><button onClick={() => update(item.lineId, Math.max(1, item.quantity - 1))} className="grid h-9 w-9 place-items-center"><Minus className="h-3 w-3" /></button><b className="w-7 text-center text-xs">{item.quantity}</b><button onClick={() => update(item.lineId, item.quantity + 1)} className="grid h-9 w-9 place-items-center"><Plus className="h-3 w-3" /></button></span><button onClick={() => remove(item.lineId)} className="text-xs font-bold text-red-400">حذف</button></div></div></div>)}</div><div className="border-t border-slate-100 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"><div className="mb-4 flex justify-between"><span className="text-sm font-bold text-slate-500">المجموع</span><b className="font-mono text-[#071d32]">${cart.subtotal.amount}</b></div><button disabled={loading} onClick={checkout} className="button-dark h-13 w-full rounded-2xl text-sm disabled:opacity-60">ابدأ طلب التقسيط<ArrowLeft className="mr-2 inline h-4 w-4" /></button></div></>}</aside></div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div><p className="font-mono text-xl font-bold text-[#80e1d5]">{value}</p><p className="mt-1 text-[10px] font-bold text-[#a9bdcb]">{label}</p></div>; }
function Journey({ no, title, text }: { no: string; title: string; text: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-white/[.06] p-3"><span className="font-mono text-xs text-[#80e1d5]">{no}</span><span><b className="block text-sm text-white">{title}</b><small className="mt-0.5 block text-[10px] text-[#c9d7e1]">{text}</small></span><ChevronLeft className="mr-auto h-4 w-4 text-[#80e1d5]" /></div>; }
function Trust({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className="flex items-center justify-center gap-4 bg-white px-5 py-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf8f4] text-[#25887e]">{icon}</span><span><b className="block text-sm text-[#071d32]">{title}</b><small className="mt-1 block text-[11px] text-slate-500">{text}</small></span></div>; }
function Feature({ text }: { text: string }) { return <p className="flex items-center gap-3 text-sm font-bold text-[#3f5a6d]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#80e1d5] text-[#071d32]"><Check className="h-3.5 w-3.5" /></span>{text}</p>; }
function PlanBox({ title, amount, note, light }: { title: string; amount: string; note: string; light?: boolean }) { return <div className={`rounded-2xl p-4 ${light ? "bg-[#80e1d5] text-[#071d32]" : "bg-white/10 text-white"}`}><p className="text-xs font-bold opacity-75">{title}</p><p className="font-mono mt-2 text-2xl font-bold">{amount}</p><p className="mt-1 text-[10px] font-bold opacity-70">{note}</p></div>; }
function DeliveryPoint({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><Truck className="h-5 w-5 text-[#25887e]" /><b className="mt-4 block text-sm text-[#071d32]">{title}</b><small className="mt-1 block text-[11px] leading-5 text-slate-500">{text}</small></div>; }
function MobileBottomNav({ itemCount, openCart }: { itemCount: number; openCart: () => void }) { return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"><div className="mx-auto grid max-w-md grid-cols-4 gap-1"><a href="#top" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold text-[#25887e]"><House className="h-5 w-5" />الرئيسية</a><a href="#catalog" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold text-slate-500"><LayoutGrid className="h-5 w-5" />الأجهزة</a><a href="#installment" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold text-slate-500"><CircleDollarSign className="h-5 w-5" />التقسيط</a><button onClick={openCart} className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold text-slate-500"><ShoppingBag className="h-5 w-5" />السلة{itemCount > 0 && <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#f6b94f] px-1 text-[9px] text-[#071d32]">{itemCount}</span>}</button></div></nav>; }

function AdCard({ src, title, text, portrait, wide }: { src: string; title: string; text: string; portrait?: boolean; wide?: boolean }) {
  return <article className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/10">
    <img src={src} alt={title} className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${portrait ? "h-[300px]" : wide ? "h-[220px]" : "h-[220px]"}`} />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071d32] via-[#071d32]/80 to-transparent p-5 pt-16">
      <p className="text-lg font-extrabold text-white">{title}</p>
      <p className="mt-1 text-xs font-bold text-[#a9f4ea]">{text}</p>
    </div>
  </article>;
}
