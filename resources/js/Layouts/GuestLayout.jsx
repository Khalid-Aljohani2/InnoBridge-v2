import ApplicationLogo from '@/Components/ApplicationLogo';
import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const { isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className={`flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0 transition-colors ${
                isDark ? 'sr-app-bg-dark' : 'sr-app-bg'
            }`}
        >
            <div className={`absolute top-5 ${isArabic ? 'left-5' : 'right-5'} z-20`}>
                <UiControls
                    isDark={isDark}
                    isArabic={isArabic}
                    toggleLanguage={toggleLanguage}
                    toggleTheme={toggleTheme}
                />
            </div>

            <div className="relative z-10">
                <Link href="/">
                    <ApplicationLogo className={`h-20 w-20 fill-current ${isDark ? 'text-slate-200' : 'text-blue-600'}`} />
                </Link>
            </div>

            <p className={`relative z-10 mt-2 mb-3 text-xs font-semibold tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isArabic ? 'بوابة الدخول - Smart R&D Platform' : 'Access Portal - Smart R&D Platform'}
            </p>

            <div className={`absolute top-5 ${isArabic ? 'right-5' : 'left-5'} z-20 flex items-center gap-2`}>
                <Link
                    href="/?about=1"
                    className={isDark
                        ? 'sr-btn-action-neutral h-10 md:h-10 w-auto px-4 bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700'
                        : 'sr-btn-action-neutral h-10 md:h-10 w-auto px-4 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}
                >
                    {isArabic ? 'من نحن' : 'About Us'}
                </Link>
                <button
                    onClick={() => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = '/';
                        }
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition ${
                        isDark
                            ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span>←</span>
                    <span>{isArabic ? 'عودة' : 'Back'}</span>
                </button>
            </div>

            <div
                className={`relative z-10 mt-4 w-full overflow-hidden px-6 py-5 shadow-xl sm:max-w-md rounded-2xl border ${
                    isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
                }`}
            >
                {children}
            </div>
        </div>
    );
}
