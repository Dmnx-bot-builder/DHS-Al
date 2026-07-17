// Validation utilities — email, password strength, MT5 credentials

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface PasswordValidation {
  isValid: boolean;
  score: number;
  label: string;
  checks: { length: boolean; upper: boolean; lower: boolean; number: boolean; special: boolean };
}

export function validatePassword(pw: string): PasswordValidation {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return {
    isValid: checks.length && checks.upper && checks.lower && checks.number,
    score,
    label: labels[score] ?? '—',
    checks,
  };
}

export function isValidMt5Login(login: string): boolean {
  return /^\d{5,12}$/.test(login);
}

export function isValidIpAddress(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

export function isValidIpsList(ips: string): boolean {
  if (!ips.trim()) return true;
  return ips.split(',').every((ip) => isValidIpAddress(ip.trim()));
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
