// Authentication service — login, register, refresh, logout, 2FA

import { apiPost } from './apiClient';
import type {
  LoginRequest, RegisterRequest, AuthResponse,
  RefreshTokenRequest, ChangePasswordRequest, Enable2FARequest, TwoFAStatus,
} from '../types';

export const authService = {
  login: (data: LoginRequest) =>
    apiPost<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiPost<AuthResponse>('/auth/register', data),

  refresh: (data: RefreshTokenRequest) =>
    apiPost<AuthResponse>('/auth/refresh', data),

  logout: () =>
    apiPost<void>('/auth/logout'),

  changePassword: (data: ChangePasswordRequest) =>
    apiPost<void>('/auth/change-password', data),

  enable2FA: (data: Enable2FARequest) =>
    apiPost<TwoFAStatus>('/auth/2fa/enable', data),

  disable2FA: (data: Enable2FARequest) =>
    apiPost<TwoFAStatus>('/auth/2fa/disable', data),

  get2FAStatus: () =>
    apiPost<TwoFAStatus>('/auth/2fa/status'),
};
