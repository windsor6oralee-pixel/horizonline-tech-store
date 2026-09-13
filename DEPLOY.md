# رفع Horizonline Tech Store على Railway (مجاناً)

## لماذا Railway وليس Netlify؟
المشروع يحتوي على **Express server** و **قاعدة بيانات MySQL** — Netlify مخصص للمواقع الثابتة فقط ولا يدعم هذا النوع.
Railway يدعم Node.js + MySQL مجاناً ($5 رصيد شهري يكفي لمشروع صغير).

---

## الخطوات

### 1. رفع الكود على GitHub
```bash
cd "هواتف جديد"
git init
git add .
git commit -m "Initial commit: Horizonline Tech Store"
# أنشئ repository جديد على github.com ثم:
git remote add origin https://github.com/USERNAME/horizonline-tech-store.git
git push -u origin main
```

### 2. إنشاء مشروع على Railway
1. افتح [railway.app](https://railway.app) وسجّل بحساب GitHub
2. اضغط **New Project** → **Deploy from GitHub repo**
3. اختر الـ repository

### 3. إضافة قاعدة البيانات MySQL
1. في المشروع اضغط **+ New** → **Database** → **MySQL**
2. Railway سيضيف `DATABASE_URL` تلقائياً للمتغيرات

### 4. إعداد متغيرات البيئة
في Railway → Variables، أضف:
```
JWT_SECRET=<مفتاح عشوائي قوي، مثال: openssl rand -hex 32>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<كلمة مرور قوية>
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_API_ACCESS_TOKEN=<توكن Shopify Storefront API>
NODE_ENV=production
```

### 5. تشغيل migrations قاعدة البيانات
بعد أول deploy ناجح، افتح Shell في Railway وشغّل:
```bash
pnpm db:push
```

### 6. النطاق
في خدمة الموقع (وليس MySQL): **Settings → Networking → Generate Domain**.
عندما يسأل عن الـ Port اكتب **8080** (Railway يمرر `PORT=8080` للتطبيق). إذا ظهر 502، فالمنفذ خاطئ — عدّله من أيقونة القلم بجانب الرابط.

الرابط الحالي: https://horizonline-tech-store-production.up.railway.app

ملاحظات:
- المتغيرات تُضاف في خدمة الموقع `horizonline-tech-store`، وليس في خدمة MySQL (تعديل متغيرات MySQL يظهر تحذيراً ويجب إلغاؤه).
- أضمن صيغة لـ `DATABASE_URL` هي الربط التلقائي: `${{MySQL.MYSQL_URL}}`.
- تحذير `OAUTH_SERVER_URL is not configured` في اللوجز غير مؤثر؛ تسجيل دخول الإدارة يعتمد على `ADMIN_USERNAME`/`ADMIN_PASSWORD`.

---

## أوامر مفيدة محلياً
```bash
pnpm dev       # وضع التطوير
pnpm build     # بناء للإنتاج
pnpm start     # تشغيل الإنتاج
pnpm db:push   # تطبيق migrations
```
