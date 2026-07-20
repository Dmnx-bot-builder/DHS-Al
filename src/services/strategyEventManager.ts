// StrategyEventManager — observes StrategyAnalysis changes and emits
// real event-driven notifications through NotificationService.
// Does NOT modify the decision engine or strategy logic — purely an observer.
//
// Integrates:
//   - SignalValidationService: validates signals before they become official
//   - SignalLifecycleManager: tracks formal lifecycle stages per signal
//   - SignalQualityCalculator: computes 0-100 quality score independently
//   - SignalAnalyticsService: records aggregate metrics for dashboards
//
// Detects: BUY/SELL signal changes, confidence threshold crossings, BOS/CHOCH/SWEEP,
// demand/supply zone confirmations, trend shifts, market condition changes,
// trade invalidations, and high volatility.
// Implements per-event-type cooldowns to prevent notification spam.

import type { StrategyAnalysis, SmartMoneyConcept, AiDecision, TrendDirection, MarketCondition } from '../data/strategy';
import type { NotificationSubtype, DeepLinkTarget } from '../types/notification';
import { notificationService } from './notificationService';
import { signalIdService } from './signalIdService';
import { tradeReportStore } from './tradeReportStore';
import { generateTradeReport } from './tradeReportGenerator';
import { signalValidationService } from './signalValidationService';
import { signalLifecycleManager } from './signalLifecycleManager';
import { signalAnalyticsService } from './signalAnalyticsService';
import { calculateQualityScore } from './signalQualityCalculator';
import { getSubtypePriority } from '../components/notifications/priorityConfig';
import type { NotificationPriority } from '../types/signalLifecycle';

type Listener = (state: StrategyEventState) => void;

export interface StrategyEventState {
  lastAnalysis: StrategyAnalysis | null;
  lastSignalId: string | null;
  lastReportId: string | null;
  lastBuyAt: number | null;
  lastSellAt: number | null;
  lastStrategyUpdate: number | null;
  lastNotificationAt: number | null;
  lastNotificationSubtype: NotificationSubtype | null;
  lastDecision: AiDecision | null;
  lastConfidence: number | null;
  lastTrend: TrendDirection | null;
  lastMarketCondition: MarketCondition | null;
  knownSmcIds: Set<string>;
  highConfidenceNotified: boolean;
  lowConfidenceNotified: boolean;
  lastQualityScore: number | null;
  lastQualityLevel: string | null;
  signalConfirmed: boolean;
  reportGenerated: boolean;
}

const COOLDOWNS_MS: Record<string, number> = {
  BUY_SIGNAL: 60_000,
  SELL_SIGNAL: 60_000,
  NO_TRADE_SIGNAL: 60_000,
  LIQUIDITY_SWEEP: 90_000,
  NEW_BOS: 90_000,
  NEW_CHOCH: 90_000,
  DEMAND_ZONE_CONFIRMED: 90_000,
  SUPPLY_ZONE_CONFIRMED: 90_000,
  TREND_SHIFT: 120_000,
  HIGH_VOLATILITY: 180_000,
  HIGH_CONFIDENCE: 120_000,
  RISK_WARNING: 180_000,
  TRADE_INVALIDATED: 0,
  TAKE_PROFIT: 0,
  STOP_LOSS: 0,
};

const HIGH_CONFIDENCE_THRESHOLD = 90;
const LOW_CONFIDENCE_THRESHOLD = 60;

// Confidence drop threshold for intelligent notification filtering
const SIGNIFICANT_CONFIDENCE_DROP = 20;

class StrategyEventManager {
  private listeners = new Set<Listener>();
  private state: StrategyEventState = {
    lastAnalysis: null,
    lastSignalId: null,
    lastReportId: null,
    lastBuyAt: null,
    lastSellAt: null,
    lastStrategyUpdate: null,
    lastNotificationAt: null,
    lastNotificationSubtype: null,
    lastDecision: null,
    lastConfidence: null,
    lastTrend: null,
    lastMarketCondition: null,
    knownSmcIds: new Set(),
    highConfidenceNotified: false,
    lowConfidenceNotified: false,
    lastQualityScore: null,
    lastQualityLevel: null,
    signalConfirmed: false,
    reportGenerated: false,
  };
  private lastEmitTimes: Map<string, number> = new Map();

