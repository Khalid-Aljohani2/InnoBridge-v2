/**
 * Barrel for app-wide service entry points. Import from '@/services' in UI — not axios/supabase raw.
 */

export { setAuthToken, apiClient, normalizeAxiosError } from './http/httpClient';

export type { NormalizedHttpError } from './http/httpClient';

export { fetchChallenges } from './api/challengesService';

export { getOptionalSupabaseClient } from './supabase/supabaseBrowserClient';

export { probeSupabaseConnectivity } from './supabase/supabaseConnectivity';

export { probeLaravelPublicApi } from './connectivity/browseConnectivity';

export { getApiBaseUrl, getOptionalSupabaseEnv } from '../config/env';
