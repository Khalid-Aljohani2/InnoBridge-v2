import { Head, Link } from '@inertiajs/react';
import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { useEffect, useMemo, useState } from 'react';

const content = {
    ar: {
        welcomeBadge: 'مرحبا بك في Smart R&D Platform',
        introTitleA: 'منصة تربط',
        introTitleB: 'مشاريع التخرج',
        introTitleC: 'مع تحديات الصناعة',
        introDesc:
            'هدف المنصة هو تحويل مشروع التخرج من متطلب اكاديمي الى تجربة بحث وتطوير حقيقية: الطالب يبني حلا قابلا للتطبيق، المشرف يتابع الانجاز خطوة بخطوة، والقطاع الصناعي يطرح تحديات واقعية ويستفيد من النتائج.',
        card1Title: 'متابعة ذكية',
        card1Desc: 'لوحات تقدم، مراحل، تسليمات، وتقييمات واضحة.',
        card2Title: 'ربط بالصناعة',
        card2Desc: 'تحديات واقعية من الشركات ومقترحات طلابية.',
        card3Title: 'حفظ المعرفة',
        card3Desc: 'نتائج المشاريع تتحول لاساس يساعد الاجيال القادمة.',
        startBtn: 'ابدأ التجربة',
        rolesBtn: 'استعراض الادوار',
        goDashboard: 'الانتقال الى لوحة التحكم',
        roleSubtitle: 'مشاريع التخرج x ربط الصناعة',
        roleTitleA: 'Smart R&D',
        roleTitleB: 'Platform',
        roleDesc: 'البيئة الرقمية لربط طموح الباحثين الاكاديميين باحتياجات القطاع الصناعي.',
        students: 'الطلاب',
        studentsDesc: 'ارفع فكرتك، تابع انجازاتك، وتواصل مع مشرفك الاكاديمي.',
        instructors: 'المشرفون',
        instructorsDesc: 'اشرف على المشاريع، قيم الاداء، وقدم التوجيه الفني للطلاب.',
        industry: 'جهة الصناعة',
        industryDesc: 'اطرح تحدياتك، استقطب المبدعين، وساهم في تطوير حلول وطنية.',
        login: 'تسجيل الدخول',
        createAccount: 'انشاء حساب',
        backToIntro: 'الرجوع لصفحة الترحيب',
        aboutUs: 'من نحن',
    },
    en: {
        welcomeBadge: 'Welcome to Smart R&D Platform',
        introTitleA: 'A Platform Connecting',
        introTitleB: 'Graduation Projects',
        introTitleC: 'with Industry Challenges',
        introDesc:
            'The platform transforms graduation projects from academic requirements into real R&D experiences where students build practical solutions, supervisors track progress, and industry posts real challenges.',
        card1Title: 'Smart Tracking',
        card1Desc: 'Progress boards, milestones, submissions, and clear evaluations.',
        card2Title: 'Industry Link',
        card2Desc: 'Real industry challenges with student proposals.',
        card3Title: 'Knowledge Base',
        card3Desc: 'Project outcomes become a foundation for future cohorts.',
        startBtn: 'Start Experience',
        rolesBtn: 'Explore Roles',
        goDashboard: 'Go to Dashboard',
        roleSubtitle: 'Graduation Projects x Industry Collaboration',
        roleTitleA: 'Smart R&D',
        roleTitleB: 'Platform',
        roleDesc: 'A digital environment connecting academic ambition with real industry needs.',
        students: 'Students',
        studentsDesc: 'Upload ideas, track progress, and communicate with supervisors.',
        instructors: 'Supervisors',
        instructorsDesc: 'Guide teams, evaluate submissions, and manage milestones.',
        industry: 'Industry',
        industryDesc: 'Post challenge statements and collaborate on practical solutions.',
        login: 'Login',
        createAccount: 'Create Account',
        backToIntro: 'Back to Intro',
        aboutUs: 'About Us',
    },
};

