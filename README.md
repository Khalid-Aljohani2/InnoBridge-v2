# InnoBridge / Smart R&D Platform — دليل الهيكلة والمصدر الحقيقة

المشروع **monorepo**: باكند **Laravel 12** (قاعدة بيانات + HTTP + جزء كبير من الواجهة عبر **Inertia + React**)، وطبقة **`frontend/`** المنفصلة (SPA بـ **Vite + React + TypeScript**) للاتصال بـ **REST API** تحت **`/api`**.

**نشر الإنتاج وربط Supabase (PostgreSQL)**: راجع **`docs/DEPLOYMENT.md`**. **دليل «كل شيء على السحابة» (قالب واحد متكامل):** **`docs/CLOUD_FULL_STACK.md`**. **RLS ومفاتيح anon من المتصفّح**: راجع **`docs/SUPABASE_RLS.md`**. أمثلة Nginx: **`deploy/nginx-laravel.example.conf`**. التحقق من اتصال قاعدة البيانات: `php artisan app:verify-db` داخل **`smart-rnd-platform`**.

> **وضوح مهم:** «الفصل» الحالي لا يعني أن كل الشاشات انتقلت للـ SPA خارج Laravel. الواجهة الإنتاجية اليوم لا تزال تعتمد **Inertia** (`resources/js/Pages`). تطبيق **`frontend/`** جاهز لاستدعاء الـ API ويمكن ترحيل الشاشات إليه تدريجياً.

### هيكلة المجلدات

| المسار | الوصف |
|--------|--------|
| **`backend/`** | **ارتباط (Windows Junction)** يشير إلى **`smart-rnd-platform`** — لا نسخ ثانية؛ نفس أكواد Laravel. |
| **`smart-rnd-platform/`** | مشروع Laravel الفعلي: Composer، `artisan`، الهجرات، Inertia تحت **`resources/js`**. |
| **`frontend/`** | **Vite + React + TypeScript**؛ عميل SPA يعتمد **`VITE_API_BASE_URL`** و**`/api`** دون روابط ثابثة للإنتاج. |

---

## 1) خارطة الطريق — كيف يطلب الفرونت إند البيانات؟ («The Bridge»)

### مسار التطبيق الأساسي (Inertia — ما يشغّل معظم المنصّة الآن)

- المتصفّح يطلب مسارات Laravel من **`routes/web.php`** (مثلاً `/`, `/login`, لوحات التحكم بعد المصادقة).
- الخادَم يحمّل **Controllers** التي ترجع `Inertia::render(...)` مع بيانات أولية.
- الأصول الأمامية تُبْنَى من **`vite.config.js`** ونقطة الدخول **`resources/js/app.jsx`** مع حزمة **Ziggy** لمساعد **`route()`** من داخل React.

بهذا المعنى لا يوجد «REST» بين المتصفّح والباك لكل نقرة؛ بل **صفحة واحدة متحركة (MPA-ish)** بتغيّر عنوان URL عبر **Inertia**.

### جسر SPA الخارجي (`frontend/` → Laravel API)

| العنصر | الموقع | الدور |
|--------|--------|--------|
| تعريف المسارات HTTP للـ REST | **`smart-rnd-platform/routes/api.php`** | قائمة نقاط **`/api/...`** (بادئة Laravel الافتراضية **`/api`**) عليها **Sanctum** للمسارات المحمية. |
| تسجيل المسارات في التطبيق | **`smart-rnd-platform/bootstrap/app.php`** | تفعيل **`api`** بجانب **`web`**. |
| طبقة خدمات الموصلات في SPA | **`frontend/src/services/`** | **`http/httpClient.ts`** (axios، **`withCredentials`**، **`setAuthToken`**) و**`api/*`** للنوافذ المركزية و**`supabase/*`** لعميل المتصفّح الاختياري؛ جميع URLs/المفاتيح تعالجها **`frontend/src/config/env.ts`**. |
| مثال استدعاء من الواجهة | **`frontend/src/App.tsx`** | يستورد **`probeLaravelPublicApi`** و**`probeSupabaseConnectivity`** من **`@/services`** فقط (لا استدعاء شبكة مباشر داخل المكوّن). |

**تدفق مصادقة الـ API (Bearer Token):**

