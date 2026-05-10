import { apiClient } from '../http/httpClient';

export interface ChallengesEnvelope {
    status?: string;
    data?: unknown[];
}

/**
 * InnoBridge Laravel: public challenges list (sanctum / guest policy as configured server-side).
 */
export async function fetchChallenges(): Promise<ChallengesEnvelope> {
    const { data } = await apiClient.get<ChallengesEnvelope>('/api/challenges');
    return data ?? {};
}
