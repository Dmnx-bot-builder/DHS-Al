// Notification priority configuration — maps subtypes to priority levels

import type { NotificationSubtype } from '../../types/notification';
import type { NotificationPriority } from '../../types/signalLifecycle';

export const subtypePriority: Record<NotificationSubtype, NotificationPriority> = {
  BUY_SIGNAL: 'IMPORTANT',
  SELL_SIGNAL: 'IMPORTANT',
  NO_TRADE_SIGNAL: 'INFORMATIONAL',
  TAKE_PROFIT: 'CRITICAL',
  STOP_LOSS: 'CRITICAL',
  TRADE_INVALIDATED: 'CRITICAL',
  TRADE_CLOSED: 'IMPORTANT',
  RISK_WARNING: 'IMPORTANT',
  HIGH_IMPACT_NEWS: 'IMPORTANT',
  MARKET_OPEN: 'INFORMATIONAL',
  MARKET_CLOSE: 'INFORMATIONAL',
  HIGH_VOLATILITY: 'INFORMATIONAL',
  LIQUIDITY_SWEEP: 'INFORMATIONAL',
  NEW_BOS: 'INFORMATIONAL',
  NEW_CHOCH: 'INFORMATIONAL',
  DEMAND_ZONE_CONFIRMED: 'INFORMATIONAL',
  SUPPLY_ZONE_CONFIRMED: 'INFORMATIONAL',
  TREND_SHIFT: 'IMPORTANT',
  HIGH_CONFIDENCE: 'INFORMATIONAL',
  LIVE_CONNECTED: 'INFORMATIONAL',
  LIVE_DISCONNECTED: 'CRITICAL',
  API_KEY_MISSING: 'IMPORTANT',
  BROKER_CONNECTED: 'INFORMATIONAL',
  BROKER_DISCONNECTED: 'CRITICAL',
  SETTINGS_UPDATED: 'INFORMATIONAL',
  VERSION_UPDATED: 'INFORMATIONAL',
  API_KEY_SAVED: 'INFORMATIONAL',
  API_KEY_UPDATED: 'INFORMATIONAL',
  API_KEY_REMOVED: 'INFORMATIONAL',
  API_KEY_INVALID: 'CRITICAL',
  AUTO_RECONNECT_SUCCESS: 'INFORMATIONAL',
  SWITCHED_TO_MOCK: 'IMPORTANT',
  RETURNED_TO_LIVE: 'IMPORTANT',
};

export interface PriorityConfig {
  label: string;
  badge: 'danger' | 'gold' | 'neutral';
  accent: string;
  ring: string;
  dot: string;
  order: number;
}

export const priorityConfig: Record<NotificationPriority, PriorityConfig> = {
  CRITICAL: {
    label: 'Critical',
    badge: 'danger',
    accent: 'text-bear-400',
    ring: 'ring-bear-500/30',
    dot: 'bg-bear-500',
    order: 0,
  },
  IMPORTANT: {
    label: 'Important',
    badge: 'gold',
    accent: 'text-gold-400',
    ring: 'ring-gold-500/30',
    dot: 'bg-gold-500',
    order: 1,
  },
  INFORMATIONAL: {
    label: 'Info',
    badge: 'neutral',
    accent: 'text-slate-400',
    ring: 'ring-white/10',
    dot: 'bg-slate-500',
    order: 2,
  },
};

export const PRIORITY_ORDER: NotificationPriority[] = ['CRITICAL', 'IMPORTANT', 'INFORMATIONAL'];

export function getSubtypePriority(subtype: NotificationSubtype): NotificationPriority {
  return subtypePriority[subtype] ?? 'INFORMATIONAL';
}