1. **`POST /api/login`** أو **`POST /api/register`** → **`App\Http\Controllers\Api\AuthController`** يعيد JSON فيه **`token`** (Sanctum).
2. الفرونت يضبط الترويسة: **`Authorization: Bearer <token>`** عبر **`setAuthToken(...)`** في **`frontend/src/services/http/httpClient.ts`**.
3. المسارات المحمية في **`routes/api.php`** تستخدم مجموعة **`middleware('auth:sanctum')`**.

يمكن أيضاً تهيئة **Sanctum cookie / SPA Stateful** مستقبلًا عبر **`SANCTUM_STATEFUL_DOMAINS`**؛ الكود الحالي للـ SPA يجهّز **`withCredentials`** لذلك السيناريو.

### أين يكمُن المنطق لكل وحدة REST؟

المتحكّمون تحت **`app/Http/Controllers/Api/`** (مثل **`ProjectController`**, **`SubmissionController`**, **`ChallengeRequestController`**, **`GroupController`**، …) مع إصدار **`v2`** لتقارير أعضاء هيئة التدريس ومخطّط جات:

- **`App\Http\Controllers\Api\V2\FacultyReportsApiController`**
- **`App\Http\Controllers\Api\V2\SupervisorGanttApiController`**

(تصدّرهما تحت **`/api/v2/...`** مع قدرات **`sanctum.ability`**).

---

## 2) دليل تقني مختصر — Model Blueprint (كلاسّات مهمة وليست قائمة كل الملفّات)

> الجداول **36** لا تخصّ كلّها كلاس **`Model`** بحجم واحد: بعض الهجرات تخصّ Laravel (جلسات، كاش، jobs). أدناه **النماذج المركزية** وما تربطه علاقات **Eloquent** في الكود.

### `App\Models\User`

- نقطة الانطلاق للمصادقة (`HasApiTokens` لـ Sanctum).
- **علاقات رئيسية:** جامعة، مشاريع مملوكة، فرق يقودها أو يشرف عليها، عضويات، تسليمات، تقييمات، مقترحات، تحديات صناعية منشورة، مجموعات مشرفين، رسائل، خطط ومعلّمات إشراف، كثير-many مع المشرفين المساعدين عبر **`supervisor_group_admins`**.

### `App\Models\Project`

- **`owner()`**, **`industryChallenge()`**, **`milestonePlan()`**.
- **`team()`** واحد (`hasOne`): مشروع واحد ↔ فريق واحد في هذا المخطط.
- **`milestones()`**, **`proposal()`** (مقترح أنشأ المشروع عند الموافقة).

### `App\Models\Team`

- **`project()`, `leader(), supervisor()`** كلها **`belongsTo User`**؛ ربط **مجموعات الإشراف** (`supervisor_group_id`, `students_group_id`).
- **`members()`** عبر **`TeamMember`**؛ **`challengeRequests()`**.

### `App\Models\IndustryChallenge`

- **`postedBy()`**، **`feedbacks()`**, **`projects()`**, **`proposals()`**, **`milestonePlan()`**, **`histories()`**.

### سلسلة سير عمل الطالب مع المعلّم

- **`Proposal`** ↔ تحدٍّ ومستخدم ومشروع منشَأ؛ **`Milestone`** تابع **`Project`**؛ **`Submission`** تابع **`Milestone`** ومقدِّم ومُراجع؛ **`Evaluation`** تابع **`Submission`** والمقيِّم (**`User`**).

### الإشراف والمجموعات

- **`SupervisorGroup`**, **`SupervisorGroupMember`, `SupervisorGroupMessage`, `SupervisorGroupAdmin`** — هرم مشرف ⇄ طلاب ⇄ رسائل ⇄ مشرفين متعاونين.
- **`SupervisorMilestonePlan`** ↔ **`SupervisorMilestone`** لتنسيق المعالم المعيارية.

### أخرى

- **`ChallengeRequest`**: طلب قبول تحدٍّ مربوط **`Team`** + **`IndustryChallenge`** + طالب + مشرف.
- **`GroupChatNotification`**, **`StudentNotification`, `UserNotificationRead`**: تنبيهات وقراءة.
- **`ReportTerm`, `ReportSubject`, `StudentPerformanceEntry`**: وحدة تقارير أداء.
- **`Challenge`** (جدول أكاديمي قديم): نموذج **Eloquent** شبه فارغ؛ الاعتماد الحالي لتدفّق الشركات أكثر على **`IndustryChallenge`**.
- **`University`**: **`hasMany`** مستخدمين.

