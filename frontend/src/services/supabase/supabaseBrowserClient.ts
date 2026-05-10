import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getOptionalSupabaseEnv } from '../../config/env';

let singleton: SupabaseClient | null = null;

/** Shared browser client — only instantiated when anon env vars are present. */
export function getOptionalSupabaseClient(): SupabaseClient | null {
    const cfg = getOptionalSupabaseEnv();
    if (!cfg) return null;
    if (!singleton) {
        singleton = createClient(cfg.url, cfg.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
        });
    }
    return singleton;
}
