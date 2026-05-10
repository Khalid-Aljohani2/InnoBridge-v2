# Supabase و Row Level Security (RLS)

## كيف يتصل هذا المشروع بقاعدة البيانات؟

- **Laravel (`smart-rnd-platform`)** يتصل عادة بـ PostgreSQL عبر **`DB_*`** في `.env` (بما في ذلك مشروع Supabase كمضيف Postgres). هذا المسار يستخدم حسابًا يملك امتيازًا كاملًا على مخطّط التطبيق، لذا **سياسات RLS لا تحدّ المتصفّح** عبر Eloquent؛ الحماية تأتي من **صلاحيات Sanctum** و**سياسات التطبيق** في المتحكمات والسياسات (Policies).

- **تسجيل الدخول (صفحة Inertia):** Laravel يستخدم **جدول users** وبريد bcrypt (`$2y$...`)؛ ليس عبر **Supabase Auth** ولا مفتاح **anon**. إذا ظهرت «بيانات الدخول غير متطابقة» بينما ترى الصفوف في Supabase Table Editor، فغالبًا التطبيق **لا يستخدم نفس Postgres** (مثل بقاء **`DB_CONNECTION=sqlite`**) — عيّن **`DB_CONNECTION=pgsql`** ومفاتيح **`DB_*`/`DB_URL`** ثم **`php artisan config:clear`**.

- **`frontend/` (SPA)** عند تمكين **`VITE_SUPABASE_URL`** و **`VITE_SUPABASE_ANON_KEY`** يمكنه استخدام **`@supabase/supabase-js`** مع **مفتاح anon** فقط. في هذا الوضع **يجب تفعيل RLS** على الجداول والمخططات المعرّضة للقراءة/الكتابة من المتصفّح حتى لا يطلع المستخدم على بيانات غيره.

## ماذا تفعل في لوحة Supabase؟

1. لكل جدول تُتيح الوصول إليه بمفتاح **anon** من الواجهة: **فعِّل RLS** من SQL أو من واجهة الجدول.
2. أضف **سياسات** تربط الصفوف بـ **`auth.uid()`** (إن اعتمدت **Supabase Auth**) أو بتعريف واضح لما يعتبر «ملكًا للمستخدم الحالي».

## مختبرات ومفاتيح

- لا ترفع **`service_role`** أو أسرار الاتصال الكاملة إلى GitHub؛ استخدم **`VITE_SUPABASE_ANON_KEY`** على الفرونت فقط.
- لمزيد من إعداد الإنتاج وPostgres وراء Laravel: **`docs/DEPLOYMENT.md`**.
