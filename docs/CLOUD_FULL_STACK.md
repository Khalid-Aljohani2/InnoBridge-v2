# نشر InnoBridge بالكامل على السحابة

الهدف: **قاعدة بيانات واحدة على Supabase** + **خادم تطبيق (Laravel) على السحابة** + (اختياري) **واجهة SPA منفصلة** أو الاكتفاء بـ **Inertia** المجمّعة مع Laravel.

لا تحتاج «مشروع Supabase جديد» إذا كان مشروعك الحالي سليمًا — تحتاج **ربط `.env` على السيرفر** بنفس Postgres، وليس SQLite محليًا.

**في المونوريبو هذا:** التطبيق الحقيقي يعمل من **`smart-rnd-platform/`**؛ تأكّد أن **`smart-rnd-platform/.env`** هو الذي يضم **`DB_CONNECTION=pgsql`**. أي **`.env` في جذر المستودع** لا يستخدمه Laravel تلقائيًا إذا تشغّل Artisan من مجلّد **`smart-rnd-platform`** — لذلك قد تعتقد أن الإعداد على السحابة بينما التطبيق ما زال على SQLite من ملف مختلف.

---

## 1) Supabase — قاعدة البيانات (مصدر واحد للمستخدمين وجداول Laravel)

1. من لوحة المشروع: **Project Settings → Database**.
2. انسخ **Connection string → Transaction pooler** (غالبًا منفذ **6543**) لاستخدامها كـ **`DB_URL`** في Laravel على السيرفر.
3. **لا** تعتمد على مفتاح **anon** لتسجيل الدخول عبر Laravel — المصادقة تتم على جدول **`public.users`** عبر PDO.

في **`smart-rnd-platform/.env`** على السيرفر (ولا ترفعه إلى Git):

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.example.com

DB_CONNECTION=pgsql
DB_URL="postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
DB_SSLMODE=require
```

بدون عنوان واحد:

```env
DB_CONNECTION=pgsql
DB_HOST=aws-0-xxxx.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.xxxxxxxxxxxxxxxx
DB_PASSWORD=***
DB_SSLMODE=require
```

تأكّد أن كلمة المرور في الرابط مُرمّزة لو احتوت رموزًا خاصة (`@`، `#`، …).

---

## 2) Laravel على السيرفر — بناء وجلسات وطوابير

الجلسات والكاش والطوابير عندكم مضبوطة افتراضيًا على **`database`**؛ مع **Postgres** تعمل كلها على السحابة دون Redis (يمكنكم لاحقًا ترقية لـ Redis).

```bash
cd smart-rnd-platform
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan db:seed --force   # إن كنت تستخدم بذور إنتاج (اختياري)
php artisan app:verify-db      # يجب أن يظهر driver=pgsql وعدد users متوافق مع Table Editor
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

- **`public/`** يجب أن يكون **document root** للويب سيرفر (وليس مجلد المستودع كاملًا).

- وراء **HTTPS** والعكس عبر وسيط أمامي — إذا ظهرت روابط **`http`** أو IPs خاطئة، راجع **`TRUSTED_PROXIES`** في توثيق Laravel لبيئة الاستضافة.

---

## 3) واجهة واحدة مع الباكند (Inertia — الأغلب اليوم)

- بعد **`npm run build`** تصبح الواجهة داخل **`public/build`**؛ المستخدم يفتح **`APP_URL`** فقط.
- **`APP_URL`** يجب أن يطابق الـ HTTPS العلني (يجنّب مخالفات الجلسات وروابط Ziggy/Vite).

---

## 4) واجهة منفصلة (SPA في `frontend/` على Vercel / Netlify)

1. **`VITE_API_BASE_URL=https://api.yourdomain.com`** (أو نفس الدومين إذا وُجهت **`/api`** لنفس التطبيق).
2. على Laravel:

```env
FRONTEND_URL=https://spa.yourdomain.com
CORS_ALLOWED_ORIGINS=https://spa.yourdomain.com
```

---

## 5) الملفات والمرفقات (`FILESYSTEM_DISK=local`)

على خواديم **Stateful قصيرة العمر** (عدة PaaS) المجلد المحلي يُصفّر بين النشرين. للإنتاج يُفضّل **S3** أو **Supabase Storage** بتعريف **`FILESYSTEM_DISK=s3`** (أو قرص شبكي مستمر). إن لم ترفعوا ملفات كبيرة بعد، يمكن التأجيل مع العلم أن الافتراضي الحالي **`local`**.

---

## 6) البريد والوظائف الخلفية

- **`MAIL_*`**: ضبّوها لمزود بريد حقيقي (لإعادة تعيين كلمة المرور وغيرها).
- **`QUEUE_CONNECTION=database`** يتطلّب **مسار تشغيل دائم** لـ **`php artisan queue:work`** (أو مشرف systemd / خدمة المنصّة)، وإلا تبقى الوظائف في الجدول دون تنفيذ.

---

## 7) قائمة تحقق سريعة

| البند | حالة |
|--------|------|
| `DB_CONNECTION=pgsql` وليس sqlite | □ |
| `php artisan app:verify-db` يعرض Postgres وعداد users منطقي | □ |
| `APP_DEBUG=false`, `APP_KEY` مُولَّد على السيرفر | □ |
| `APP_URL` = HTTPS الذي يفتحه المستخدم | □ |
| مُهاجَر **`migrate --force`** على نفس Postgres | □ |
| عميل الطابور إن احتجت Jobs | □ |
| SPA: `FRONTEND_URL` + CORS إن كان أصل مختلفًا | □ |

لتفاصيل Nginx ومثال إعداد عام، راجع **`docs/DEPLOYMENT.md`** و **`deploy/nginx-laravel.example.conf`**.