  getState(): StrategyEventState {
    return { ...this.state, knownSmcIds: new Set(this.state.knownSmcIds) };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }

  private isOnCooldown(subtype: string): boolean {
    const cooldown = COOLDOWNS_MS[subtype] ?? 0;
    if (cooldown === 0) return false;
    const lastTime = this.lastEmitTimes.get(subtype);
    if (!lastTime) return false;
    return Date.now() - lastTime < cooldown;
  }

  private recordEmit(subtype: string) {
    this.lastEmitTimes.set(subtype, Date.now());
  }

  private emit(
    subtype: NotificationSubtype,
    category: 'TRADE_SIGNAL' | 'TRADE_UPDATE' | 'MARKET_ALERT' | 'SYSTEM',
    title: string,
    description: string,
    meta: Record<string, string | number | boolean>,
    deepLink?: DeepLinkTarget,
    signalId?: string,
    reportId?: string,
  ) {
    if (this.isOnCooldown(subtype)) return;
    this.recordEmit(subtype);

    const priority: NotificationPriority = getSubtypePriority(subtype);

    notificationService.add({
      category,
      subtype,
      title,
      description,
      meta,
      deepLink,
      signalId,
      reportId,
      priority,
    });

    signalAnalyticsService.recordNotificationSent();

    this.state.lastNotificationAt = Date.now();
    this.state.lastNotificationSubtype = subtype;
  }

  /**
   * Processes a new StrategyAnalysis and emits notifications for any meaningful changes.
   * This is the main entry point — call this whenever a new analysis is generated.
   */
  processAnalysis(analysis: StrategyAnalysis): void {
    const prev = this.state.lastAnalysis;
    const isFirstRun = prev === null;

    // Compute quality score independently of decision engine
    const qualityBreakdown = calculateQualityScore(analysis);
    this.state.lastQualityScore = qualityBreakdown.total;
    this.state.lastQualityLevel = qualityBreakdown.level;

    // Ensure signal ID exists for this analysis
    const signalEntry = signalIdService.ensureSignalId(
      analysis.decision,
      analysis.symbol,
      analysis.confidence,
    );
    const signalId = signalEntry.signalId;

    this.state.lastSignalId = signalId;
    this.state.lastStrategyUpdate = Date.now();

    if (isFirstRun) {
      this.handleFirstRun(analysis, signalId, qualityBreakdown.total, qualityBreakdown.level);
    } else {
      this.handleChanges(prev!, analysis, signalId, qualityBreakdown.total, qualityBreakdown.level);
    }

    // Update state
    this.state.lastAnalysis = analysis;
    this.state.lastDecision = analysis.decision;
    this.state.lastConfidence = analysis.confidence;
    this.state.lastTrend = analysis.trend.direction;
    this.state.lastMarketCondition = analysis.marketCondition;

    // Track known SMC IDs
    analysis.smartMoneyConcepts.forEach((smc) => {
      this.state.knownSmcIds.add(smc.id);
    });

    this.notify();
  }

  private handleFirstRun(
    analysis: StrategyAnalysis,
    signalId: string,
    qualityScore: number,
    qualityLevel: string,
  ): void {
    // Record signal generation in analytics
    signalAnalyticsService.recordSignalGenerated();

    // Create lifecycle record in DETECTED stage
    signalLifecycleManager.create({
      signalId,
      decision: analysis.decision,
      symbol: analysis.symbol,
      qualityScore,
      qualityLevel: qualityLevel as 'ELITE_SETUP' | 'PREMIUM_SETUP' | 'HIGH_QUALITY' | 'TRADABLE' | 'IGNORE',
      confidence: analysis.confidence,
      trend: analysis.trend.direction,
      marketCondition: analysis.marketCondition,
      entryPrice: analysis.entryPrice,
    });

    // Begin validation cycle
    signalValidationService.beginValidation(analysis, signalId);
    signalLifecycleManager.transition('VALIDATING');

    // Attempt validation immediately (will likely fail on first cycle due to candle close check)
    this.attemptValidation(analysis, signalId);

    // Emit notifications for existing confirmed SMC concepts (informational)
    analysis.smartMoneyConcepts.forEach((smc) => {
      this.emitSmcNotification(smc, analysis, signalId);
    });

    // Check market condition
    if (analysis.marketCondition === 'VOLATILE') {
      this.emitHighVolatility(analysis, signalId);
    }
  }

