// ApiKeyStorageService — persists TwelveData API key in localStorage
// with safe validation, masking, and subscription pattern.
// Matches the notificationService singleton architecture.

type Listener = (state: ApiKeyStorageState) => void;

const STORAGE_KEY = 'dhs-ai-twelvedata-api-key';
const ENV_KEY = 'VITE_TWELVEDATA_API_KEY';

export interface ApiKeyStorageState {
  hasKey: boolean;
  source: 'local' | 'env' | 'none';
  masked: string | null;
  savedAt: number | null;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

function isValidKey(key: string): boolean {
  return typeof key === 'string' && key.trim().length >= 8;
}

function loadFromStorage(): { key: string; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key: unknown; savedAt: unknown };
    if (
      parsed &&
      typeof parsed.key === 'string' &&
      typeof parsed.savedAt === 'number' &&
      isValidKey(parsed.key)
    ) {
      return { key: parsed.key, savedAt: parsed.savedAt };
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(key: string): number {
  const savedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, savedAt }));
  } catch {
    // Storage full or unavailable — silently drop
  }
  return savedAt;
}

function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getEnvKey(): string | null {
  const env = import.meta.env[ENV_KEY];
  if (typeof env === 'string' && env.trim().length > 0) return env.trim();
  return null;
}

class ApiKeyStorageService {
  private listeners = new Set<Listener>();

  /**
   * Returns the active API key — prioritizing user-saved key over env.
   * Returns null if no key is available.
   */
  getApiKey(): string | null {
    const stored = loadFromStorage();
    if (stored) return stored.key;
    return getEnvKey();
  }

  /**
   * Returns the source of the active key.
   */
  getSource(): 'local' | 'env' | 'none' {
    if (loadFromStorage()) return 'local';
    if (getEnvKey()) return 'env';
    return 'none';
  }

  hasApiKey(): boolean {
    return this.getApiKey() !== null;
  }

  /**
   * Returns a masked representation of the active key for UI display.
   */
  getMaskedKey(): string | null {
    const key = this.getApiKey();
    if (!key) return null;
    return maskKey(key);
  }

  getState(): ApiKeyStorageState {
    const stored = loadFromStorage();
    if (stored) {
      return {
        hasKey: true,
        source: 'local',
        masked: maskKey(stored.key),
        savedAt: stored.savedAt,
      };
    }
    const env = getEnvKey();
    if (env) {
      return {
        hasKey: true,
        source: 'env',
        masked: maskKey(env),
        savedAt: null,
      };
    }
    return { hasKey: false, source: 'none', masked: null, savedAt: null };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  saveApiKey(key: string): boolean {
    const trimmed = key.trim();
    if (!isValidKey(trimmed)) return false;
    saveToStorage(trimmed);
    this.notify();
    return true;
  }

  clearApiKey(): void {
    clearStorage();
    this.notify();
  }
}

export const apiKeyStorageService = new ApiKeyStorageService();
