import { getOptionalSupabaseEnv } from '../../config/env';

export type ConnectivityResult =
    | { ok: true; summary: string }
    | { ok: false; summary: string; detail?: string };

/**
 * Lightweight health reachability for Supabase (auth edge) without scattering fetch in UI.
 */
export async function probeSupabaseConnectivity(): Promise<ConnectivityResult> {
    const cfg = getOptionalSupabaseEnv();
    if (!cfg) {
        return {
            ok: false,
            summary: 'متغيرات Supabase غير مُفعّلة (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
        };
    }
    try {
        const url = `${cfg.url.replace(/\/$/, '')}/auth/v1/health`;
        const res = await fetch(url, {
            headers: { apikey: cfg.anonKey },
            method: 'GET',
        });
        if (!res.ok) {
            return {
                ok: false,
                summary: 'خدمة Supabase لم تُرجع حالة سليمة.',
                detail: `HTTP ${res.status}`,
            };
        }
        return { ok: true, summary: 'تم التحقق من اتصال Supabase (auth health).' };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            ok: false,
            summary: 'تعذّر الوصول إلى Supabase.',
            detail: msg,
        };
    }
}