  private handleChanges(
    prev: StrategyAnalysis,
    curr: StrategyAnalysis,
    signalId: string,
    qualityScore: number,
    qualityLevel: string,
  ): void {
    const prevDecision = prev.decision;
    const currDecision = curr.decision;
    const currConfidence = curr.confidence;

    // 1. Decision changes
    if (prevDecision !== currDecision) {
      // Direction changed — archive old signal, create new one
      if (prevDecision === 'BUY' || prevDecision === 'SELL') {
        signalLifecycleManager.close('INVALIDATED');
        signalAnalyticsService.recordSignalInvalidated();
        signalValidationService.clearPending();
        this.state.signalConfirmed = false;
        this.state.reportGenerated = false;
      }

      // Record new signal generation
      signalAnalyticsService.recordSignalGenerated();

      // Create new lifecycle record
      signalLifecycleManager.create({
        signalId,
        decision: currDecision,
        symbol: curr.symbol,
        qualityScore,
        qualityLevel: qualityLevel as 'ELITE_SETUP' | 'PREMIUM_SETUP' | 'HIGH_QUALITY' | 'TRADABLE' | 'IGNORE',
        confidence: currConfidence,
        trend: curr.trend.direction,
        marketCondition: curr.marketCondition,
        entryPrice: curr.entryPrice,
      });

      // Begin validation for new signal
      signalValidationService.beginValidation(curr, signalId);
      signalLifecycleManager.transition('VALIDATING');

      // Attempt validation
      this.attemptValidation(curr, signalId);

      // If previous was BUY/SELL and now NO_TRADE, emit trade invalidated
      if ((prevDecision === 'BUY' || prevDecision === 'SELL') && currDecision === 'NO_TRADE') {
        signalIdService.invalidateActive();
        this.emit(
          'TRADE_INVALIDATED',
          'TRADE_UPDATE',
          'Trade Invalidated',
          'Market structure changed. Previous setup is no longer valid.',
          {
            asset: curr.symbol,
            price: curr.entryPrice,
            previousDecision: prevDecision,
            currentDecision: currDecision,
            confidence: currConfidence,
            timestamp: Date.now(),
          },
          { page: 'strategy' },
          signalId,
        );
      }
    } else {
      // Same decision — update lifecycle metrics
      signalLifecycleManager.updateMetrics(
        qualityScore,
        qualityLevel as 'ELITE_SETUP' | 'PREMIUM_SETUP' | 'HIGH_QUALITY' | 'TRADABLE' | 'IGNORE',
        currConfidence,
      );

      // Continue validation if not yet confirmed
      if (!this.state.signalConfirmed) {
        signalValidationService.beginValidation(curr, signalId);
        this.attemptValidation(curr, signalId);
      } else {
        // Already confirmed — update monitoring
        signalLifecycleManager.transition('MONITORING');

        // Intelligent notification filtering: only notify on significant changes
        this.checkSignificantChanges(prev, curr, signalId);
      }
    }

    // 2. New SMC concepts detected
    const prevSmcIds = new Set(prev.smartMoneyConcepts.map((s) => s.id));
    curr.smartMoneyConcepts.forEach((smc) => {
      if (!prevSmcIds.has(smc.id)) {
        this.emitSmcNotification(smc, curr, signalId);
      } else {
        // Check if status changed to CONFIRMED
        const prevSmc = prev.smartMoneyConcepts.find((s) => s.id === smc.id);
        if (prevSmc && prevSmc.status !== 'CONFIRMED' && smc.status === 'CONFIRMED') {
          this.emitSmcNotification(smc, curr, signalId);
        }
      }
    });

    // 3. Trend shift
    if (prev.trend.direction !== curr.trend.direction) {
      this.emitTrendShift(curr, signalId);
    }

    // 4. Market condition change (ranging -> trending or -> volatile)
    if (prev.marketCondition !== curr.marketCondition) {
      if (curr.marketCondition === 'VOLATILE') {
        this.emitHighVolatility(curr, signalId);
      }
      if (prev.marketCondition === 'RANGING' && curr.marketCondition === 'TRENDING') {
        this.emitTrendShift(curr, signalId);
      }
    }

    // 5. Track BUY/SELL times
    if (currDecision === 'BUY' && prevDecision !== 'BUY') {
      this.state.lastBuyAt = Date.now();
    }
    if (currDecision === 'SELL' && prevDecision !== 'SELL') {
      this.state.lastSellAt = Date.now();
    }
  }