export default function Welcome({ auth }) {
    const [showPageSplash, setShowPageSplash] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    const { lang, isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const forceAbout = params.get('about') === '1';
        if (forceAbout) {
            setShowIntro(true);
            return;
        }
        const seen = window.localStorage.getItem('srnd_seen_intro');
        if (seen === '1') setShowIntro(false);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => setShowPageSplash(false), 3000);
        return () => window.clearTimeout(timer);
    }, []);

    const t = useMemo(() => content[lang], [lang]);

    const startExperience = () => {
        setShowIntro(false);
        if (typeof window !== 'undefined') window.localStorage.setItem('srnd_seen_intro', '1');
    };

    const roleCards = useMemo(
        () => [
            {
                id: 'student',
                icon: '🎓',
                title: t.students,
                desc: t.studentsDesc,
                loginClass: 'sr-btn-action-primary',
                registerClass: isDark
                    ? 'sr-btn-action-neutral bg-slate-800 text-blue-200 border border-slate-700 hover:bg-slate-700'
                    : 'sr-btn-action-neutral bg-white text-blue-700 border border-blue-200 hover:bg-blue-50',
            },
            {
                id: 'supervisor',
                icon: '👨‍🏫',
                title: t.instructors,
                desc: t.instructorsDesc,
                loginClass: 'sr-btn-action bg-emerald-600 text-white hover:bg-emerald-700',
                registerClass: isDark
                    ? 'sr-btn-action-neutral bg-slate-800 text-emerald-200 border border-slate-700 hover:bg-slate-700'
                    : 'sr-btn-action-neutral bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50',
            },
            {
                id: 'industry',
                icon: '🏢',
                title: t.industry,
                desc: t.industryDesc,
                loginClass: 'sr-btn-action-secondary',
                registerClass: isDark
                    ? 'sr-btn-action-neutral bg-slate-800 text-violet-200 border border-slate-700 hover:bg-slate-700'
                    : 'sr-btn-action-neutral bg-white text-violet-700 border border-violet-200 hover:bg-violet-50',
            },
        ],
        [t, isDark],
    );

    return (
        <>
            <Head title="Smart R&D Platform" />

            {showPageSplash ? (
                <div className={`min-h-screen flex items-center justify-center ${isDark ? 'sr-app-bg-dark' : 'sr-app-bg'}`}>
                    <div className="text-center px-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-400/30 mb-5 sr-loading">
                            <span className="text-3xl">🚀</span>
                        </div>
                        <h1 className={`text-2xl md:text-3xl font-black tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>Smart R&D Platform</h1>
                        <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                        <div className="mt-5 w-56 h-2 rounded-full bg-slate-700 overflow-hidden mx-auto">
                            <div className="h-full w-full bg-blue-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            ) : (
            <>
            <div
                dir={isArabic ? 'rtl' : 'ltr'}
                className={`min-h-screen flex flex-col items-center justify-center py-12 relative overflow-hidden transition-all duration-500 ${
                    isDark ? 'sr-app-bg-dark' : 'sr-app-bg'
                }`}
            >
                <div className={`absolute top-5 ${isArabic ? 'left-5' : 'right-5'} z-30`}>
                    <UiControls
                        isDark={isDark}
                        isArabic={isArabic}
                        toggleLanguage={toggleLanguage}
                        toggleTheme={toggleTheme}
                    />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className={`h-56 w-56 blur-3xl rounded-full absolute top-10 left-10 ${isDark ? 'bg-blue-500/20' : 'bg-blue-300/25'}`} />
                    <div className={`h-72 w-72 blur-3xl rounded-full absolute bottom-0 right-0 ${isDark ? 'bg-purple-500/20' : 'bg-purple-300/25'}`} />
                    <div className={`h-48 w-48 blur-3xl rounded-full absolute top-1/3 right-1/4 ${isDark ? 'bg-cyan-500/15' : 'bg-cyan-300/20'}`} />
                </div>

                {showIntro ? (
                    <div className="relative z-10 w-full max-w-6xl px-6">
                        <div
                            className={`backdrop-blur-xl border shadow-2xl rounded-3xl p-8 md:p-12 transition ${
                                isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/90 border-white/80'
                            }`}
                        >
                            <p
                                className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold shadow-sm mb-6 border ${
                                    isDark
                                        ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                                        : 'border-blue-200 bg-blue-50 text-blue-700'
                                }`}
                            >
                                {t.welcomeBadge}
                            </p>

                            <h1 className={`text-4xl md:text-6xl font-black leading-tight mb-5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {t.introTitleA} <span className="text-blue-500">{t.introTitleB}</span> {t.introTitleC}
                            </h1>

                            <p className={`text-lg leading-relaxed max-w-4xl mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.introDesc}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                <div className={`rounded-2xl border p-4 ${isDark ? 'border-blue-900 bg-blue-950/40' : 'border-blue-100 bg-blue-50/70'} sr-card-hover`}>
                                    <h3 className={`font-bold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>{t.card1Title}</h3>
                                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>{t.card1Desc}</p>
                                </div>
                                <div className={`rounded-2xl border p-4 ${isDark ? 'border-emerald-900 bg-emerald-950/40' : 'border-emerald-100 bg-emerald-50/70'} sr-card-hover`}>
                                    <h3 className={`font-bold mb-1 ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>{t.card2Title}</h3>
                                    <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{t.card2Desc}</p>
                                </div>
                                <div className={`rounded-2xl border p-4 ${isDark ? 'border-violet-900 bg-violet-950/40' : 'border-violet-100 bg-violet-50/70'} sr-card-hover`}>
                                    <h3 className={`font-bold mb-1 ${isDark ? 'text-violet-200' : 'text-violet-900'}`}>{t.card3Title}</h3>
                                    <p className={`text-sm ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>{t.card3Desc}</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={startExperience}
                                    className="sr-btn-action-primary w-auto px-8"
                                >
                                    {t.startBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="max-w-4xl px-6 text-center mb-16 relative z-10">
                            <p
                                className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold shadow-sm mb-6 border ${
                                    isDark
                                        ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
                                        : 'border-blue-100 bg-white/80 text-blue-700'
                                }`}
                            >
                                {t.roleSubtitle}
                            </p>
                            <h1 className={`text-5xl md:text-6xl font-black mb-6 tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {t.roleTitleA} <span className="text-blue-500">{t.roleTitleB}</span>
                            </h1>
                            <p className={`text-xl leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t.roleDesc}</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowIntro(true)}
                                    className={isDark
                                        ? 'sr-btn-action-neutral w-auto px-5 bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700'
                                        : 'sr-btn-action-neutral w-auto px-5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}
                                >
                                    {t.aboutUs}
                                </button>
                            </div>
                            {auth.user && (
                                <Link
                                    href={route('dashboard')}
                                    className="mt-8 inline-flex sr-btn-action-primary w-auto px-8"
                                >
                                    {t.goDashboard}
                                </Link>
                            )}
                        </div>

                        {!auth.user && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-6xl w-full relative z-10">
                                {roleCards.map((role) => (
                                    <div
                                        key={role.id}
                                        className={`backdrop-blur p-8 rounded-3xl border flex flex-col items-center text-center group sr-card-hover ${
                                            isDark ? 'bg-slate-900/80 border-slate-700 shadow-lg' : 'bg-white/92 border-gray-100 shadow-sm'
                                        }`}
                                    >
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                            {role.icon}
                                        </div>
                                        <h3 className={`font-bold text-2xl mb-2 ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{role.title}</h3>
                                        <p className={`mb-8 text-sm ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>{role.desc}</p>
                                        <div className="flex flex-col w-full gap-3">
                                            <Link href={route('login', { role: role.id })} className={role.loginClass}>
                                                {t.login}
                                            </Link>
                                            <Link href={route('register', { role: role.id })} className={role.registerClass}>
                                                {t.createAccount}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            </>
            )}
        </>
    );
}