### متحكّمات API وباختصار وظيفتها النموذجية

| المتحكّم | وظيفة عامة |
|----------|-------------|
| **`Api\AuthController`** | تسجيل (طالب API)، تسجيل دخول بكلمة المرور، إصدار توكن Sanctum بقدرات حسب **`role`**، **`logout`** (إزالة التوكن الحالي). |
| **`Api\ProjectController`** | فهرسة/إنشاء/عرض/تحديث المشاريع وفق سياسات الملكية والدور في التنفيذ. |
| **`Api\MilestoneController`**, **`SubmissionController`, `EvaluationController`** | خط أنابيب المعالم والتسليمات والتقييمات على المشاريع. |
| **`Api\ProposalController`** | دورة الطالب من المقترح حتى الموافقة وربط المشروع. |
| **`Api\IndustryChallengeController`**, **`ChallengeRequestController`, `GroupController`** | تحديات القطاع، طلبات الربط، إدارة الفرق لمشرفي الأقسام. |
| **`Api\V2\*`** | تقارير التصدير وواجهة جات المشرف بتصاريح **`abilities`**. |

**`AuthController` بالتفصيل المنطقي:**

- **`abilitiesForRole($role)`** (خاصّة): تبني قائمة **`sanctum` abilities** لكل دور (طالب، مشرف، رئيس قسم، صناعة، إداري).
- **`register`**: التحقّق من المدخلات، إنشاء **`User`** بدور **`student`** فقط، إصدار توكن بقدرات الدور، JSON فيه **`token`**, **`user`**, **`permissions`**.
- **`login`**: التحقّق بالبريد وكلمة المرور، **`Hash::check`**, ثم **`createToken`** بنفس آلية **`abilitiesForRole`**.
- **`logout`**: **`currentAccessToken()->delete()`** لإبطال التوكن المرسل مع الطلب.

(للمزيد من التفاصيل على بقية المتحكّمات اقرأ أجسام الطلب والاستجابة داخل كل ملف.)

---

## 3) متغيرات البيئة (Backend & Frontend)

### باكند — **`smart-rnd-platform/.env`** (مراجع: **`.env.example`**)

| المتغير | الغرض |
|---------|--------|
| **`APP_KEY`, `APP_URL`, `APP_DEBUG`, `APP_ENV`** | Laravel أساسيات. **`APP_URL`** يطابق عنوان السيرفر في المتصفح. |
| **`DB_*`**, **`DB_SSLMODE`** | اتصال **PostgreSQL** عبر Laravel فقط؛ لـ **Supabase** استخدم بيانات **Database** من لوحة المشروع (مضيف، منفذ — غالبًا **pooler :6543** مع مستخدم **`postgres.<project_ref>`** عند الحاجة)، **وليس** مفاتيح **Supabase anon/service role**؛ تلك لمكتبات JS/SDK وليس لـ Eloquent ما لم تُضِف استخدامًا لها. **`DB_SSLMODE=require`** شائع في السحابة. يبقى **SQLite** الافتراضي في الأمثلة للتطوير المحلي بدون Postgres. |
| **`FRONTEND_URL`** | أصل SPA المتوقَّع لتوليد قائمة **CORS** الافتراضية. |
| **`CORS_ALLOWED_ORIGINS`** | قائمة فاصلة لمزيد من أصول مسموحة (يجب تحديداً عند **`CORS_SUPPORTS_CREDENTIALS=true`**). |
| **`CORS_SUPPORTS_CREDENTIALS`** | تشغيل تمرير Cookies عبر المواقع الأولى عند الجاهزية مع Sanctum SPA. |
| **`SANCTUM_STATEFUL_DOMAINS`** | نطاقات المضيف لمستعرض SPA يمكنها استخدام جلسات **Stateful** مع Sanctum. |
| بقية المتغيرات | جلسات، طوابير، بريد، مفاتيح خدمات **HuggingFace** لتماثل النصوص، إلخ — كما في `.env.example`. |

