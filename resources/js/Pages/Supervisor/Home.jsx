import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function SupervisorHome({ stats, students, recentNotifications }) {
    const { isArabic, isDark } = useUiPreferences();
    const { flash } = usePage().props;
    const [studentQuery, setStudentQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const filteredStudents = useMemo(
        () =>
            students.filter((s) =>
                (s.student_name || '')
                    .toLowerCase()
                    .includes(studentQuery.toLowerCase()),
            ),
        [students, studentQuery],
    );

    const selectedStudent = useMemo(
        () => students.find((s) => String(s.student_id) === String(selectedStudentId)),
        [students, selectedStudentId],
    );

    const statusText = (status) => {
        if (status === 'approved') return isArabic ? 'مقبول' : 'Approved';
        if (status === 'rejected') return isArabic ? 'مرفوض' : 'Rejected';
        if (status === 'awaiting_revision') return isArabic ? 'بانتظار التعديل' : 'Awaiting Revision';
        return isArabic ? 'بانتظار إجراء' : 'Pending Action';
    };

    const milestoneText = (value) => {
        const text = String(value || '').trim();
        if (text === '') return '-';

        const arToEn = {
            'الفكرة - بانتظار/قيد التقييم': 'Idea - Under Review',
            'تحليل النظام': 'System Analysis',
            'مرحلة التنفيذ البرمجي': 'Implementation Stage',
            'الاعتماد النهائي': 'Final Approval',
            'الفكرة مرفوعة - بانتظار قرار المشرف': 'Idea submitted - Waiting for supervisor decision',
            'مقبول من المشرف - الفكرة - بانتظار/قيد التقييم': 'Approved by supervisor - Idea stage',
            'مقبول من المشرف - تحليل النظام': 'Approved by supervisor - Analysis stage',
            'مقبول من المشرف - مرحلة التنفيذ البرمجي': 'Approved by supervisor - Implementation stage',
            'مقبول من المشرف - الاعتماد النهائي': 'Approved by supervisor - Final stage',
            'مطلوب تعديل قبل الموافقة': 'Revision required before approval',
            'مرفوض من المشرف': 'Rejected by supervisor',
            'تم تعديل الملف من الطالب - بانتظار إعادة المراجعة': 'Student resubmitted changes - Waiting for re-review',
            'لم يتم رفع فكرة بعد': 'No idea uploaded yet',
        };

        const enToAr = Object.fromEntries(Object.entries(arToEn).map(([ar, en]) => [en, ar]));
        return isArabic ? enToAr[text] || text : arToEn[text] || text;
    };

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'الرئيسية - المشرف' : 'Supervisor Home'}</h2>}>
            <Head title={isArabic ? 'الرئيسية - المشرف' : 'Supervisor Home'} />

            <div id="overview-section" dir={isArabic ? 'rtl' : 'ltr'} className={`py-10 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="sr-page-shell sr-section-stack">
                    {flash?.success && <div className="rounded-xl bg-green-100 text-green-800 px-4 py-3 text-sm font-semibold">{flash.success}</div>}
                    {flash?.error && <div className="rounded-xl bg-red-100 text-red-800 px-4 py-3 text-sm font-semibold">{flash.error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <p className="text-sm text-gray-500">{isArabic ? 'إجمالي الطلبات' : 'Total Requests'}</p>
                            <p className="text-2xl font-black text-blue-600">{stats.total}</p>
                        </div>
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <p className="text-sm text-gray-500">{isArabic ? 'مقبولة' : 'Approved'}</p>
                            <p className="text-2xl font-black text-green-600">{stats.approved}</p>
                        </div>
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <p className="text-sm text-gray-500">{isArabic ? 'مرفوضة' : 'Rejected'}</p>
                            <p className="text-2xl font-black text-red-600">{stats.rejected}</p>
                        </div>
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <p className="text-sm text-gray-500">{isArabic ? 'بانتظار إجراء' : 'Pending Action'}</p>
                            <p className="text-2xl font-black text-amber-500">{stats.pending}</p>
                        </div>
                        <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                            <p className="text-sm text-gray-500">{isArabic ? 'بانتظار التعديل' : 'Awaiting Revision'}</p>
                            <p className="text-2xl font-black text-blue-500">{stats.awaiting_revision || 0}</p>
                        </div>
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                        <h3 className={`sr-subtitle mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {isArabic ? 'تخصيص الداش بورد حسب الطالب' : 'Dashboard by Student'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                placeholder={isArabic ? 'ابحث باسم الطالب' : 'Search student name'}
                                value={studentQuery}
                                onChange={(e) => setStudentQuery(e.target.value)}
                            />
                            <select
                                className={`w-full rounded-lg ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'border-gray-300'}`}
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">{isArabic ? 'اختر طالب' : 'Select student'}</option>
                                {filteredStudents.map((s) => (
                                    <option key={s.student_id} value={s.student_id}>
                                        {s.student_name}
                                    </option>
                                ))}
                            </select>
                            <Link
                                href={
                                    selectedStudentId
                                        ? `${route('supervisor.requests')}?student_id=${selectedStudentId}`
                                        : route('supervisor.requests')
                                }
                                className="sr-btn-action-primary"
                            >
                                {isArabic ? 'تفاصيل الداش بورد' : 'Dashboard Details'}
                            </Link>
                        </div>

                        {selectedStudent && (
                            <div className={`mt-4 rounded-2xl p-5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                                {(() => {
                                    const latestProject = (selectedStudent.projects || [])[0];
                                    const latestStatus = latestProject?.review_status || 'pending_action';

                                    return (
                                        <>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                                        {selectedStudent.student_name}
                                    </p>
                                    <span className="text-sm font-black text-blue-600">
                                        {isArabic ? 'آخر تقدم' : 'Latest Progress'}: {selectedStudent.latest_progress}%
                                    </span>
                                </div>

                                <div className={`mt-3 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-blue-100'}`}>
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                                        style={{ width: `${selectedStudent.latest_progress || 0}%` }}
                                    />
                                </div>

                                <div className={`mt-3 rounded-xl p-3 ${isDark ? 'bg-slate-900/70' : 'bg-white/70'}`}>
                                    <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                        {isArabic ? 'تفاصيل آخر تقدم' : 'Latest Progress Details'}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {isArabic ? 'آخر مشروع' : 'Latest Project'}: {latestProject?.title || '-'}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {isArabic ? 'المرحلة الحالية' : 'Current Milestone'}:{' '}
                                        {milestoneText(latestProject?.current_milestone || selectedStudent.latest_status)}
                                    </p>
                                    <p className="text-xs mt-1 text-indigo-600 font-semibold">
                                        {isArabic ? 'حالة المراجعة' : 'Review Status'}: {statusText(latestStatus)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs">
                                    <div className="rounded-lg px-2 py-1.5 bg-slate-100 text-slate-700">
                                        {isArabic ? 'المشاريع' : 'Projects'}: {selectedStudent.projects_count}
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5 bg-amber-50 text-amber-700">
                                        {isArabic ? 'بانتظار إجراء' : 'Pending'}: {selectedStudent.status_counts?.pending_action ?? 0}
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5 bg-blue-50 text-blue-700">
                                        {isArabic ? 'بانتظار التعديل' : 'Awaiting'}: {selectedStudent.status_counts?.awaiting_revision ?? 0}
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5 bg-emerald-50 text-emerald-700">
                                        {isArabic ? 'مقبول' : 'Approved'}: {selectedStudent.status_counts?.approved ?? 0}
                                    </div>
                                    <div className="rounded-lg px-2 py-1.5 bg-red-50 text-red-700">
                                        {isArabic ? 'مرفوض' : 'Rejected'}: {selectedStudent.status_counts?.rejected ?? 0}
                                    </div>
                                </div>

                                <p className={`mt-4 text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                                    {isArabic ? 'تفاصيل مشاريع الطالب' : 'Student Project Details'}
                                </p>
                                <div className="mt-2 space-y-2">
                                    {(selectedStudent.projects || []).map((project) => (
                                        <div key={project.id} className={`rounded-xl p-3 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{project.title}</p>
                                                <span
                                                    className={
                                                        project.review_status === 'approved'
                                                            ? 'sr-chip-emerald'
                                                            : project.review_status === 'rejected'
                                                              ? 'sr-chip-red'
                                                              : project.review_status === 'awaiting_revision'
                                                                ? 'sr-chip-blue'
                                                                : 'sr-chip-amber'
                                                    }
                                                >
                                                    {statusText(project.review_status)}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                                {isArabic ? 'الحالة' : 'Status'}: {milestoneText(project.current_milestone)}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span className="text-blue-600">{isArabic ? 'التقدم' : 'Progress'}: {project.progress}%</span>
                                                {project.file_path && (
                                                    <a
                                                        href={`/storage/${project.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-indigo-600 hover:underline font-bold"
                                                    >
                                                        {isArabic ? 'عرض الملف' : 'Open file'}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-6`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`sr-subtitle ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'طلبات الطلاب' : 'Student Requests'}</h3>
                            <Link href={route('supervisor.requests')} className="sr-btn-action-primary max-w-xs">
                                {isArabic ? 'فتح صفحة المراجعة' : 'Open Review Page'}
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {students.map((student) => (
                                <div key={student.student_id} className={`rounded-xl px-4 py-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{student.student_name}</p>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {isArabic ? 'عدد الملفات' : 'Submissions'}: {student.projects_count} - {isArabic ? 'آخر تقدم' : 'Latest progress'}: {student.latest_progress}%
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        {isArabic ? 'حالة المراجعة' : 'Review Status'}: {statusText(student.latest_review_status)}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {isArabic ? 'المرحلة' : 'Milestone'}: {milestoneText(student.latest_status)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            href={route('supervisor.groups.index')}
                            className="sr-btn-action-secondary max-w-xs"
                        >
                            {isArabic ? 'فتح محادثات المجموعات' : 'Open Group Chats'}
                        </Link>
                    </div>

                    <div id="notifications-section" className={`${isDark ? 'sr-card-dark' : 'sr-card-light'} p-5`}>
                        <h4 className={`font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'آخر الإشعارات المرسلة' : 'Recent Sent Notifications'}</h4>
                        <div className="space-y-2">
                            {recentNotifications.map((n) => (
                                <div key={n.id} className={`rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                    <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{n.title}</p>
                                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{n.message}</p>
                                    <p className="text-xs text-blue-600 mt-1">{isArabic ? 'إلى:' : 'To:'} {n.student?.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