  /**
   * Attempts validation of the pending signal. If validation passes,
   * transitions lifecycle to CONFIRMED -> ACTIVE -> MONITORING,
   * generates ONE trade report, and emits the BUY/SELL notification.
   */
  private attemptValidation(analysis: StrategyAnalysis, signalId: string): void {
    if (this.state.signalConfirmed) return;

    const result = signalValidationService.validate(analysis);

    if (result.confirmed) {
      // Signal is now confirmed
      this.state.signalConfirmed = true;
      const confirmationTimeMs = Date.now() - (signalLifecycleManager.getActive()?.createdAt ?? Date.now());

      signalLifecycleManager.transition('CONFIRMED');
      signalAnalyticsService.recordSignalConfirmed(confirmationTimeMs);

      // Transition to ACTIVE
      signalLifecycleManager.transition('ACTIVE');

      // Transition to MONITORING
      signalLifecycleManager.transition('MONITORING');

      // Generate ONE trade report only when signal becomes confirmed
      let reportId: string | null = null;
      if (!this.state.reportGenerated && (analysis.decision === 'BUY' || analysis.decision === 'SELL')) {
        reportId = this.generateAndStoreReport(analysis, signalId);
        this.state.reportGenerated = true;
        signalLifecycleManager.setReportId(reportId);
      }

      // Emit the BUY/SELL notification (only after validation confirms)
      this.emitSignalNotification(analysis, signalId, reportId);

      // Check confidence thresholds
      this.checkConfidenceThresholds(analysis, signalId, reportId);
    }
  }

