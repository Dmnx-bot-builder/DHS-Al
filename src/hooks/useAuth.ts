// Auth hook — manages current user session and auth actions

import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/storage';
import type { AuthUser, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Restore user from stored session (placeholder — real impl calls /auth/me)
    const storedUser = tokenStorage.getUser();
    if (storedUser) setUser(storedUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authService.login(data);
    tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken, res.tokens.expiresAt);
    tokenStorage.setUser(res.user);
    setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authService.register(data);
    tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken, res.tokens.expiresAt);
    tokenStorage.setUser(res.user);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    return authService.changePassword(data);
  }, []);

  return { user, loading, isAuthenticated: !!user, login, register, logout, changePassword };
}
