import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function useUiPreferences() {
    const page = usePage();
    const authUser = page?.props?.auth?.user;
    const [lang, setLang] = useState('ar');
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedLang = window.localStorage.getItem('srnd_lang');
        const savedTheme = window.localStorage.getItem('srnd_theme');

        if (savedLang === 'ar' || savedLang === 'en') {
            setLang(savedLang);
        } else {
            // First visit fallback: infer language from browser locale.
            const browserLang = (window.navigator.language || '').toLowerCase();
            const inferredLang = browserLang.startsWith('ar') ? 'ar' : 'en';
            setLang(inferredLang);
            window.localStorage.setItem('srnd_lang', inferredLang);
        }

        if (savedTheme === 'dark' || savedTheme === 'light') {
            setTheme(savedTheme);
        } else {
            // First visit fallback: infer theme from OS preference.
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const inferredTheme = prefersDark ? 'dark' : 'light';
            setTheme(inferredTheme);
            window.localStorage.setItem('srnd_theme', inferredTheme);
        }
    }, []);

    useEffect(() => {
        if (!authUser) return;
        if (authUser.preferred_language === 'ar' || authUser.preferred_language === 'en') {
            setLang(authUser.preferred_language);
        }
        if (authUser.preferred_theme === 'light' || authUser.preferred_theme === 'dark') {
            setTheme(authUser.preferred_theme);
        }
    }, [authUser]);

    const syncToServer = async (nextLang, nextTheme) => {
        if (typeof window === 'undefined' || !authUser) return;
        try {
            await window.axios.patch(route('preferences.update'), {
                language: nextLang,
                theme: nextTheme,
            });
        } catch {
            // Keep local preference even if server sync fails.
        }
    };

    const toggleLanguage = () => {
        const next = lang === 'ar' ? 'en' : 'ar';
        setLang(next);
        if (typeof window !== 'undefined') window.localStorage.setItem('srnd_lang', next);
        syncToServer(next, theme);
    };

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        if (typeof window !== 'undefined') window.localStorage.setItem('srnd_theme', next);
        syncToServer(lang, next);
    };

    return useMemo(
        () => ({
            lang,
            theme,
            isArabic: lang === 'ar',
            isDark: theme === 'dark',
            toggleLanguage,
            toggleTheme,
        }),
        [lang, theme],
    );
}
