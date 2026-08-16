/**
 * KASIR POS — API Service
 *
 * Base HTTP client for communicating with the backend API.
 * Uses fetch with interceptors for auth tokens.
 *
 * Security:
 * - Tokens stored in memory only (not localStorage)
 * - HTTPS enforced via CSP in production
 * - No credentials in URL parameters
 * - Generic error messages to user (detailed logs for devs)
 */

import { getSetting } from './database';

// In-memory token storage (not localStorage — XSS safe)
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Get the configured server base URL from settings.
 */
async function getBaseUrl(): Promise<string> {
  const url = await getSetting('server_url');
  return url ?? 'http://localhost:8000';
}

/**
 * Generic API response type
 */
interface ApiResult<T> {
  ok: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

/**
 * Make an authenticated API request.
 *
 * All inputs are passed as JSON body (never URL parameters for sensitive data).
 */
export async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json();

    if (response.ok) {
      return {
        ok: true,
        data: json.data as T,
        message: json.message ?? 'Success',
        status: response.status,
      };
    }

    return {
      ok: false,
      message: json.message ?? 'Request failed',
      errors: json.errors,
      status: response.status,
    };
  } catch {
    return {
      ok: false,
      message: 'Tidak dapat terhubung ke server',
      status: 0,
    };
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown) => apiRequest<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body?: unknown) => apiRequest<T>('PUT', endpoint, body),
  delete: <T>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
};