### فرونت منفصل — **`frontend/.env`** (مراجع: **`frontend/.env.example`**)

| المتغير | الغرض |
|---------|--------|
| **`VITE_API_BASE_URL`** | جذر الخادَم الذي يشغّل Laravel (**بدون** شرطة نهائية). في الكود الحالي تُبنى المسارات كاملة مثل **`/api/challenges`** في طبقة **`services`**. مثال محلي: `http://127.0.0.1:8000`. |
| **`VITE_SUPABASE_URL`** | (اختياري) عنوان مشروع Supabase للواجهة؛ يُقرأ فقط من خلال **`config/env.ts`** و**`services/supabase`**. |
| **`VITE_SUPABASE_ANON_KEY`** | (اختياري) مفتاح **anon** للمتصفّح؛ **لا** تضع **service_role** هنا. عند الاعتماد على قراءة/كتابة مباشرة من المتصفّح راجع **`docs/SUPABASE_RLS.md`**. |

> لا ترفع ملف `.env` الحقيقي إلى Git؛ انسخ من **`*.example`**. تجاهل الإيداع الآمن أيضًا في **`frontend/.gitignore`** وفي الجذر (`/frontend/.env`, `/smart-rnd-platform/.env`).

---

## 4) العلاقات بين الجداول (Eloquent باختصار)

الكتلة النواة:

```
User ─┬─< Project ─┬─< Milestone ─< Submission ─< Evaluation
      │           └─ hasOne ─ Team ─< TeamMember >─ User
      │                        └─ ChallengeRequest >─ IndustryChallenge
      ├─< IndustryChallenge ─┬─< Proposal >─ Student (User)
      │                      ├─< Project (sponsored path)
      │                      └─< Feedback / histories
      ├─< SupervisorGroup ─< messages / members / admins (pivot users)
      ├─< SupervisorMilestonePlan ─< SupervisorMilestone
      └─ notifications / reads …
ReportTerm / ReportSubject ─< StudentPerformanceEntry >─ student User
```

- **قيود خارجية حقيقية** تُنشئها الهجرات (انظر **`database/migrations`**) لتثبيت **ON DELETE CASCADE/NULL** حسب كل جدول.
- **جدول واحد واحد لفريق كل مشروع** (`teams.project_id` فريد) يحافظ على نسبة **1:1 تقريبًا** بين **Project ↔ Team**.
- بعض الجداول (كاش، jobs…) **لا علاقات نطاق تجاري**؛ هي بنية Laravel.

---

## 5) تشغيل سريع (ملخّص)

```powershell
# الباكند (مجلدان يشيران لنفس الكود: backend ↔ smart-rnd-platform عبر Junction على Windows)
cd smart-rnd-platform   # أو: cd backend
composer install
php artisan serve --host=127.0.0.1 --port=8000

# الفرونت المنفصل
cd frontend
copy .env.example .env
npm install
npm run dev
```

**التكوينات الإضافية للفصل:** **`smart-rnd-platform/config/cors.php`**؛ **`frontend/src/config/env.ts`** و **`frontend/src/services/`**.

### نشر الإنتاج (فرونت وخلفية منفصلة)

| السياق | الملاحظات |
|--------|-----------|
| **SPA (`frontend/`)** | على **Vercel / Netlify** عرّف **`VITE_API_BASE_URL`** بعنوان الـ API العام؛ انسخ ملف **`vercel.json` / `netlify.toml`** المرفق لتوجيه SPA. |
| **Laravel API** | راجع **`docs/DEPLOYMENT.md`**، واضبط **`APP_URL`**، **`FRONTEND_URL`**, **`CORS_ALLOWED_ORIGINS`**، ومفاتيح **`DB_*`** لـ Postgres/Supabase. |

---

للحديث التفصيلي عن **كل** مسار **`/api`**: راجع **`routes/api.php`** وملف المتحكّم المقابل فوق **`Http/Controllers/Api`**.

**تحضير المناقشة (Viva):** راجع المرجع التعليمي المفصل في **[`VIVA_PREP_GUIDE.md`](VIVA_PREP_GUIDE.md)** (المتحكمات، النماذج، الأمن، وسيلة الاستدعاء من الفرونت).
