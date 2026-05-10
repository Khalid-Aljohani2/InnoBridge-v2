# النشر وفصل الواجهة عن الخادم — InnoBridge Smart R&D

## أين كل شيء؟ (مصدر الحقيقة)

| الجزء | المسار في المستودع | الوصف |
|------|-------------------|--------|
| **الباكند (Laravel 12)** | **`smart-rnd-platform/`** | التطبيق الرئيسي: قاعدة البيانات، الجلسات، Inertia، وREST تحت **`/api`**. |
| **اختصار «backend»** | **`backend/`** | على Windows: **Junction** → نفس مجلد `smart-rnd-platform` (لا تكرار للكود). |
| **الفرونت الحالي (إنتاج)** | **`smart-rnd-platform/resources/js`** + **`npm run build`** | واجهة **Inertia + React**. تُبنى داخل Laravel إلى **`smart-rnd-platform/public/build`**. المتصفّح يفتح **`APP_URL`** (نفس الدومين للباكند). |
| **الفرونت المنفصل (SPA)** | **`frontend/`** | **Vite + React + TS** يستهلك **`VITE_API_BASE_URL`** ويطلب **`/api/...`**. مناسب لو دومين/خادم ويب منفصل للـ SPA فقط. |

> **Supabase**: المنصّة لا تستخدم «مفتاح anon» على الخادم. الربط المعتمد هو **PostgreSQL** عبر **`DB_*`** أو **`DB_URL`** إلى مشروع Supabase (انظر **`smart-rnd-platform/.env.example`**).

---

## 1) ربط Supabase (PostgreSQL)

1. في لوحة Supabase: **Project Settings → Database** — انسخ:
   - **Connection string** (يفضّل **Transaction pooler** للتطبيقات على السيرفر: غالبًا منفذ **6543**).
   - أو: Host، Port، Database، User، Password.

2. في **`smart-rnd-platform/.env`** (انسخ من **`.env.example`**):

```env
DB_CONNECTION=pgsql
DB_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?sslmode=require"
DB_SSLMODE=require
```

أو بدون عنوان واحد:

```env
DB_CONNECTION=pgsql
DB_HOST=xxx.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.xxxxxxxxxxxx
DB_PASSWORD=your_password
DB_SSLMODE=require
```

3. على السيرفر:

```bash
cd smart-rnd-platform
php artisan migrate --force
php artisan app:verify-db
php artisan config:cache
php artisan route:cache
```

4. **`SESSION_DRIVER`** و **`CACHE_STORE`** و **`QUEUE_CONNECTION`**: مع Postgres يمكن الإبقاء على `database`؛ أو استخدام **Redis** في الإنتاج إن توفّر.

---

## 2) بناء الفرونت «الحالي» (Inertia — مع الباكند)

هذا هو المسار الافتراضي لمعظم الصفحات اليوم:

```bash
cd smart-rnd-platform
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```

- الناتج في **`public/build`**؛ **Nginx/Apache** يوجّه الجذر إلى **`public/`** ويمرّر طلب PHP إلى **`index.php`**.
- **`APP_URL`** يجب أن يطابق **الـ HTTPS** الذي يراه المستخدم.

---

## 3) نشر SPA المنفصل (`frontend/`)

1. **`frontend/.env.production`** (أو المتغيرات في CI):

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

2. بناء الواجهة:

```bash
cd frontend
npm ci
npm run build
```

- ارفع محتويات **`frontend/dist`** إلى استضافة ثابتة (CDN / Nginx `root`).
3. باكند Laravel على **`https://api.yourdomain.com`**:
   - **`FRONTEND_URL`** = عنوان الـ SPA.
   - **`CORS_ALLOWED_ORIGINS`** = عنوان الـ SPA (صفوف مفصولة بفواصل).
   - **`SANCTUM_STATEFUL_DOMAINS`** إن استخدمت كوكيز Sanctum مع نفس الجذر؛ للـ Bearer token لا حاجة.

---

## 4) فحص قبل الإطلاق

- `php artisan app:verify-db`
- `php artisan migrate:status`
- تأكّد **`APP_DEBUG=false`** و **`APP_KEY`** معبّأ في الإنتاج.
- تشغيل **queue worker** إن كان `QUEUE_CONNECTION=database` ومستخدموك يعتمدون على Jobs.

---

## 5) مثال موجز لـ Nginx (Laravel + `public/build`)

يوجد **`deploy/nginx-laravel.example.conf`** في المستودع كمرجع (عدّل `server_name` ومسارات PHP-FPM).

---

## 6) كل شيء على السحابة (Supabase + استضافة Laravel)

دليل خطوة بخطوة (قالب `.env`، الهجرات، Inertia أو SPA منفصل، الطوابير، الملفات): راجع **`docs/CLOUD_FULL_STACK.md`**.
