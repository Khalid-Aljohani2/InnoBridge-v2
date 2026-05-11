import axios, { AxiosError } from 'axios';

import { getApiBaseUrl, getApiWithCredentials } from '../../config/env';

export interface NormalizedHttpError {
    message: string;
    status?: number;
    code?: string;
}

function normalizeAxiosError(err: unknown): NormalizedHttpError {
    if (axios.isAxiosError(err)) {
        const ae = err as AxiosError<{ message?: string }>;
        const dataMsg = ae.response?.data?.message;
        const msg =
            (typeof dataMsg === 'string' && dataMsg) ||
            ae.message ||
            'تعذّر الاتصال بالخادم. تحقق من الشبكة أو إعدادات CORS.';
        return { message: msg, status: ae.response?.status, code: ae.code };
    }
    if (err instanceof Error) {
        return { message: err.message };
    }
    return { message: 'حدث خطأ غير متوقع.' };
}

export const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 30_000,
    withCredentials: getApiWithCredentials(),
});

apiClient.interceptors.response.use(
    (r) => r,
    (error: unknown) => Promise.reject(normalizeAxiosError(error)),
);

/** Sanctum API uses Bearer tokens from POST /api/login */
export function setAuthToken(token: string | null): void {
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common.Authorization;
    }
}

export { normalizeAxiosError };
