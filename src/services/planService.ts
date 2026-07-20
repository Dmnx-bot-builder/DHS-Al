// PlanService - Singleton that manages the TwelveData plan configuration.
// Stores the user's plan (FREE, BASIC, GROW, PRO) and provides
// the corresponding polling interval.
// Changing plans automatically adjusts polling without code changes.
//
// SINGLETON INVARIANT: This module exports exactly one `planService` instance.

import type { TwelveDataPlan } from '../types';

type PlanListener = (plan: TwelveDataPlan, intervalMs: number) => void;

const STORAGE_KEY = 'dhs-ai-twelvedata-plan';

const PLAN_INTERVALS: Record<TwelveDataPlan, number> = {
  FREE: 60_000,
  BASIC: 15_000,
  GROW: 10_000,
  PRO: 5_000,
};

const PLAN_LABELS: Record<TwelveDataPlan, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  GROW: 'Grow',
  PRO: 'Pro',
};

const PLAN_REQUEST_LIMITS: Record<TwelveDataPlan, number> = {
  FREE: 800,
  BASIC: 800,
  GROW: 800,
  PRO: 800,
};

function loadFromStorage(): TwelveDataPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (raw === 'FREE' || raw === 'BASIC' || raw === 'GROW' || raw === 'PRO')) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'FREE';
}

function saveToStorage(plan: TwelveDataPlan): void {
  try {
    localStorage.setItem(STORAGE_KEY, plan);
  } catch {
    // ignore
  }
}

class PlanService {
  private plan: TwelveDataPlan;
  private listeners = new Set<PlanListener>();

  constructor() {
    this.plan = loadFromStorage();
  }

  getPlan(): TwelveDataPlan {
    return this.plan;
  }

  getPlanLabel(): string {
    return PLAN_LABELS[this.plan];
  }

  getPollingInterval(): number {
    return PLAN_INTERVALS[this.plan];
  }

  getRequestLimit(): number {
    return PLAN_REQUEST_LIMITS[this.plan];
  }

  setPlan(plan: TwelveDataPlan): void {
    if (this.plan === plan) return;
    this.plan = plan;
    saveToStorage(plan);
    console.info(`[Plan] Plan changed to ${plan} - polling interval: ${PLAN_INTERVALS[plan] / 1000}s`);
    this.notify();
  }

  subscribe(listener: PlanListener): () => void {
    this.listeners.add(listener);
    listener(this.plan, this.getPollingInterval());
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.plan, this.getPollingInterval()));
  }
}

// SINGLETON EXPORT
export const planService = new PlanService();
