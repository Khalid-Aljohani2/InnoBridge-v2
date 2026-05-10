import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const statusStyle = {
    approved: 'sr-chip-emerald',
    rejected: 'sr-chip-red',
    awaiting_revision: 'sr-chip-blue',
    pending_action: 'sr-chip-amber',
};

const statusLabel = {
    approved: { ar: 'مقبول', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    awaiting_revision: { ar: 'بانتظار التعديل', en: 'Awaiting Revision' },
    pending_action: { ar: 'بانتظار إجراء', en: 'Pending Action' },
};

export default function SupervisorStudents({ students = [], availablePlans = [] }) {
    const { isArabic, isDark } = useUiPreferences();
    const [search, setSearch] = useState(() => {
        if (typeof window === 'undefined') return '';
        return window.localStorage.getItem('supervisor_students_search') || '';
    });
    const [statusFilter, setStatusFilter] = useState(() => {
        if (typeof window === 'undefined') return 'all';
        return window.localStorage.getItem('supervisor_students_status_filter') || 'all';
    });
    const [planDraftByProjectId, setPlanDraftByProjectId] = useState({});
    const [columns, setColumns] = useState(() => {
        if (typeof window === 'undefined') return '3';
        return window.localStorage.getItem('supervisor_students_columns') || '3';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('supervisor_students_search', search);
    }, [search]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('supervisor_students_status_filter', statusFilter);
    }, [statusFilter]);

    const t = isArabic
        ? {
              pageTitle: 'متابعة الطلاب',
              pageDesc: 'صفحة خاصة لمتابعة الطلاب: كل طالب في مربع مستقل مع كل معلومات التقدم.',
              empty: 'لا يوجد طلاب لديهم مشاريع حالياً.',
              searchPlaceholder: 'ابحث باسم الطالب...',
              filterLabel: 'فلتر الحالة',
              filterAll: 'الكل',
              clearFilters: 'مسح الفلاتر',
              layoutLabel: 'تقسيم العرض',
              oneCol: 'عمود 1',
              twoCol: 'عمودان',
              threeCol: '3 أعمدة',
              totalProjects: 'إجمالي المشاريع',
              avgProgress: 'متوسط التقدم',
              approved: 'مقبولة',
              rejected: 'مرفوضة',
              pending: 'بانتظار إجراء',
              awaiting: 'بانتظار التعديل',
              latest: 'آخر مشروع',
              milestone: 'الحالة',
              recentProjects: 'أحدث المشاريع',
              reviewBtn: 'فتح المراجعة لهذا الطالب',
              openFile: 'عرض الملف',
              planTitle: 'تغيير خطة الطالب',
              choosePlan: 'اختر خطة',
              applyPlan: 'تطبيق الخطة',
              lockPlan: 'التغيير متاح فقط حتى 20%',
          }
        : {
              pageTitle: 'Students Monitoring',
              pageDesc: 'Dedicated page for student tracking: each student has one card with full progress details.',
              empty: 'No students with projects yet.',
              searchPlaceholder: 'Search by student name...',
              filterLabel: 'Status Filter',
              filterAll: 'All',
              clearFilters: 'Clear Filters',
              layoutLabel: 'Layout',
              oneCol: '1 Column',
              twoCol: '2 Columns',
              threeCol: '3 Columns',
              totalProjects: 'Total Projects',
              avgProgress: 'Average Progress',
              approved: 'Approved',
              rejected: 'Rejected',
              pending: 'Pending Action',
              awaiting: 'Awaiting Revision',
              latest: 'Latest Project',
              milestone: 'Current Status',
              recentProjects: 'Recent Projects',
              reviewBtn: 'Open Review for this student',
              openFile: 'Open file',
              planTitle: 'Change Student Plan',
              choosePlan: 'Select plan',
              applyPlan: 'Apply Plan',
              lockPlan: 'Plan change is allowed up to 20% only',
          };

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();
        return students.filter((student) => {
            const nameMatch = term === '' || (student.student_name || '').toLowerCase().includes(term);
            if (!nameMatch) return false;
            if (statusFilter === 'all') return true;

            return (
                (student.latest_project?.review_status || 'pending_action') === statusFilter
            );
        });
    }, [students, search, statusFilter]);

    const gridClass = useMemo(() => {
        if (columns === '1') return 'grid-cols-1';
        if (columns === '2') return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    }, [columns]);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{t.pageTitle}</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{t.pageDesc}</p>
                </div>
            }
        >
            <Head title={t.pageTitle} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-8 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell">
                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 mb-5`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t.searchPlaceholder}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            >
                                <option value="all">{t.filterLabel}: {t.filterAll}</option>
                                <option value="pending_action">{t.pending}</option>
                                <option value="awaiting_revision">{t.awaiting}</option>
                                <option value="approved">{t.approved}</option>
                                <option value="rejected">{t.rejected}</option>
                            </select>
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                }}
                                className="rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm px-3 py-2 transition"
                            >
                                {t.clearFilters}
                            </button>
                            <select
                                value={columns}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setColumns(next);
                                    if (typeof window !== 'undefined') {
                                        window.localStorage.setItem('supervisor_students_columns', next);
                                    }
                                }}
                                className={`w-full rounded-lg ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'
                                }`}
                            >
                                <option value="1">{t.layoutLabel}: {t.oneCol}</option>
                                <option value="2">{t.layoutLabel}: {t.twoCol}</option>
                                <option value="3">{t.layoutLabel}: {t.threeCol}</option>
                            </select>
                        </div>
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className={`${isDark ? 'sr-card-dark text-slate-200' : 'sr-card-light text-gray-700'} p-6`}>
                            {t.empty}
                        </div>
                    ) : (
                        <div className={`grid ${gridClass} gap-4`}>
                            {filteredStudents.map((student) => {
                                const latestStatus = student.latest_project?.review_status || 'pending_action';
                                return (
                                    <div
                                        key={student.student_id}
                                        className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-4 hover:-translate-y-0.5 transition`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{student.student_name}</h3>
                                            <span className={statusStyle[latestStatus] || statusStyle.pending_action}>
                                                {statusLabel[latestStatus]?.[isArabic ? 'ar' : 'en'] || statusLabel.pending_action[isArabic ? 'ar' : 'en']}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className={`rounded-lg p-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                <p className="text-[11px] text-gray-500">{t.totalProjects}</p>
                                                <p className="font-black text-blue-600">{student.total_projects}</p>
                                            </div>
                                            <div className={`rounded-lg p-2 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                                <p className="text-[11px] text-gray-500">{t.avgProgress}</p>
                                                <p className="font-black text-indigo-600">{student.average_progress}%</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                            <div className="rounded-lg px-2 py-1.5 bg-green-50 text-green-700">{t.approved}: {student.approved_count}</div>
                                            <div className="rounded-lg px-2 py-1.5 bg-red-50 text-red-700">{t.rejected}: {student.rejected_count}</div>
                                            <div className="rounded-lg px-2 py-1.5 bg-amber-50 text-amber-700">{t.pending}: {student.pending_count}</div>
                                            <div className="rounded-lg px-2 py-1.5 bg-red-50 text-red-700">{t.awaiting}: {student.awaiting_revision_count}</div>
                                        </div>

                                        <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
                                            <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-blue-800'}`}>{t.latest}</p>
                                            <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                                {student.latest_project?.title || '-'}
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {t.milestone}: {student.latest_project?.current_milestone || '-'}
                                            </p>
                                            <p className="text-xs text-indigo-600">
                                                {t.avgProgress}: {student.latest_project?.progress || 0}%
                                            </p>
                                        </div>

                                        <div className={`rounded-lg p-3 mb-3 border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                            <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{t.planTitle}</p>
                                            <div className="flex gap-2">
                                                <select
                                                    value={planDraftByProjectId[student.latest_project?.id] || student.latest_project?.milestone_plan_id || ''}
                                                    onChange={(e) =>
                                                        setPlanDraftByProjectId((prev) => ({
                                                            ...prev,
                                                            [student.latest_project?.id]: e.target.value,
                                                        }))
                                                    }
                                                    className={`flex-1 rounded-lg text-xs ${
                                                        isDark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <option value="">{t.choosePlan}</option>
                                                    {availablePlans.map((plan) => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.name} ({plan.scope})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const selectedPlanId = planDraftByProjectId[student.latest_project?.id] || student.latest_project?.milestone_plan_id;
                                                        if (!selectedPlanId || !student.latest_project?.id) return;
                                                        router.patch(
                                                            route('supervisor.students.plan.update', student.latest_project.id),
                                                            { plan_id: selectedPlanId },
                                                        );
                                                    }}
                                                    disabled={(student.latest_project?.progress || 0) > 20}
                                                    className="sr-btn-action-secondary h-9 md:h-9 text-xs disabled:bg-gray-400"
                                                >
                                                    {t.applyPlan}
                                                </button>
                                            </div>
                                            {(student.latest_project?.progress || 0) > 20 && (
                                                <p className="mt-2 text-[11px] text-amber-600">{t.lockPlan}</p>
                                            )}
                                        </div>

                                        <Link
                                            href={`${route('supervisor.requests')}?student_id=${student.student_id}`}
                                            className="sr-btn-action-primary h-10 md:h-10"
                                        >
                                            {t.reviewBtn}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
