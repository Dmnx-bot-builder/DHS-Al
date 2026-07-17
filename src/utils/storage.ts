// Token & user storage utilities — localStorage with type safety

import { STORAGE_KEYS } from './constants';
import type { AuthUser } from '../types';

export const tokenStorage = {
  getAccessToken(): string | null {
    try { return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN); } catch { return null; }
  },

  getRefreshToken(): string | null {
    try { return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN); } catch { return null; }
  },

  getTokenExpiry(): number | null {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      return v ? Number(v) : null;
    } catch { return null; }
  },

  getUser(): AuthUser | null {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.USER);
      return v ? JSON.parse(v) as AuthUser : null;
    } catch { return null; }
  },

  setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiresAt));
    } catch { /* storage unavailable */ }
  },

  setUser(user: AuthUser): void {
    try { localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)); } catch { /* noop */ }
  },

  isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= expiry;
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch { /* noop */ }
  },
};
