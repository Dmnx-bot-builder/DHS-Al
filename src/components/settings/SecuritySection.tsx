import { Lock, ShieldCheck, Smartphone, Clock } from 'lucide-react';
import { type SecuritySettings } from '../../data/settings';
import { SettingsSection, Field, TextInput, Toggle } from './SettingsControls';
import { Badge } from '../ui/GlassCard';

interface Props {
  settings: SecuritySettings;
  onChange: (v: SecuritySettings) => void;
}

export function SecuritySection({ settings, onChange }: Props) {
  const passwordsMatch = settings.newPassword.length > 0 && settings.newPassword === settings.confirmPassword;
  const passwordStrength = getPasswordStrength(settings.newPassword);

  return (
    <SettingsSection icon={<Lock className="h-5 w-5" />} title="Security" description="Protect your account and manage authentication" accent="bear">
      <div className="mb-5">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">Change Password</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Current Password">
            <TextInput type="password" value={settings.currentPassword}
              onChange={(e) => onChange({ ...settings, currentPassword: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="New Password">
            <TextInput type="password" value={settings.newPassword}
              onChange={(e) => onChange({ ...settings, newPassword: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Confirm Password">
            <TextInput type="password" value={settings.confirmPassword}
              onChange={(e) => onChange({ ...settings, confirmPassword: e.target.value })} placeholder="••••••••" />
          </Field>
        </div>
        {settings.newPassword.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Strength:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 w-10 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'}`} />
                ))}
              </div>
              <span className={`text-[10px] font-medium ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
            </div>
            {settings.confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[10px] text-bear-400">Passwords do not match</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 pt-5">
        <div className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-800/40 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-300">Two-Factor Authentication (2FA)</p>
                {settings.twoFactorEnabled && <Badge variant="success" dot>Enabled</Badge>}
              </div>
              <p className="text-[10px] text-slate-500">Add an extra layer of security to your account</p>
            </div>
          </div>
          <Toggle checked={settings.twoFactorEnabled} onChange={(v) => onChange({ ...settings, twoFactorEnabled: v })} />
        </div>

        {settings.twoFactorEnabled && (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-brand-500/15 bg-brand-500/[0.04] px-4 py-4 animate-fade-in">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <div className="grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className={`h-2 w-2 rounded-sm ${Math.random() > 0.5 ? 'bg-brand-300' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-300">Scan QR with your authenticator app</p>
              <p className="mt-1 text-[10px] text-slate-500">Use Google Authenticator, Authy, or any TOTP-compatible app. Enter the 6-digit code to verify.</p>
              <div className="mt-2 flex items-center gap-2">
                <input className="tabular w-32 rounded-lg border border-white/10 bg-ink-800/60 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500/50" placeholder="000000" maxLength={6} />
                <button className="rounded-lg bg-brand-500/20 px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-brand-500/30">Verify</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/5 pt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Session Timeout (minutes)" hint="Auto-logout after inactivity">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-slate-500" />
              <TextInput type="number" min={5} max={240} value={settings.sessionTimeout}
                onChange={(e) => onChange({ ...settings, sessionTimeout: Number(e.target.value) })} />
            </div>
          </Field>
          <Field label="IP Whitelist" hint="Comma-separated IP addresses (leave empty for any)">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              <TextInput value={settings.ipWhitelist}
                onChange={(e) => onChange({ ...settings, ipWhitelist: e.target.value })} placeholder="192.168.1.1, 10.0.0.5" />
            </div>
          </Field>
        </div>
      </div>
    </SettingsSection>
  );
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string; textColor: string } {
  if (pw.length === 0) return { score: 0, label: '—', color: 'bg-white/10', textColor: 'text-slate-500' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-bear-500', 'bg-gold-500', 'bg-brand-500', 'bg-bull-500'];
  const textColors = ['text-bear-400', 'text-gold-400', 'text-brand-300', 'text-bull-400'];
  return { score, label: labels[score - 1] ?? '—', color: colors[score - 1] ?? 'bg-white/10', textColor: textColors[score - 1] ?? 'text-slate-500' };
}
