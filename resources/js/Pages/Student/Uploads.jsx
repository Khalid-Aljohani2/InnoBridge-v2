import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, useForm } from '@inertiajs/react';

const statusColor = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    awaiting_revision: 'bg-blue-100 text-blue-700',
    pending_action: 'bg-amber-100 text-amber-700',
};

export default function StudentUploads({ project = null, milestonePath = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const { data, setData, post, processing, errors, reset } = useForm({
        title: project?.title || '',
        description: project?.description || '',
        file: null,
    });

    const t = isArabic
        ? {
              title: 'رفع الفكرة والمستندات',
              desc: 'صفحة مستقلة لإدارة رفع المشروع مع سجل زمني دقيق لحالة المراجعة.',
              formTitle: 'رفع ملف جديد',
              projectTitle: 'عنوان المشروع',
              projectDesc: 'وصف المشروع',
              file: 'الملف',
              send: 'رفع وإرسال للمراجعة',
              progressTitle: 'مسار الإنجاز',
              historyTitle: 'سجل الرفع والمراجعة',
              noHistory: 'لا يوجد سجل بعد.',
              currentPlan: 'الخطة الحالية',
              unknownPlan: 'الخطة الافتراضية',
              status: 'الحالة',
              time: 'الوقت',
              details: 'التفاصيل',
              milestone: 'المرحلة',
          }
        : {
              title: 'Idea & Documents Upload',
              desc: 'Dedicated page for uploads with a precise timeline of review status.',
              formTitle: 'Upload New File',
              projectTitle: 'Project Title',
              projectDesc: 'Project Description',
              file: 'File',
              send: 'Upload and Send for Review',
              progressTitle: 'Progress Path',
              historyTitle: 'Upload & Review Timeline',
              noHistory: 'No history yet.',
              currentPlan: 'Current Plan',
              unknownPlan: 'Default Plan',
              status: 'Status',
              time: 'Time',
              details: 'Details',
              milestone: 'Milestone',
          };

    const submit = (e) => {
        e.preventDefault();
        post(route('student.uploads.store'), {
            forceFormData: true,
            onSuccess: () => reset('file'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.title}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.desc}</p>
                </div>
            }
        >
            <Head title={t.title} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <section className={`xl:col-span-2 p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.formTitle}</h3>
                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.projectTitle}</label>
                                <input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.projectDesc}</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.file}</label>
                                <input
                                    type="file"
                                    onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                    className={`mt-1 w-full rounded-xl ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                />
                                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="sr-btn-action-primary w-auto px-5 disabled:opacity-60"
                            >
                                {t.send}
                            </button>
                        </form>
                    </section>

                    <section className={`p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.progressTitle}</h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                            {t.currentPlan}: {project?.milestone_plan?.name || t.unknownPlan}
                        </p>
                        <div className="mt-4 space-y-2">
                            {milestonePath.map((row, idx) => {
                                const done = (project?.progress || 0) >= (row.progress || 0);
                                return (
                                    <div
                                        key={row.id || idx}
                                        className={`rounded-xl border p-2 ${done ? 'border-green-300 bg-green-50' : isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}
                                    >
                                        <p className="text-sm font-semibold">{idx + 1}. {row.label}</p>
                                        <p className="text-xs text-gray-500">{row.progress}%</p>
                                        {row.submission_title ? <p className="text-xs text-indigo-600 mt-1">{row.submission_title}</p> : null}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={`xl:col-span-3 p-5 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{t.historyTitle}</h3>
                        {!project?.histories?.length ? (
                            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.noHistory}</p>
                        ) : (
                            <div className="space-y-3">
                                {project.histories.map((event) => {
                                    const status = event?.meta?.review_status || project?.review_status || 'pending_action';
                                    return (
                                        <div key={event.id} className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-semibold">{event.title}</p>
                                                <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${statusColor[status] || statusColor.pending_action}`}>
                                                    {t.status}: {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{t.time}: {event.created_at}</p>
                                            {event.description ? <p className="text-sm mt-1">{t.details}: {event.description}</p> : null}
                                            {event?.meta?.milestone ? <p className="text-xs mt-1 text-indigo-600">{t.milestone}: {event.meta.milestone}</p> : null}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
