// ApiConfigSection — Settings section for managing the TwelveData API key.
// Allows save, update, test, and clear operations with masked display.

import { useState, useEffect } from 'react';
import { KeyRound, Save, Trash2, Zap, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { SettingsSection, Field, TextInput } from './SettingsControls';
import { Badge } from '../ui/GlassCard';
import { apiKeyStorageService } from '../../services/apiKeyStorageService';
import { marketDataService } from '../../services/marketDataService';
import { notificationService } from '../../services/notificationService';
import type { ApiKeyStorageState } from '../../services/apiKeyStorageService';

export function ApiConfigSection() {
  const [storageState, setStorageState] = useState<ApiKeyStorageState>(apiKeyStorageService.getState());
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = apiKeyStorageService.subscribe((state) => {
      setStorageState(state);
    });
    return unsubscribe;
  }, []);

  const hasKey = storageState.hasKey;
  const source = storageState.source;

  const handleSave = async () => {
    const trimmed = inputKey.trim();
    if (trimmed.length < 8) {
      setFeedback({ type: 'error', message: 'API key must be at least 8 characters long.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const wasExisting = hasKey;
    const success = apiKeyStorageService.saveApiKey(trimmed);

    if (success) {
      setInputKey('');
      setIsEditing(false);
      setShowKey(false);
      setFeedback({ type: 'success', message: wasExisting ? 'API key updated successfully.' : 'API key saved successfully.' });

      notificationService.add({
        category: 'SYSTEM',
        subtype: wasExisting ? 'API_KEY_UPDATED' : 'API_KEY_SAVED',
        title: wasExisting ? 'API Key Updated' : 'API Key Saved',
        description: wasExisting
          ? 'TwelveData API key has been updated. Reconnecting to live market data...'
          : 'TwelveData API key saved. Attempting to connect to live market data...',
      });
    } else {
      setFeedback({ type: 'error', message: 'Failed to save API key. Please try again.' });
    }

    setSaving(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleClear = () => {
    apiKeyStorageService.clearApiKey();
    setInputKey('');
    setIsEditing(false);
    setShowKey(false);
    setFeedback({ type: 'success', message: 'API key cleared. Switched to mock mode.' });
    setTestResult(null);

    notificationService.add({
      category: 'SYSTEM',
      subtype: 'API_KEY_REMOVED',
      title: 'API Key Removed',
      description: 'TwelveData API key has been cleared. System switched to mock data mode.',
    });

    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await marketDataService.testConnection();
    setTestResult(result);
    setTesting(false);
    setTimeout(() => setTestResult(null), 6000);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setInputKey('');
    setShowKey(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setInputKey('');
    setShowKey(false);
  };

  return (
    <SettingsSection
      icon={<KeyRound className="h-5 w-5" />}
      title="TwelveData API Configuration"
      description="Manage your live market data API key — persisted across sessions"
      accent="gold"
    >
      {/* Current key status */}
      {hasKey && !isEditing && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-ink-800/40 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-gold-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Current API Key</p>
                <p className="font-mono text-sm text-slate-200">{storageState.masked}</p>
              </div>
            </div>
            <Badge variant={source === 'local' ? 'success' : 'warning'} dot>
              {source === 'local' ? 'Saved Locally' : 'From .env'}
            </Badge>
          </div>
          {storageState.savedAt && (
            <p className="text-[10px] text-slate-600">
              Saved: {new Date(storageState.savedAt).toLocaleString('en-GB')}
            </p>
          )}
        </div>
      )}

      {/* Input form */}
      {(isEditing || !hasKey) && (
        <div className="mb-4 space-y-3">
          <Field
            label={hasKey ? 'New API Key' : 'TwelveData API Key'}
            hint="Get your free API key at twelvedata.com — 800 requests/min on free tier"
          >
            <div className="relative">
              <TextInput
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter your TwelveData API key..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving || inputKey.trim().length < 8}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:from-brand-400 hover:to-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {hasKey ? 'Update Key' : 'Save Key'}
            </button>
            {hasKey && (
              <button
                onClick={handleCancelEdit}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action buttons when key exists */}
      {hasKey && !isEditing && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change API Key
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Test Connection
          </button>
          {source === 'local' && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-lg border border-bear-500/20 bg-bear-500/5 px-3.5 py-2 text-xs font-medium text-bear-400 transition-colors hover:bg-bear-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Saved Key
            </button>
          )}
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${testResult.success ? 'border-bull-500/20 bg-bull-500/[0.04] text-bull-300' : 'border-bear-500/20 bg-bear-500/[0.04] text-bear-300'}`}>
          {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${feedback.type === 'success' ? 'border-bull-500/20 bg-bull-500/[0.04] text-bull-300' : 'border-bear-500/20 bg-bear-500/[0.04] text-bear-300'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Info note */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-500/15 bg-brand-500/[0.04] px-4 py-2.5">
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
        <p className="text-[11px] text-slate-400">
          Your API key is stored locally in your browser and never sent to any server except TwelveData.
          It persists across refreshes, restarts, and sessions. The key is always masked after saving.
        </p>
      </div>
    </SettingsSection>
  );
}
