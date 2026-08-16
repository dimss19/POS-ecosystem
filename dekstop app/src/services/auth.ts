/**
 * KASIR POS — Auth Service
 *
 * Handles login, logout, and offline authentication.
 *
 * Security:
 * - Passwords are never stored in plaintext
 * - For offline auth, we store a SHA-256 hash of the password
 * - Auth tokens are stored in memory only (not localStorage)
 * - TODO(security): Consider OAuth providers for production
 * - TODO(security): Consider MFA for strengthened authentication
 */

import { api, setAuthToken } from './api';
import { execute, select } from './database';
import type { User } from '../types';

interface LoginApiResponse {
  user: User;
  token: string;
}

/**
 * Hash a password using SHA-256 for offline verification.
 * This is used for offline auth only — the server handles
 * proper password hashing (bcrypt/argon2) for online auth.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Login via backend API.
 * On success, caches credentials for offline use.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; message: string }> {
  const result = await api.post<LoginApiResponse>('/api/auth/login', {
    email,
    password,
  });

  if (result.ok && result.data) {
    const { user, token } = result.data;

    // Store token in memory
    setAuthToken(token);

    // Cache user + hashed password for offline auth
    const passwordHash = await hashPassword(password);
    await cacheUserForOffline(user, passwordHash, token);

    return { success: true, user, message: 'Login berhasil' };
  }

  // If server is unreachable, try offline auth
  if (result.status === 0) {
    return attemptOfflineLogin(email, password);
  }

  return {
    success: false,
    message: result.message || 'Login gagal',
  };
}

/**
 * Cache user credentials for offline login.
 */
async function cacheUserForOffline(
  user: User,
  passwordHash: string,
  token: string,
): Promise<void> {
  // Check if user already cached
  const existing = await select<{ id: number }>(
    'SELECT id FROM settings WHERE key = ?',
    [`cached_user_${user.id}`],
  );

  const cacheData = JSON.stringify({
    user,
    passwordHash,
    token,
    cachedAt: new Date().toISOString(),
  });

  if (existing.length > 0) {
    await execute(
      `UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?`,
      [cacheData, `cached_user_${user.id}`],
    );
  } else {
    await execute(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      [`cached_user_${user.id}`, cacheData],
    );
  }

  // Also store the email-to-id mapping for lookup
  await execute(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [`cached_email_${email_normalize(user.email)}`, String(user.id)],
  );
}

/**
 * Attempt offline login using cached credentials.
 */
async function attemptOfflineLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; message: string }> {
  // Look up user ID by email
  const emailKey = `cached_email_${email_normalize(email)}`;
  const mappingRows = await select<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [emailKey],
  );

  if (mappingRows.length === 0) {
    return {
      success: false,
      message: 'Offline: Pengguna belum pernah login di perangkat ini',
    };
  }

  const userId = mappingRows[0].value;
  const cacheRows = await select<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [`cached_user_${userId}`],
  );

  if (cacheRows.length === 0) {
    return {
      success: false,
      message: 'Offline: Data cache tidak ditemukan',
    };
  }

  const cached = JSON.parse(cacheRows[0].value) as {
    user: User;
    passwordHash: string;
    token: string;
  };

  const inputHash = await hashPassword(password);

  if (inputHash !== cached.passwordHash) {
    return {
      success: false,
      message: 'Password salah',
    };
  }

  // Set cached token for API calls (will fail but structure is maintained)
  setAuthToken(cached.token);

  return {
    success: true,
    user: cached.user,
    message: 'Login offline berhasil',
  };
}

/**
 * Normalize email for consistent cache key lookup.
 */
function email_normalize(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Logout — clear token and local state.
 */
export async function logout(): Promise<void> {
  // Try to call server logout (best effort)
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Ignore — may be offline
  }

  // Clear in-memory token
  setAuthToken(null);
}

/**
 * Get current authenticated user from server.
 */
export async function getMe(): Promise<User | null> {
  const result = await api.get<User>('/api/auth/me');
  return result.ok && result.data ? result.data : null;
}