  /**
   * Intelligent notification filtering — only notifies on meaningful changes
   * after the signal is confirmed. Does NOT notify on small confidence drift.
   */
  private checkSignificantChanges(
    prev: StrategyAnalysis,
    curr: StrategyAnalysis,
    signalId: string,
  ): void {
    const confDrop = (prev.confidence ?? 0) - curr.confidence;

    // Significant confidence drop (e.g., 92% -> 65%)
    if (confDrop >= SIGNIFICANT_CONFIDENCE_DROP) {
      this.emit(
        'RISK_WARNING',
        'TRADE_UPDATE',
        'Significant Confidence Drop',
        `Confidence dropped ${confDrop}% to ${curr.confidence}%. Structure may be weakening.`,
        {
          asset: curr.symbol,
          price: curr.entryPrice,
          direction: curr.decision,
          previousConfidence: prev.confidence,
          currentConfidence: curr.confidence,
          drop: confDrop,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy' },
        signalId,
      );
    }

    // BOS -> CHOCH (structure break reversal)
    const prevBos = prev.smartMoneyConcepts.find((c) => c.type === 'BOS' && c.status !== 'MITIGATED');
    const currChoch = curr.smartMoneyConcepts.find((c) => c.type === 'CHOCH');
    const prevChoch = prev.smartMoneyConcepts.find((c) => c.type === 'CHOCH');
    if (prevBos && currChoch && !prevChoch) {
      // BOS was replaced by CHOCH — emit trend shift
      this.emitTrendShift(curr, signalId);
    }

    // Demand zone invalidated (was active, now gone or mitigated)
    const prevDemand = prev.smartMoneyConcepts.find(
      (c) => c.type === 'DEMAND' && (c.status === 'ACTIVE' || c.status === 'CONFIRMED'),
    );
    const currDemand = curr.smartMoneyConcepts.find(
      (c) => c.type === 'DEMAND' && (c.status === 'ACTIVE' || c.status === 'CONFIRMED'),
    );
    if (prevDemand && !currDemand) {
      this.emit(
        'TRADE_INVALIDATED',
        'TRADE_UPDATE',
        'Demand Zone Invalidated',
        `Demand zone at ${prevDemand.price.toFixed(2)} is no longer valid. Setup may be compromised.`,
        {
          asset: curr.symbol,
          price: curr.entryPrice,
          direction: curr.decision,
          confidence: curr.confidence,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy' },
        signalId,
      );
    }

    // New liquidity sweep appeared
    const prevSweep = prev.smartMoneyConcepts.find((c) => c.type === 'SWEEP');
    const currSweep = curr.smartMoneyConcepts.find((c) => c.type === 'SWEEP');
    if (!prevSweep && currSweep) {
      this.emitSmcNotification(currSweep, curr, signalId);
    }
  }

  private emitSignalNotification(analysis: StrategyAnalysis, signalId: string, reportId: string | null): void {
    const isBuy = analysis.decision === 'BUY';
    const isSell = analysis.decision === 'SELL';
    const isNoTrade = analysis.decision === 'NO_TRADE';

    if (isBuy) {
      this.state.lastBuyAt = Date.now();
      this.emit(
        'BUY_SIGNAL',
        'TRADE_SIGNAL',
        'Strong BUY Signal',
        `DHS AI detected a high-probability BUY setup on ${analysis.symbol}.`,
        {
          asset: analysis.symbol,
          price: analysis.entryPrice,
          direction: 'BUY',
          confidence: analysis.confidence,
          trend: analysis.trend.direction,
          timeframe: analysis.timeframe,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy', reportId: reportId ?? '' },
        signalId,
        reportId ?? undefined,
      );
    } else if (isSell) {
      this.state.lastSellAt = Date.now();
      this.emit(
        'SELL_SIGNAL',
        'TRADE_SIGNAL',
        'Strong SELL Signal',
        `DHS AI detected a high-probability SELL setup on ${analysis.symbol}.`,
        {
          asset: analysis.symbol,
          price: analysis.entryPrice,
          direction: 'SELL',
          confidence: analysis.confidence,
          trend: analysis.trend.direction,
          timeframe: analysis.timeframe,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy', reportId: reportId ?? '' },
        signalId,
        reportId ?? undefined,
      );
    } else if (isNoTrade) {
      this.emit(
        'NO_TRADE_SIGNAL',
        'TRADE_SIGNAL',
        'No Trade Signal',
        `DHS AI recommends no trade on ${analysis.symbol}. Market conditions are not favorable.`,
        {
          asset: analysis.symbol,
          price: analysis.entryPrice,
          direction: 'NO_TRADE',
          confidence: analysis.confidence,
          trend: analysis.trend.direction,
          timeframe: analysis.timeframe,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy' },
        signalId,
      );
    }
  }

  private emitSmcNotification(smc: SmartMoneyConcept, analysis: StrategyAnalysis, signalId: string): void {
    const meta = {
      asset: analysis.symbol,
      price: smc.price,
      direction: analysis.decision,
      confidence: analysis.confidence,
      trend: analysis.trend.direction,
      timeframe: analysis.timeframe,
      timestamp: Date.now(),
      signalId,
      smcType: smc.type,
      bullish: smc.bullish,
      status: smc.status,
    };

    switch (smc.type) {
      case 'BOS':
        this.emit(
          'NEW_BOS',
          'MARKET_ALERT',
          'Break of Structure Confirmed',
          `${smc.bullish ? 'Bullish' : 'Bearish'} BOS detected at ${smc.price.toFixed(2)} on ${analysis.timeframe}. ${smc.description}`,
          meta,
          { page: 'strategy', section: 'smc' },
          signalId,
        );
        break;
      case 'CHOCH':
        this.emit(
          'NEW_CHOCH',
          'MARKET_ALERT',
          'Change of Character Detected',
          `${smc.bullish ? 'Bullish' : 'Bearish'} CHOCH at ${smc.price.toFixed(2)} on ${analysis.timeframe}. ${smc.description}`,
          meta,
          { page: 'strategy', section: 'smc' },
          signalId,
        );
        break;
      case 'SWEEP':
        this.emit(
          'LIQUIDITY_SWEEP',
          'MARKET_ALERT',
          'Liquidity Sweep Detected',
          `${smc.bullish ? 'Bullish' : 'Bearish'} liquidity sweep at ${smc.price.toFixed(2)} on ${analysis.timeframe}. ${smc.description}`,
          meta,
          { page: 'strategy', section: 'smc' },
          signalId,
        );
        break;
      case 'DEMAND':
        if (smc.status === 'CONFIRMED' || smc.status === 'ACTIVE') {
          this.emit(
            'DEMAND_ZONE_CONFIRMED',
            'MARKET_ALERT',
            'Demand Zone Confirmed',
            `Demand zone confirmed at ${smc.price.toFixed(2)} on ${analysis.timeframe}. ${smc.description}`,
            meta,
            { page: 'strategy', section: 'smc' },
            signalId,
          );
        }
        break;
      case 'SUPPLY':
        if (smc.status === 'CONFIRMED' || smc.status === 'ACTIVE') {
          this.emit(
            'SUPPLY_ZONE_CONFIRMED',
            'MARKET_ALERT',
            'Supply Zone Confirmed',
            `Supply zone confirmed at ${smc.price.toFixed(2)} on ${analysis.timeframe}. ${smc.description}`,
            meta,
            { page: 'strategy', section: 'smc' },
            signalId,
          );
        }
        break;
    }
  }

  private checkConfidenceThresholds(analysis: StrategyAnalysis, signalId: string, reportId: string | null): void {
    const conf = analysis.confidence;

    // High confidence crossing above 90%
    if (conf >= HIGH_CONFIDENCE_THRESHOLD && !this.state.highConfidenceNotified) {
      this.state.highConfidenceNotified = true;
      this.state.lowConfidenceNotified = false;
      this.emit(
        'HIGH_CONFIDENCE',
        'TRADE_SIGNAL',
        'High Confidence Setup',
        `Confidence increased above ${HIGH_CONFIDENCE_THRESHOLD}%. Current: ${conf}%.`,
        {
          asset: analysis.symbol,
          price: analysis.entryPrice,
          direction: analysis.decision,
          confidence: conf,
          trend: analysis.trend.direction,
          timeframe: analysis.timeframe,
          timestamp: Date.now(),
          signalId,
        },
        { page: 'strategy', reportId: reportId ?? '' },
        signalId,
        reportId ?? undefined,
      );
    }

    // Confidence dropping below 60%
    if (conf < LOW_CONFIDENCE_THRESHOLD && !this.state.lowConfidenceNotified) {
      this.state.lowConfidenceNotified = true;
      this.state.highConfidenceNotified = false;
    }

    // Reset flags when confidence is in the middle range
    if (conf >= LOW_CONFIDENCE_THRESHOLD && conf < HIGH_CONFIDENCE_THRESHOLD) {
      this.state.highConfidenceNotified = false;
      this.state.lowConfidenceNotified = false;
    }
  }

  private emitTrendShift(analysis: StrategyAnalysis, signalId: string): void {
    this.emit(
      'TREND_SHIFT',
      'MARKET_ALERT',
      'Trend Shift Detected',
      `Market trend changed to ${analysis.trend.direction} on ${analysis.timeframe}. Strength: ${analysis.trend.strength}%.`,
      {
        asset: analysis.symbol,
        price: analysis.entryPrice,
        direction: analysis.decision,
        confidence: analysis.confidence,
        trend: analysis.trend.direction,
        timeframe: analysis.timeframe,
        timestamp: Date.now(),
        signalId,
      },
      { page: 'strategy' },
      signalId,
    );
  }

  private emitHighVolatility(analysis: StrategyAnalysis, signalId: string): void {
    this.emit(
      'HIGH_VOLATILITY',
      'MARKET_ALERT',
      'High Volatility Detected',
      `Market condition is volatile on ${analysis.symbol} ${analysis.timeframe}. ATR: ${analysis.indicators.atr.toFixed(2)}.`,
      {
        asset: analysis.symbol,
        price: analysis.entryPrice,
        direction: analysis.decision,
        confidence: analysis.confidence,
        trend: analysis.trend.direction,
        timeframe: analysis.timeframe,
        timestamp: Date.now(),
        signalId,
        atr: analysis.indicators.atr,
      },
      { page: 'strategy' },
      signalId,
    );
  }

  private generateAndStoreReport(analysis: StrategyAnalysis, signalId: string): string {
    const report = generateTradeReport(analysis);
    const reportWithSignal = { ...report, signalId };
    const reportId = tradeReportStore.store(reportWithSignal);
    this.state.lastReportId = reportId;
    return reportId;
  }

  /**
   * Records a notification as accurate (for analytics tracking).
   * Call this when a notification's prediction matches the actual outcome.
   */
  recordNotificationAccurate(): void {
    signalAnalyticsService.recordNotificationAccurate();
  }

  /**
   * Closes the active signal with a specific outcome (take profit or stop loss).
   * Transitions lifecycle through closure stage and archives.
   */
  closeSignal(reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'INVALIDATED' | 'EXPIRED' | 'MANUAL_CLOSE'): void {
    const active = signalLifecycleManager.getActive();
    if (!active) return;

    if (reason === 'TAKE_PROFIT') {
      signalAnalyticsService.recordTakeProfit();
    } else if (reason === 'STOP_LOSS') {
      signalAnalyticsService.recordStopLoss();
    } else if (reason === 'INVALIDATED') {
      signalAnalyticsService.recordSignalInvalidated();
    }

    const durationMs = active.closedAt && active.createdAt
      ? active.closedAt - active.createdAt
      : Date.now() - active.createdAt;
    signalAnalyticsService.recordSignalArchived(durationMs);

    signalLifecycleManager.close(reason);
    signalValidationService.clearPending();
    this.state.signalConfirmed = false;
    this.state.reportGenerated = false;

    if (reason === 'TAKE_PROFIT' || reason === 'STOP_LOSS') {
      const subtype: NotificationSubtype = reason === 'TAKE_PROFIT' ? 'TAKE_PROFIT' : 'STOP_LOSS';
      this.emit(
        subtype,
        'TRADE_UPDATE',
        reason === 'TAKE_PROFIT' ? 'Take Profit Hit' : 'Stop Loss Hit',
        reason === 'TAKE_PROFIT'
          ? `Trade closed in profit on ${active.symbol}.`
          : `Trade closed at stop loss on ${active.symbol}.`,
        {
          asset: active.symbol,
          signalId: active.signalId,
          outcome: reason,
          timestamp: Date.now(),
        },
        { page: 'strategy' },
        active.signalId,
        active.reportId ?? undefined,
      );
    }

    this.notify();
  }

  /**
   * Resets the event manager state (useful for testing or manual reset).
   */
  reset(): void {
    this.state = {
      lastAnalysis: null,
      lastSignalId: null,
      lastReportId: null,
      lastBuyAt: null,
      lastSellAt: null,
      lastStrategyUpdate: null,
      lastNotificationAt: null,
      lastNotificationSubtype: null,
      lastDecision: null,
      lastConfidence: null,
      lastTrend: null,
      lastMarketCondition: null,
      knownSmcIds: new Set(),
      highConfidenceNotified: false,
      lowConfidenceNotified: false,
      lastQualityScore: null,
      lastQualityLevel: null,
      signalConfirmed: false,
      reportGenerated: false,
    };
    this.lastEmitTimes.clear();
    signalValidationService.reset();
    signalLifecycleManager.reset();
    signalAnalyticsService.reset();
    this.notify();
  }
}

export const strategyEventManager = new StrategyEventManager();
