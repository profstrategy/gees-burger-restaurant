import type { ApiClient } from '@/lib/api/types';
import { mockApiClient } from '@/lib/api/mock';
import { liveApiClient } from '@/lib/api/live';

export * from '@/lib/api/types';

export const api: ApiClient =
  process.env.NEXT_PUBLIC_API_MODE === 'live' ? liveApiClient : mockApiClient;
