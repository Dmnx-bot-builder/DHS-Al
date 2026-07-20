// Notification visual config — icons, colors, and labels per category/subtype

import {
  TrendingUp, TrendingDown, Ban, Trophy, ShieldAlert, XCircle, CircleSlash,
  AlertTriangle, Newspaper, Sunrise, Sunset, Activity, Droplets,
  Layers, Repeat, Wifi, WifiOff, KeyRound, Link2, Link2Off, Settings, RefreshCw,
  Save, KeyRound as KeyEdit, Trash2, RefreshCcw, ArrowUpRight,
  Gauge, Target, ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationCategory, NotificationSubtype } from '../../types/notification';

export interface CategoryConfig {
  label: string;
  badge: 'brand' | 'success' | 'danger' | 'warning' | 'gold' | 'neutral';
  accent: string;
}

export const categoryConfig: Record<NotificationCategory, CategoryConfig> = {
  TRADE_SIGNAL: { label: 'Trade Signals', badge: 'brand', accent: 'text-brand-400' },
  TRADE_UPDATE: { label: 'Trade Updates', badge: 'success', accent: 'text-bull-400' },
  MARKET_ALERT: { label: 'Market Alerts', badge: 'warning', accent: 'text-gold-400' },
  SYSTEM: { label: 'System', badge: 'neutral', accent: 'text-slate-400' },
};

interface SubtypeConfig {
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
}

export const subtypeConfig: Record<NotificationSubtype, SubtypeConfig> = {
  BUY_SIGNAL: { icon: TrendingUp, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  SELL_SIGNAL: { icon: TrendingDown, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  NO_TRADE_SIGNAL: { icon: Ban, iconClass: 'text-slate-400', bgClass: 'bg-white/5' },
  TAKE_PROFIT: { icon: Trophy, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  STOP_LOSS: { icon: ShieldAlert, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  TRADE_INVALIDATED: { icon: XCircle, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  TRADE_CLOSED: { icon: CircleSlash, iconClass: 'text-slate-400', bgClass: 'bg-white/5' },
  RISK_WARNING: { icon: AlertTriangle, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  HIGH_IMPACT_NEWS: { icon: Newspaper, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  MARKET_OPEN: { icon: Sunrise, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  MARKET_CLOSE: { icon: Sunset, iconClass: 'text-slate-400', bgClass: 'bg-white/5' },
  HIGH_VOLATILITY: { icon: Activity, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  LIQUIDITY_SWEEP: { icon: Droplets, iconClass: 'text-brand-300', bgClass: 'bg-brand-500/10' },
  NEW_BOS: { icon: Layers, iconClass: 'text-brand-400', bgClass: 'bg-brand-500/10' },
  NEW_CHOCH: { icon: Repeat, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  DEMAND_ZONE_CONFIRMED: { icon: Target, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  SUPPLY_ZONE_CONFIRMED: { icon: ShieldCheck, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  TREND_SHIFT: { icon: Activity, iconClass: 'text-brand-300', bgClass: 'bg-brand-500/10' },
  HIGH_CONFIDENCE: { icon: Gauge, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  LIVE_CONNECTED: { icon: Wifi, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  LIVE_DISCONNECTED: { icon: WifiOff, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  API_KEY_MISSING: { icon: KeyRound, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  BROKER_CONNECTED: { icon: Link2, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  BROKER_DISCONNECTED: { icon: Link2Off, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  SETTINGS_UPDATED: { icon: Settings, iconClass: 'text-brand-300', bgClass: 'bg-brand-500/10' },
  VERSION_UPDATED: { icon: RefreshCw, iconClass: 'text-brand-300', bgClass: 'bg-brand-500/10' },
  API_KEY_SAVED: { icon: Save, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  API_KEY_UPDATED: { icon: KeyEdit, iconClass: 'text-brand-300', bgClass: 'bg-brand-500/10' },
  API_KEY_REMOVED: { icon: Trash2, iconClass: 'text-bear-400', bgClass: 'bg-bear-500/10' },
  API_KEY_INVALID: { icon: AlertTriangle, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  AUTO_RECONNECT_SUCCESS: { icon: RefreshCcw, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
  SWITCHED_TO_MOCK: { icon: WifiOff, iconClass: 'text-gold-400', bgClass: 'bg-gold-500/10' },
  RETURNED_TO_LIVE: { icon: ArrowUpRight, iconClass: 'text-bull-400', bgClass: 'bg-bull-500/10' },
};
