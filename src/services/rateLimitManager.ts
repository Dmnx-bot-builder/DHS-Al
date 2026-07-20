// RateLimitManager - Singleton that manages API rate limiting.
// Detects HTTP 429 responses and manages cooldown periods.
// When rate limited:
//   - Immediately stops polling
//   - Never spams retries
//   - Stores failure timestamp, retry count, estimated reset time
//   - Displays "API quota reached. Waiting for provider reset."
//   - Starts a countdown timer
//   - Automatically resumes polling when retry time arrives
//
// SINGLETON INVARIANT: This module exports exactly one `rateLimitManager` instance.

import type { RateLimitInfo, RateLimitState } from '../types';

type RateLimitListener = (info: RateLimitInfo) => void;

const DEFAULT_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 600_000;
const COOLDOWN_BACKOFF_MULTIPLIER = 2;

class RateLimitManager {
  private state: RateLimitState = 'OK';
  private failureTimestamp: number | null = null;
  private retryCount = 0;
  private resetTimestamp: number | null = null;
  private message: string | null = null;
  private listeners = new Set<RateLimitListener>();
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private resumeCallback: (() => void) | null = null;

  getInfo(): RateLimitInfo {
    return {
      state: this.state,
      failureTimestamp: this.failureTimestamp,
      retryCount: this.retryCount,
      resetTimestamp: this.resetTimestamp,
      countdownSeconds: this.getCountdownSeconds(),
      message: this.message,
    };
  }

  subscribe(listener: RateLimitListener): () => void {
    this.listeners.add(listener);
    listener(this.getInfo());
    return () => { this.listeners.delete(listener); };
  }

  /**
   * Sets a callback to be called when the cooldown expires and polling should resume.
   */
  onResume(callback: () => void): void {
    this.resumeCallback = callback;
  }

  /**
   * Called when an HTTP 429 or rate limit error is detected.
   * Immediately enters cooldown state and starts countdown.
   */
  triggerRateLimit(reason?: string): void {
    this.failureTimestamp = Date.now();
    this.retryCount++;
    const cooldownMs = Math.min(
      DEFAULT_COOLDOWN_MS * Math.pow(COOLDOWN_BACKOFF_MULTIPLIER, this.retryCount - 1),
      MAX_COOLDOWN_MS,
    );
    this.resetTimestamp = Date.now() + cooldownMs;
    this.state = 'COOLDOWN';
    this.message = reason ?? 'API quota reached. Waiting for provider reset.';
    console.warn(`[RateLimit] Rate limit triggered (attempt ${this.retryCount}). Cooldown: ${cooldownMs / 1000}s`);

    this.startCountdown();
    this.notify();
  }

  /**
   * Called when a request succeeds, resetting the rate limit state.
   */
  reset(): void {
    this.stopCountdown();
    this.state = 'OK';
    this.failureTimestamp = null;
    this.resetTimestamp = null;
    this.message = null;
    // Keep retryCount for diagnostics but reset after successful operations
    this.notify();
  }

  /**
   * Returns true if currently in cooldown (should not make API requests).
   */
  isLimited(): boolean {
    if (this.state === 'COOLDOWN' && this.resetTimestamp) {
      if (Date.now() >= this.resetTimestamp) {
        // Cooldown expired - transition to LIMITED (ready to retry)
        this.state = 'LIMITED';
        this.stopCountdown();
        this.notify();
        if (this.resumeCallback) {
          this.resumeCallback();
        }
        return false;
      }
      return true;
    }
    return false;
  }

  getCountdownSeconds(): number | null {
    if (this.state !== 'COOLDOWN' || !this.resetTimestamp) return null;
    const remaining = Math.ceil((this.resetTimestamp - Date.now()) / 1000);
    return Math.max(0, remaining);
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.countdownTimer = setInterval(() => {
      this.notify();
      if (this.resetTimestamp && Date.now() >= this.resetTimestamp) {
        this.state = 'LIMITED';
        this.stopCountdown();
        this.notify();
        console.info('[RateLimit] Cooldown expired - ready to resume polling');
        if (this.resumeCallback) {
          this.resumeCallback();
        }
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private notify(): void {
    const info = this.getInfo();
    this.listeners.forEach((l) => l(info));
  }
}

// SINGLETON EXPORT - this is the ONLY instance of RateLimitManager in the entire app.
export const rateLimitManager = new RateLimitManager();
