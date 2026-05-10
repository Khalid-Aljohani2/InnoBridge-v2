# دليل تحضير المناقشة (Viva) — InnoBridge / Smart R&D Platform

مرجع تعليمي يشرح **الكود كما هو بعد فصل الواجهة المنفصلة (`frontend/`) عن الباكند Laravel** (`smart-rnd-platform/` أو الارتباط `backend/`). الهدف: أن تكون قادرًا على شرح كل طبقة أمام اللجنة.

**ملاحظة منهجية:** طلبًا لـ«شرح كل سطر»؛ المستند التالي يقسِّم المنطق إلى **خطوات منطقية متتابعة** (ما يحدث قبل ما). هذا هو الأسلوب الأنسب لمناقشة التخرّج لأنه يطابق تفكير المُراجع أكثر من قراءة مئات الأسطر واحدة واحدة؛ أما المرجع الحرفي للسطور فيبقى **ملفات المصدر**.

---

## جدول محتويات

1. [دليل المتحكّمات API (`app/Http/Controllers/Api`)](#1-دليل-المتحكمات-api)
2. [دليل النماذج (`app/Models`)](#2-دليل-النماذج-appmodels)
3. [لماذا هذه الأدوات؟ Laravel 12 + React + Inertia + Vite + Tailwind](#3-لماذا-هذه-الأدوات-laravel-12--react--inertia--vite--tailwind)
4. [التخصيص البصري: أين الألوان وكيف أغيّرها](#4-التخصيص-البصري-أين-الألوان-وكيف-أغيّرها)
5. [منطق قاعدة البيانات: Users, Projects, IndustryChallenges](#5-منطق-قاعدة-البيانات-users-projects-industrychallenges)
6. [الأمن: Middleware، Sanctum، CORS](#6-الأمن-middleware-sanctum-cors)
7. [مسار الطلب كاملًا: من `api.ts` إلى JSON](#7-مسار-الطلب-كاملًا-من-apits-إلى-json)
8. [نصائح سريعة للجنة الغادرة](#8-نصائح-سريعة-للجنة-الغادرة)

---

## 1) دليل المتحكّمات API (`app/Http/Controllers/Api`)

<a id="1-دليل-المتحكمات-api"></a>

**السياق:** ملف **`routes/api.php`** يقرر أي URL يذهب لأي دالة؛ البادئة الافتراضية Laravel للـ API هي **`/api`**. بعض المسارات بدون وسيط مصادقة، وأغلبيتها ضمن مجموعة **`auth:sanctum`**.

**صياغة هذا القسم:** لكل متحكّم نذكر الدوال الرئيسية و**ثلاثًا نبرزها** (أو أكثر للمتحكّم القصير) مع **خطوات منطقية** تشبه «شرح الأسطر».

### `AuthController`

| الدالة | الوظيفة الإجمالية |
|--------|-------------------|
| `abilitiesForRole` | يضبط قائمة **صلاحيات التوكن** حسب دور المستخدم (`student`, `supervisor`, … أو `*` للمسؤول). |
| `register` | التسجيل عبر REST لطالب فقط؛ إنشاء مستخدم؛ إصدار Token بقدرات محددة. |
| `login` | تحقّق من البريد وكلمة المرور؛ **`Hash::check`**؛ إصدار Token. |
| `logout` | حذف **التوكن الحالي** المرتبط بالطلب. |

**`register` — خطوة بخطوة**

1. **`$request->validate(...)`**: يفرض وجود الاسم والبريد الفريد وكلمة مرور قوية مع تأكيد.
2. **`User::create([...])`**: ينشئ صفًا في جدول المستخدمين بدور **`student`** وبكلمة مرور مُوشَّعة.
3. **`abilitiesForRole`**: تحسب قائمة السلسلة المسموحة للتوكن حسب هذا الدور.
4. **`createToken('auth_token', $abilities)`**: Sanctum يسجّل صفًا في جدول **personal_access_tokens** ويعيد **`plainTextToken`** (يُرسل للعميل مرة واحدة).
5. **`return response()->json(..., 201)`**: تجيب JSON فيه **`token`**, **`user`**, **`permissions`**.

**`login` — خطوة بخطوة**

1. التحقّق من الحقول `email`, `password`.
2. **`User::where('email', ...)->first()`**: جلب المستخدم من قاعدة البيانات.
3. **`Hash::check`**: لو فشلت المقارنة أو المستخدم غير موجود → **`401`** ورسالة خطأ JSON.
4. نفس آلية **`abilitiesForRole`** و **`createToken`** ثم JSON ناجح **`200`**.

**`logout`**

1. **`$request->user()`**: Laravel يحمّله بعد **`auth:sanctum`**.
2. **`currentAccessToken()?->delete()`**: يمحو التوكن المستخدم لهذا الطلب فقط (لا يغلق كل جلسات المستخدم افتراضيًا).

---

### `ProjectController`

دوال ظاهرة: **`index`, `store`, `show`, `update`**؛ ودوال مساعدة خاصّة **`scopeProjectsVisibleToUser`**, **`userMayAccessProject`**.

**الثلاث المختارة للحديث أمام اللجنة:** `index`, `store`, **`userMayAccessProject`** (تشرح سياسات الوصول).

**`index`**

1. جلب **`$request->user()`** (موثَّق بالفعل).
2. **`Project::query()->with(...)`**: تحميل علاقات مخفَّفة (مالك المشروع، التحدّي الصناعي، الفريق) لتقليل N+1.
3. **`when($request->filled('status')` / `type`)**: فلترة اختيارية من query string.
4. **`scopeProjectsVisibleToUser`**: يضيّق الاستعلام حسب الدور (إداري يرى الكل؛ HoD بحسب القسم؛ مشرف حسب **`supervisor_id`**؛ طالب بحسب الملكية أو عضوية الفريق؛ قطاع بحسب **`posted_by`** للتحدي).
5. **`paginate(10)`** ثم **`response()->json`**.

**`store`**

1. يتحقق أن الدور إما **`admin`** أو **`student`**، وإلا **`403`**.
2. **`validate`**: العنوان، الملخص، النوع (`student_initiated` | `industry_sponsored`)، اختياريًا **`industry_challenge_id`**, التواريخ.
3. يمنع الطالب من تمرير **`status`** غير **`draft`** أو **`submitted`** عبر الشرط المتخصص بالطالب.
4. **`Project::create`** مع **`owner_user_id`** = المستخدم الحالي.

**`userMayAccessProject` (منطقيًا «كل سطر مهمّ»)**

1. إذا **`admin`** → مسموح دائمًا.
2. **`loadMissing(['team.members'])`** لضمان وجود علاقات الفريق.
3. **HoD**: إن لم يكن للمستخدم **`department`** → مرفوض؛ إن لم يوجد **`team`** → مرفوض؛ يقبل إذا تطابق قسم الفريق مع قسم المستخدم.
4. **Supervisor**: يتحقّق **`team.supervisor_id === user.id`**.
5. **Student**: يقبل إذا كان **مالك المشروع**، أو قائد الفريق، أو عضوًا في **`team_members`**.
6. **Industry**: يحمّل التحدّي ويقبل إذا كان ناشر التحدّي هو نفس الشركة.

**`show`**: يستدعي **`userMayAccessProject`**؛ عند الرفض **`403`**؛ يحمّل العلاقات للعرض.

**`update`**: تحقّق الوصول ثم تحقّق أن المُحدِّث واحد من: **`admin`**، **`owner`**، **`supervisor` للفريق**؛ **`validate`** للحقول؛ يقيِّد الطالب على حقل **`status`**؛ **`$project->update`**.

---

### `GroupController`

يعتمد على **`GroupManagementService`** (فصل منطق الأعمال عن HTTP).

| الدالة | الخطوات المنطقية |
|--------|------------------|
| `index` | يستدعي **`teamsForUser($user)`** ويعيد JSON بنجاح. |
| `supervisors` | يستدعي **`supervisorsForHoD($user)`**. |
| `assignSupervisor` | يحقق **`supervisor_id`**؛ يمرِّر **`assignTeamToSupervisor`**؛ عند **`ok` false** يرجع **`403`**. |

**لماذا الخدمة؟** لتجربة وحدة الأسهل وبقاء المتحكّم رقيقًا (طبقة تعبير HTTP فقط).

---

### `IndustryChallengeController`

يعتمد على **`ChallengeWorkflowService`**.

**`indexApproved`**: يستعلم الشركة المعتمدة عبر **`queryCompanyChallengesApproved()->get()`** ويعيد JSON.

**`store`** (قطاع صناعي): تحقّق الحقول → **`createCompanyChallenge`**؛ عند الفشل **`403` أو رسالة خطأ**؛ النجاح **`201`**.

**`hodReview`**: **`decision` approve/reject + notes**؛ يستدعي **`hodReviewCompanyChallenge`** ويعيد رسالة المنطقة.

---

### `ChallengeRequestController`

دوال الطلب المتسلسل: طالب **`store`**، مشرف **`supervisorPending` / `supervisorDecide`**، HoD **`hodAssign`**، قطاع **`industryIndex` / `industryDecide`**.

**مثال `store` للطالب**

1. التحقق **`industry_challenge_id`** موجود في الجدول.
2. **`createChallengeRequest(user, id)`**: الخدمة تتحقق من شروط سير العمل (مثل حالة الفريق أو التكرار).
3. إن **`ok` false** → **`422`** (أو وفق تنفيذ الخدمة؛ هنا **`422`**).
4. **`201`** مع **`data`** عند النجاح.

**`hodAssign`**: تحمّل **`Team`** و **`IndustryChallenge`** عبر **`findOrFail`** ثم **`hodAssignChallengeToTeam`**.

---

### `ProposalController`

**`index`**: تحميل علاقات (`challenge`, `student`, `reviewer`, `generatedProject`)؛ إذا الطالب فيرى مقترحاته فقط **`where student_user_id`**؛ تصفية **`status`** اختياريًا؛ ترقيم صفحات.

**`store`**

1. رفض غير **`student`**.
2. التحقّق من المدخلات.
3. **`exists`**: لا يكرر طالب واحد أكثر من مقترح لنفس **`industry_challenge_id`** (`422`).
4. **`Proposal::create`** بحالة **`pending`**.

**`review`** (ثلاث نقاط حيوية أمام اللجنة)

1. تقيّد الدور: **`admin` | `supervisor` | `industry`**؛ رفض إن الحالة ليست **`pending`** (`422`).
2. **`validate`**: `decision` approved/rejected + ملاحظة.
3. **`DB::transaction`**: إذا **approved** → **`Project::create`** بطريقة **`industry_sponsored`** وربط بمالك هو الطالب؛ ثم **`proposal->update`** بالحالة ومرجع **`generated_project_id`**؛ كل ذلك ذرّياً لتجنُّب مشروع بدون تحديث مقترح أو العكس.

**ملاحظة للمراجع:** دالة **`show`** لا تستدعي صراحةً فحص صلاحية على المقترح (اعتمادًا على وسيط Laravel لربط المعرف؛ قد يُسألك عن جوانب الخصوصية — المرجّح بحاجة لتقييم **سياسات الوصول على العرض حسب دور المستخدم** في نسخة مستقبلية).

---

### `MilestoneController`

**`index`**: **`$project->milestones()->orderBy('sequence')`**؛ JSON.

**`store`**: تحقّق الحقول؛ **`create`** على علاقة؛ **`sequence`** الافتراضي = أكبر تسليم + 1.

**`update`**: يتأكد أن **`milestone.project_id`** يطابق **`project`** في المسار (`404`) ثم **`update`**.

---

### `SubmissionController`

دوال مساعدة: **`userMayAccessMilestone`**, **`userMayCreateSubmission`** (مشابهة لمنطق المشاريع: إدارة، قسم، مشرف، طالب، قطاع).

**`index`**: رفض بدون وصول؛ ثم **`submissions()->with('submittedBy')`**.

**`store`**

1. تحقّق **`userMayCreateSubmission`**.
2. **`validate`**: عنوان، ملاحظات، ملف **pdf/doc/docx/zip** حجم أقصى، حالة اختيارية؛ رسائل مخصصة عبر **`SubmissionUploadMessages::forUser`**.
3. يثبّت حالة الطالب على **`submitted`** (لا يمرّر «reviewed» يدويًا).
4. **`store('submissions', 'public')`**: تخزين الملف.
5. **`version`**: أعلى إصدار + 1.
6. **`milestone->update(['status' => 'in_review'])`**: يحدّث سير العمل.

**`update`**: يفرّق بين صلاحية الطالب (تعديل عنوان/ملاحظات فقط) مقابل المشرف/الإداري (يشمل **`status`**).

---

### `EvaluationController`

**`index`**: يعيد تقييمات التسليم مع **`evaluator`**.

**`store`**

1. فقط **`admin` أو `supervisor`**.
2. إنشاء **`Evaluation`** مع **`evaluated_at`**.
3. يحدّث **`submission.status`** حسب القرار (**needs_revision** أو **reviewed**).
4. يحدّث **`milestone.status`** إلى **approved/rejected** (تبسيط لسير العمل).

**`update`**: المقيِّم نفسه أو **`admin`**.

---

### `FacultyReportsApiController` (`Api\V2`)

مصمّم للتقارير الأكاديمية مع وسيط **`sanctum.ability`**.

| الدالة | المنطق |
|--------|--------|
| `filters` | **`getFilterOptions(user)`** — قوائم الفلاتر المسموح بها حسب الدور. |
| `preview` | تحقق من معرفات الفصل/المادة/الطالب؛ **`buildRows`** ثم JSON. |
| `export` | **`format` pdf أو xlsx**؛ يستدعي **`downloadPdf`** أو **`downloadXlsx`**. |

---

### `SupervisorGanttApiController` (`Api\V2`)

**`show`**: يحقن **`SupervisorTimelineRepositoryInterface`** ويعيد **`ganttPayloadFor(user)`** — نمط **Repository** يفصل استعلامات الجدول الزمني عن المتحكّم.

---

### مسار إضافي في `routes/api.php` بدون متحكّم

**`GET /api/challenges`**: Closure يستخدم **`IndustryChallenge::with('postedBy')`** مع شروط **`kind`** و **`review_status`**؛ مفيد لفحص SPA سريع.

---

## 2) دليل النماذج (`app/Models`)

<a id="2-دليل-النماذج-appmodels"></a>

كل ملف **`Model`** يمثِّل جدولًا (بالاسم المفرد/الجمع حسب Laravel). **`$fillable`** يحمي من **Mass Assignment**. العلاقات تُعبَّر بدوال ترجع **`belongsTo` / `hasMany` / …**.

| النموذج | دور الأعمال والعلاقات الجوهرية |
|---------|--------------------------------|
| **`User`** | مصادقة + Sanctum tokens؛ **`university()`**, **`ownedProjects()`**, **`teamMemberships()`**, **`supervisedTeams`** / **`ledTeams`**, **`submissions`, `evaluations`, `proposals`**, مجموعات مشرف الرسائل، **`belongsToMany` للمجموعات المساعدة**. |
| **`University`** | **`hasMany(User)`**. |
| **`Project`** | **`belongsTo` owner، industryChallenge، milestonePlan**؛ **`hasOne` team**؛ **`hasMany` milestones**؛ **`hasOne` proposal المنشّأ عن المشروع**. |
| **`Team`** | **`belongsTo` leader, supervisor, project, مجموعات الإشراف**؛ **`hasMany` members، challengeRequests**. |
| **`TeamMember`** | **`belongsTo` team، user**. |
| **`TeamInvitation`** | **`belongsTo` team، invited، inviter**. |
| **`IndustryChallenge`** | **`belongsTo` postedBy**؛ **`feedbacks، projects، proposals`**؛ **`milestonePlan`**؛ **`histories`**. |
| **`Proposal`** | **`belongsTo` challenge، student، reviewer، generatedProject**. |
| **`Milestone`** | **`belongsTo` project**؛ **`hasMany` submissions**. |
| **`Submission`** | **`belongsTo` milestone، submittedBy، reviewedBy**؛ **`hasMany` evaluations**. |
| **`Evaluation`** | **`belongsTo` submission، evaluator**. |
| **`ChallengeRequest`** | **`belongsTo` team، industryChallenge، طالب، مشرف**. |
| **`Feedback`** | **`belongsTo` industryChallenge**. |
| **`ChallengeHistory`** | **`belongsTo` industryChallenge، actor (User)**. |
| **`SupervisorGroup`** + أعضاء/رسائل/إداري | هرم مجموعات الإشراف والمحادثة والخطط؛ **`SupervisorGroup` hasMany كل شيء** و **`belongsToMany`** للمشرفين المشاركين. |
| **`SupervisorMilestonePlan` / `SupervisorMilestone`** | ربط الخطط المعيارية بالمشرف والمجموعة. |
| **`StudentNotification`**, **`GroupChatNotification`**, **`UserNotificationRead`** | قنوات إشعار وقراءة. |
| **`ReportTerm`**, **`ReportSubject`**, **`StudentPerformanceEntry`** | تقارير أداء أكاديمية. |
| **`Challenge`** | الجدول قديم/أكاديمي؛ النموذج شبه فارغ — التدفق الحالي للشركات عبر **`IndustryChallenge`**. |

**ثلاث علاقات تقولها بحرفية للجنة**

- **`belongsTo`**: «الجدول الحالي يحمل مفتاح أجنبي → صف واحد في الجدول الأب».
- **`hasMany`**: «من جهة الجدول الأب → صفر أو أكثر من الصفوف في الجدول الابن».
- **`belongsToMany`**: جدول واسطة (Pivot) بين نوعَين؛ مثل **`supervisor_group_admins`**.

---

## 3) لماذا هذه الأدوات؟ Laravel 12 + React + Inertia + Vite + Tailwind

<a id="3-لماذا-هذه-الأدوات-laravel-12--react--inertia--vite--tailwind"></a>

### Laravel 12

- **طبقة خادم واحدة متكاملة**: توجيه، تحقّق (`Validation`)، ORM (**Eloquent**)، ملفات، طوابير، مهاجرات (**Migrations**)، وسطاء (**Middleware**)، سياسات.
- للمشروع مثل InnoBridge يعني **سير عمل معقّد (طالب، مشرف، HoD، صناعة)** يُطبَّق بدون خلط تجريبي بين قواعد المنطقة وقاعدة البيانات.
- **علاقات Eloquent + Foreign Keys**: تفسير علاقات حقيقية في قاعدة البيانات ونسخ تعبيرية في الكود (`with`, `whereHas`).
- **Laravel Sanctum 4**: نموذج **Token أو Cookie** لتوفير **`/api` آمنًا** أمام عميل خارجي (**`frontend/`**) مع نفس مستخدمي Laravel.

### React (في مسارَين)

1. **`resources/js` + Inertia**: واجهة «تطبيق واحد» تجربة SPA مع بقاء المسارات وأمان الخادَم تحت Laravel (Ziggy لمسارات الاسماء).
2. **`frontend/` (Vite + React 19 + TypeScript)** عميل تجريبي/توسّع SPA يستهلك **`/api`**.

لماذا React؟ **مكونات قابلة لإعادة الاستخدام**، شجرة DOM فعالة، وبنية تتيح لك تشارك عقل التصميم مع فريق قطاع أكاديمي وصناعة.

### Vite

- **Bundler سريع** في التطوير (HMR)؛ Laravel الافتراضي وVite في **`frontend/`** يختصران دورة البناء.
- يفصل **أصول الواجهة** عن **منطق PHP** فتبقى الحدود واضحة في المناقشة.

### Tailwind CSS (داخل مشروع Laravel الرئيسي)

- **Utility-first**: تغيير المظهر عبر فئات (`class="bg-ib-navy"`).
- **ثيم ومظلم**: `darkMode: 'class'` في الإعداد؛ ألوان مخصصة InnoBridge (**`ib.*`**).

---

## 4) التخصيص البصري: أين الألوان وكيف أغيّرها

### الملف المركزي

- **`smart-rnd-platform/tailwind.config.js`**
  - **`theme.extend.colors.ib`**: **`navy`**, **`cyan`**, **`mint`** — العلامة البصرية InnoBridge.
  - **`keyframes` / `animation`**: **aurora**, **floaty**, **shimmer** للخلفيات الحركة.
  - **`content`**: مسارات JSX وBlade لتوليد CSS فقط لما يُستخدم.
  - **`darkMode: 'class'`**: يفعِّل الوضع الداكن عند وجود كلاس **`dark`** على جذر (أو وفق آلية الواجهة).

### كيف تغيّر خلفية الموقع؟

1. غيّر ألوان **`ib`** في **`tailwind.config.js`** ثم أعد بناء الأصول (**`npm run build`** أو **`npm run dev`** لمشروع Laravel).
2. أو استخدم كلاسًا في JSX مثل **`bg-gray-950`**, **`bg-gradient-to-br`**, **`from-ib-navy to-slate-900`** في **`resources/js/...`** أو في تخطيط Blade.

### الأزرار

- أزرار Breeze/Inertia غالبًا تستخدم كلاسّات **`bg-*`**, **`text-*`**, **`rounded-*`** في مكوّنات JSX (مثل صفحات **`Pages/Auth`**, **`Components`**).
- غيّر **`primary`** إن كان معرَّفًا في أي مكون مشترك، أو استخدم **`btn`-مخصّص أو فئات Tailwind الموحَّدة لتجنُّب الفوضى.

**الواجهة المنفصلة `frontend/`:** حاليًا تستخدم **أنماطًا مضمّنة بسيطة** في `App.tsx` وليست Tailwind؛ إن أردت نفس النظام انسخ إعداد Tailwind أو استخدم الـ design system من مشروع Laravel.

---

## 5) منطق قاعدة البيانات: Users, Projects, IndustryChallenges

### المستخدمون (`users`)

- **HoD / Supervisor / Student / Industry / Admin** عبر عمود **`role`**.
- **طالب** قد يكون **مالك مشروع** (`projects.owner_user_id`) أو **قائد فريق** أو **عضو فريق** (`team_members`).
- **مشرف** مرتبط بفريق عبر **`teams.supervisor_id`**.
- **قطاع** ينشر تحديات عبر **`industry_challenges.posted_by_user_id`**.

### المشاريع (`projects`)

- **مالك** (`owner_user_id` → **`User`**).
- **إن وُجد تحدٍ صناعي** (`industry_challenge_id` → **`IndustryChallenge`**).
- **فريق واحد متوقّع** (`teams.project_id` فريد في الهجرة) → **`Project hasOne Team`**.
- **معالم** (`milestones`) تتبع المشروع؛ **تسليمات** تتبع المعالم؛ **تقييمات** تتبع التسليمات.

### تحديات الصناعة (`industry_challenges`)

- **ناشر** (`posted_by_user_id`).
- **عدة مشاريع ومقترحات** تُشير لنفس التحدّي (`hasMany`).
- **خطة معالم اختيارية** (`milestone_plan_id` → **`SupervisorMilestonePlan`**) لربط منهجية الإشراف.

### جملة تلخّص السلسلة للجنة

«**IndustryChallenge** يجذب **Proposal** من طالب؛ عند الموافقة يُنشأ **Project** بربط بذلك التحدّي؛ **Team** يربط الطلاب والمشرف؛ **Milestone → Submission → Evaluation** تكمل دورة التنفيذ والتقييم.»

---

## 6) الأمن: Middleware، Sanctum، CORS

### طبقة `auth:sanctum` (على مجموعة `routes/api.php`)

1. يقرأ رأس **`Authorization: Bearer <token>`** أو جلسة **Stateful** حسب التهيئة.
2. يحدد المستخدم ويضعه في **`$request->user()`**.
3. إن فشل → **`401`** (غير مصرّح).

### `EnsureUserHasRole` (بديل الاسم **`role`**)

الملف **`app/Http/Middleware/EnsureUserHasRole.php`**:

1. يميّز إن كان الطلب **Inertia** (رأس **`X-Inertia`**) أو **JSON API صِرف** (**`expectsJson()`** وليس Inertia).
2. بلا مستخدم → **401 JSON** أو **إعادة توجيه لتسجيل الدخول** حسب نوع الطلب.
3. إن **`role`** المستخدم ليس ضمن قائمة المعاملات → **403 JSON** أو رسالة تنبيه وإعادة للوحة تحكم بصفة ويب.

**الفائدة:** نفس المصادقة، لكن **سلوك HTTP مناسب لـ SPA** مقابل صفحة Inertia.

### `EnsureSanctumTokenAbility` (**`sanctum.ability`**)

1. بعد **`auth:sanctum`** يسترد **`currentAccessToken()`**.
2. إن لم يوجد نوع شخصي access token مستخدم → **403**.
3. إن التوكن فيه **`*`** يمرّ كل شيء (أدمن).
4. غير ذلك يفسِّر قائمة المتطلوبات **`reports:read;reports:export`** كـ «أي واحدة تكفي» وفق **`explode(';')`**.
5. لا تطابق → **403**.

**التكامل مع `AuthController`:** **`createToken(..., abilities)`** تضع نفس المصطلحات لكل دور؛ لذا يمكنك القول أمام اللجنة: «لدينا **مصادقة (من أنت)** + **تفويض (ماذا يحق لك هذا التوكن)**».

### إعداد Sanctum

- **`config/sanctum.php`**: **`stateful`** محسوب من **`SANCTUM_STATEFUL_DOMAINS`** + **`Sanctum::currentApplicationUrlWithPort()`**.
- **`guard`**: **`web`** أولًا ثم التفكير في التوكن.

### CORS

- **`config/cors.php`** + متغيرات **`.env`**: **`FRONTEND_URL`**, **`CORS_ALLOWED_ORIGINS`**, **`CORS_SUPPORTS_CREDENTIALS`**.
- تسمح لمتصفّح **`http://localhost:5173`** باستدعاء **`http://127.0.0.1:8000/api/...`** عند إعدادها بشكل صحيح.

---

## 7) مسار الطلب كاملًا: من `api.ts` إلى JSON

### على العميل (`frontend/src/lib/api.ts`)

1. **`axios.create`**: **`baseURL`** من **`import.meta.env.VITE_API_BASE_URL`** (تطبيع إزالة `/` الأخير).
2. **`headers`**: **`Accept: application/json`** لإخبار Laravel بأن الردّ JSON.
3. **`withCredentials: true`**: يمهّد لملفات تعريف ارتباط مُشتركة إن استُخدمت لاحقًا مع Sanctum Stateful.
4. **`setAuthToken`**: يضع أو يحذف **`Authorization: Bearer ...`** على مثيل axios الافتراضي.

### على الخادم

1. **Apache/Nginx أو `php artisan serve`** يستقبل **`GET/POST/...`**.
2. **`public/index.php`** يحمّل Laravel.
3. **`bootstrap/app.php`**: تسجيل **`api` routes**.
4. **`routes/api.php`**: يطابق المسار والوسيط (مثل **`auth:sanctum`**, **`role:student`**).
5. **Controller method**: يتحقق، يستعلم Eloquent، يشكّل **`response()->json([...])`**.
6. **الإرجاع عبر الشبكة**: جسم JSON + رموز حالة HTTP.

### مثال حي

- **`App.tsx`**: **`api.get('/api/challenges')`** → عنوان كامل **`{baseURL}/api/challenges`**.
- **Closure في `routes/api.php`**: يعيد **`{ status: 'success', data: [...] }`**.

---

## 8) نصائح سريعة للجنة الغادرة

1. «لماذا لا نعتمد كل شيء على REST؟» — نجيب: لدينا **Inertia** للصفحات المتكاملة مع الخادَم وبقاء SPA **اختيارية** لموديولات أو تطبيق مستقبلي.
2. «كيف تمنع تسرب بيانات مشروع لفريق آخر؟» — **`scopeProjectsVisibleToUser`**, **`userMayAccessProject`**, ونظائرها في **`SubmissionController`** مع استعلامات **`whereHas`**.
3. «ما الفارق بين Session و Token؟» — **Stateful Sanctum** يعتمد Cookies + CSRF حيث يُطبَّق؛ **Personal Access Tokens** المناسبة لتطبيقات Mobile أو عميل خارجي؛ نحن نوثِّق Bearer في الأمثلة.
4. «أين المعاملات المتعددة؟» — **`ProposalController@review`** داخل **`DB::transaction`**.
5. «كيف لو فشل رفع ملف التسليم؟» — يُعاد رسالة خطأ التحقّق وباستخدام رسائل **`SubmissionUploadMessages`** لتحسين وضوح رسائل التحقّق بالعربية عند الطالب.

---

**خاتمة:** استخدم هذا الملف كنقطة انطلاق، واربط كل إجابة بـ**مسار في `routes/api.php`** و**ملف المتحكّم** و**النموذج** عند الحاجة. بالتوفيق في المناقشة.
