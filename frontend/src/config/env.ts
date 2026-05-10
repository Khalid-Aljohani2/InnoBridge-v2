/**
 * Central accessors for environment (Vite exposes only variables prefixed with VITE_).
 * Never read process.env directly in components — import from here via services layer.
 */

const trim = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : '';

/**
 * Laravel API origin (Sanctum / REST). Trailing slashes removed for axios baseURL safety.
 */
export function getApiBaseUrl(): string {
    const configured = trim(import.meta.env.VITE_API_BASE_URL);
    if (configured) return configured.replace(/\/$/, '');
    return 'http://127.0.0.1:8000';
}

export type SupabaseEnv = Readonly<{ url: string; anonKey: string }>;

/**
 * Anonymous key is safe for browsers when RLS protects tables; never expose service-role keys.
 */
export function getOptionalSupabaseEnv(): SupabaseEnv | null {
    const url = trim(import.meta.env.VITE_SUPABASE_URL);
    const anonKey = trim(import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!url || !anonKey) return null;
    return { url: url.replace(/\/$/, ''), anonKey };
}
