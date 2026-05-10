import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Head } from '@inertiajs/react';

export default function Milestones({ myProject }) {
    const { isArabic, isDark } = useUiPreferences();
    const progress = myProject?.progress ?? 0;
    const milestone = myProject?.current_milestone ?? (isArabic ? 'لم يتم تحديد مرحلة بعد' : 'No milestone selected yet');

    return (
        <AuthenticatedLayout header={<h2 className={`font-semibold text-xl leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'سجل المراحل' : 'Milestones Log'}</h2>}>
            <Head title={isArabic ? 'سجل المراحل' : 'Milestones Log'} />

            <div dir={isArabic ? 'rtl' : 'ltr'} className={`py-12 ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className={`p-8 ${isDark ? 'sr-card-dark' : 'sr-card-light'}`}>
                        <h3 className={`sr-subtitle mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{isArabic ? 'الحالة الحالية للمشروع' : 'Current Project Status'}</h3>
                        <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mb-4`}>{isArabic ? 'المرحلة' : 'Milestone'}: {milestone}</p>

                        <div className={`w-full rounded-full h-4 overflow-hidden shadow-inner mb-2 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <div
                                className="bg-gradient-to-r from-blue-600 via-blue-400 to-green-400 h-full transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>{isArabic ? 'نسبة الإنجاز' : 'Progress'}: {progress}%</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
