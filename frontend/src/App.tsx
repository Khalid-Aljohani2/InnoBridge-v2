import { useEffect, useState } from 'react';

import { getApiBaseUrl, getOptionalSupabaseEnv } from '@/config/env';
import { probeLaravelPublicApi, probeSupabaseConnectivity } from '@/services';

type ProbeLine = { title: string; detail: string; severity: 'ok' | 'warn' | 'err' };

/**
 * SPA shell — all remote access goes through `@/services` layer (never axios/supabase directly here).
 */
function App() {
    const [lines, setLines] = useState<ProbeLine[]>([{ title: 'التشغيل…', detail: '', severity: 'warn' }]);

    useEffect(() => {
        let cancelled = false;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'browser';

        (async () => {
            const [laravel, supa] = await Promise.all([
                probeLaravelPublicApi(origin),
                probeSupabaseConnectivity(),
            ]);

            if (cancelled) return;

            const next: ProbeLine[] = [];

            if (laravel.ok) {
                next.push({
                    title: 'اتصال Laravel API',
                    detail: `${laravel.statusNote} — عدد تحديات (عيّنة): ${laravel.challengesCount}`,
                    severity: 'ok',
                });
            } else {
                next.push({
                    title: 'اتصال Laravel API',
                    detail: `${laravel.summary} ${laravel.detail ?? ''}`.trim(),
                    severity: 'err',
                });
            }

            if (supa.ok) {
                next.push({
                    title: 'Supabase (اتصال أولي)',
                    detail: supa.summary,
                    severity: 'ok',
                });
            } else {
                next.push({
                    title: 'Supabase',
                    detail: `${supa.summary}${supa.detail ? ` — ${supa.detail}` : ''}`,
                    severity: 'warn',
                });
            }

            setLines(next);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main style={{ fontFamily: 'system-ui,sans-serif', maxWidth: 640, margin: '3rem auto', padding: '0 1rem' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>InnoBridge — واجهة SPA منفصلة</h1>
            <p style={{ color: '#444', marginTop: 0 }}>
                عنوان API الخلفي: <code>{getApiBaseUrl()}</code>
                <br />
                Supabase URL:{' '}
                <code>{getOptionalSupabaseEnv()?.url ?? '(لم يُضبط — اختياري لهذه الشاشة)'}</code>
            </p>

            <ul style={{ paddingInlineStart: '1rem', marginTop: '1.5rem' }}>
                {lines.map((ln) => (
                    <li key={`${ln.title}-${ln.severity}`} style={{ marginBottom: '1rem', color: ln.severity === 'err' ? '#b91c1c' : ln.severity === 'warn' ? '#92400e' : '#14532d' }}>
                        <strong>{ln.title}</strong>
                        <div style={{ fontSize: '0.92rem', marginTop: '0.25rem' }}>{ln.detail}</div>
                    </li>
                ))}
            </ul>

            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                المصدر الصحيح لتعديل الطلبات: مجلد <code>src/services</code>. لا تضع اتصالات شبكة داخل المكوّنات.
            </p>
        </main>
    );
}

export default App;
