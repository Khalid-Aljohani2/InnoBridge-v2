import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import UiControls from '@/Components/UiControls';
import useUiPreferences from '@/hooks/useUiPreferences';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const supervisorMeta = page.props.supervisorMeta;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { isArabic, isDark, toggleLanguage, toggleTheme } = useUiPreferences();

    const isSupervisor = ['supervisor', 'admin'].includes(user?.role);
    const t = useMemo(
        () =>
            isArabic
                ? {
                      dashboard: 'لوحة التحكم',
                      reviewQueue: 'قائمة المراجعة',
                      students: 'الطلاب',
                      groups: 'المجموعات',
                      notifications: 'الإشعارات',
                      milestones: 'المراحل',
                      uploads: 'رفع الملفات',
                      collapseSidebar: 'تصغير القائمة',
                      expandSidebar: 'توسيع القائمة',
                      back: 'عودة',
                      profile: 'الملف الشخصي',
                      logout: 'تسجيل الخروج',
                      role: 'الدور',
                      lang: 'EN',
                      theme: isDark ? 'Light' : 'Dark',
                  }
                : {
                      dashboard: 'Dashboard',
                      reviewQueue: 'Review Queue',
                      students: 'Students',
                      groups: 'Groups',
                      notifications: 'Notifications',
                      milestones: 'Milestones',
                      uploads: 'Uploads',
                      collapseSidebar: 'Collapse Menu',
                      expandSidebar: 'Expand Menu',
                      back: 'Back',
                      profile: 'Profile',
                      logout: 'Log Out',
                      role: 'Role',
                      lang: 'عربي',
                      theme: isDark ? 'Light' : 'Dark',
                  },
        [isArabic, isDark],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = window.localStorage.getItem('srnd_sidebar_collapsed');
        setIsSidebarCollapsed(saved === '1');
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('srnd_sidebar_collapsed', next ? '1' : '0');
            }
            return next;
        });
    };

    const handleBack = () => {
        if (isSupervisor) {
            window.location.href = route('dashboard');
            return;
        }

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/';
        }
    };

    const iconClass = 'h-5 w-5 shrink-0';
    const icons = {
        dashboard: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M3 13.2c0-.8.36-1.56.98-2.08l6.5-5.39a2.5 2.5 0 0 1 3.04 0l6.5 5.39c.62.52.98 1.28.98 2.08V20a1 1 0 0 1-1 1h-5v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5H4a1 1 0 0 1-1-1v-6.8Z" />
            </svg>
        ),
        students: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M17 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
                <circle cx="10" cy="8" r="3" />
                <path d="M23 21v-1a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a3 3 0 0 1 0 5.74" />
            </svg>
        ),
        review: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
            </svg>
        ),
        groups: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M7 10h10a2 2 0 0 1 2 2v5H5v-5a2 2 0 0 1 2-2Z" />
                <circle cx="12" cy="5.5" r="2.5" />
                <path d="M7 17h10" />
            </svg>
        ),
        notifications: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V10a6 6 0 1 0-12 0v4.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M10 17a2 2 0 0 0 4 0" />
            </svg>
        ),
        milestones: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M4 20V8" />
                <path d="M10 20V4" />
                <path d="M16 20v-6" />
                <path d="M22 20V11" />
            </svg>
        ),
        uploads: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
            </svg>
        ),
    };

    return (
        <div dir={isArabic ? 'rtl' : 'ltr'} className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
            <nav className={`border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className={`block h-9 w-auto fill-current ${isDark ? 'text-slate-100' : 'text-gray-800'}`} />
                                </Link>
                            </div>

                            <div className="hidden sm:-my-px sm:ms-6 sm:flex sm:items-center gap-3">
                                <button
                                    onClick={handleBack}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                        isDark
                                            ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{isArabic ? '→' : '←'}</span>
                                    <span>{t.back}</span>
                                </button>
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                    {t.dashboard}
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center gap-2">
                            <div className="relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                                                    isDark
                                                        ? 'bg-slate-900 text-slate-200 hover:text-white'
                                                        : 'bg-white text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                {user.name}
                                                <span className={`mx-2 text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                                                    ({t.role}: {user.role})
                                                </span>
                                                <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.edit')}>{t.profile}</Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            {t.logout}
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>

                            <UiControls
                                isDark={isDark}
                                isArabic={isArabic}
                                toggleLanguage={toggleLanguage}
                                toggleTheme={toggleTheme}
                                compact
                            />
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className={`inline-flex items-center justify-center rounded-md p-2 transition ${
                                    isDark
                                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                                }`}
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <button
                            onClick={handleBack}
                            className={`mx-3 mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                isDark
                                    ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <span>{isArabic ? '→' : '←'}</span>
                            <span>{t.back}</span>
                        </button>
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            {t.dashboard}
                        </ResponsiveNavLink>
                        {isSupervisor ? (
                            <>
                                <ResponsiveNavLink href={route('supervisor.students')} active={route().current('supervisor.students')}>
                                    {t.students}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('supervisor.requests')} active={route().current('supervisor.requests')}>
                                    {t.reviewQueue} ({supervisorMeta?.review_queue_count ?? 0})
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('supervisor.milestones')} active={route().current('supervisor.milestones')}>
                                    {t.milestones}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('supervisor.groups.index')} active={route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')}>
                                    {t.groups}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('supervisor.notifications')} active={route().current('supervisor.notifications')}>
                                    {t.notifications} ({supervisorMeta?.notification_count ?? 0})
                                </ResponsiveNavLink>
                            </>
                        ) : (
                            <>
                                <ResponsiveNavLink href={route('milestones.index')} active={route().current('milestones.index')}>
                                    {t.milestones}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('student.uploads')} active={route().current('student.uploads')}>
                                    {t.uploads}
                                </ResponsiveNavLink>
                                <ResponsiveNavLink href={route('supervisor.groups.index')} active={route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')}>
                                    {t.groups}
                                </ResponsiveNavLink>
                            </>
                        )}
                    </div>

                    <div className={`border-t pb-1 pt-4 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                        <div className="px-4">
                            <div className={`text-base font-medium ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{user.name}</div>
                            <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</div>
                        </div>
                        <div className="px-4 mt-3">
                            <UiControls
                                isDark={isDark}
                                isArabic={isArabic}
                                toggleLanguage={toggleLanguage}
                                toggleTheme={toggleTheme}
                                compact
                            />
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>{t.profile}</ResponsiveNavLink>
                            <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                {t.logout}
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className={`${isDark ? 'bg-slate-900 shadow-slate-900/40' : 'bg-white shadow'} shadow`}>
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <div className="flex">
                <aside
                    className={`hidden lg:block min-h-[calc(100vh-8rem)] border-e transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed ? 'w-20' : 'w-64'
                    } ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}
                >
                    <div className="p-3 space-y-2">
                        <div className={`mb-2 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                            <div className="flex items-center">
                                <ApplicationLogo className={`h-8 w-8 ${isDark ? 'text-slate-100' : 'text-blue-600'}`} />
                                {!isSidebarCollapsed && <span className={`ms-2 text-sm font-black ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Smart R&D</span>}
                            </div>
                            <button
                                onClick={toggleSidebar}
                                title={isSidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
                                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border transition ${
                                    isDark
                                        ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {isSidebarCollapsed ? '»' : '«'}
                            </button>
                        </div>

                        <Link
                            href={route('dashboard')}
                            className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                route().current('dashboard')
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : isDark
                                      ? 'text-slate-200 hover:bg-slate-800'
                                      : 'text-gray-700 hover:bg-gray-100'
                            } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                        >
                            <span>{icons.dashboard}</span>
                            {!isSidebarCollapsed && <span className="ms-2">{t.dashboard}</span>}
                        </Link>

                        {isSupervisor ? (
                            <>
                                <Link
                                    href={route('supervisor.students')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.students')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.students}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.students}</span>}
                                </Link>

                                <Link
                                    href={route('supervisor.milestones')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.milestones')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <span>{icons.milestones}</span>
                                        {!isSidebarCollapsed && <span>{t.milestones}</span>}
                                    </span>
                                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                        {supervisorMeta?.review_queue_count ?? 0}
                                    </span>
                                </Link>
                                <Link
                                    href={route('supervisor.requests')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.requests')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.review}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.reviewQueue}</span>}
                                </Link>

                                <Link
                                    href={route('student.uploads')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('student.uploads')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.uploads}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.uploads}</span>}
                                </Link>
                                <Link
                                    href={route('supervisor.groups.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.groups}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.groups}</span>}
                                </Link>

                                <Link
                                    href={route('supervisor.notifications')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.notifications')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
                                >
                                    <span className={`inline-flex items-center ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                                        <span>{icons.notifications}</span>
                                        {!isSidebarCollapsed && <span>{t.notifications}</span>}
                                    </span>
                                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">
                                        {supervisorMeta?.notification_count ?? 0}
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={route('milestones.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('milestones.index')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.milestones}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.milestones}</span>}
                                </Link>
                                <Link
                                    href={route('supervisor.groups.index')}
                                    className={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                                        route().current('supervisor.groups.index') || route().current('supervisor.groups.chat')
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : isDark
                                              ? 'text-slate-200 hover:bg-slate-800'
                                              : 'text-gray-700 hover:bg-gray-100'
                                    } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                    <span>{icons.groups}</span>
                                    {!isSidebarCollapsed && <span className="ms-2">{t.groups}</span>}
                                </Link>
                            </>
                        )}
                    </div>
                </aside>
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
