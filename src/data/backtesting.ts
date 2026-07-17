// Backtesting data layer for DHS AI terminal

export type BacktestSymbol = 'XAU/USD' | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'BTC/USD' | 'WTI/USD';
export type BacktestTimeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
export type BacktestStrategy =
  | 'SMC Scalp' | 'BOS Retest' | 'EMA Crossover' | 'Demand Zone'
  | 'Supply Zone' | 'CHOCH Reversal' | 'Liquidity Sweep' | 'Trend Follow'
  | 'News Fade' | 'Session Open';
export type BacktestResult = 'WIN' | 'LOSS' | 'BREAKEVEN';
export type BacktestStatus = 'IDLE' | 'RUNNING' | 'COMPLETED';

export interface BacktestConfig {
  symbol: BacktestSymbol;
  timeframe: BacktestTimeframe;
  strategy: BacktestStrategy;
  startDate: string;
  endDate: string;
  initialBalance: number;
  riskPerTrade: number;
}

export interface BacktestTrade {
  id: number;
  ticket: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnl: number;
  pips: number;
  rr: number;
  result: BacktestResult;
  confidence: number;
  duration: string;
  date: string;
  time: string;
  balanceAfter: number;
}

export interface BacktestStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  largestWin: number;
  largestLoss: number;
  avgDurationMin: number;
  totalDurationMin: number;
  returnPct: number;
  expectancy: number;
}

export interface MonthlyReturn {
  month: string;
  pnl: number;
  returnPct: number;
  trades: number;
}

export interface TradeDistribution {
  range: string;
  count: number;
  pnl: number;
}

export interface BacktestReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  bestMonth: string;
  worstMonth: string;
  longestWinStreak: number;
  longestLossStreak: number;
  avgTradesPerDay: number;
  maxConsecutiveLosses: number;
}

export const symbolOptions: { value: BacktestSymbol; label: string; basePrice: number }[] = [
  { value: 'XAU/USD', label: 'XAU/USD · Gold', basePrice: 2378 },
  { value: 'EUR/USD', label: 'EUR/USD · Euro', basePrice: 1.0842 },
  { value: 'GBP/USD', label: 'GBP/USD · Cable', basePrice: 1.2715 },
  { value: 'USD/JPY', label: 'USD/JPY · Yen', basePrice: 157.82 },
  { value: 'BTC/USD', label: 'BTC/USD · Bitcoin', basePrice: 61428 },
  { value: 'WTI/USD', label: 'WTI/USD · Oil', basePrice: 81.45 },
];

export const timeframeOptions: BacktestTimeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export const strategyOptions: BacktestStrategy[] = [
  'SMC Scalp', 'BOS Retest', 'EMA Crossover', 'Demand Zone',
  'Supply Zone', 'CHOCH Reversal', 'Liquidity Sweep', 'Trend Follow',
  'News Fade', 'Session Open',
];

export const defaultConfig: BacktestConfig = {
  symbol: 'XAU/USD',
  timeframe: 'M15',
  strategy: 'SMC Scalp',
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  initialBalance: 10000,
  riskPerTrade: 2,
};

function round2(v: number): number { return Math.round(v * 100) / 100; }
function round4(v: number): number { return Math.round(v * 10000) / 10000; }

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtDate(dayOffset: number, startDate: string): string {
  const start = new Date(startDate);
  start.setDate(start.getDate() + dayOffset);
  return start.toISOString().split('T')[0];
}

function fmtTime(minutes: number): string {
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Generate deterministic backtest trades based on config
export function generateBacktestTrades(config: BacktestConfig): BacktestTrade[] {
  const seed = config.symbol.length * 1000 + config.timeframe.length * 100 + config.strategy.length * 10 + config.startDate.length;
  const rng = seededRandom(seed);
  const symbolInfo = symbolOptions.find((s) => s.value === config.symbol)!;
  const basePrice = symbolInfo.basePrice;
  const isGold = config.symbol === 'XAU/USD';
  const isJpy = config.symbol === 'USD/JPY';
  const pricePrecision = isGold ? 1 : isJpy ? 2 : 4;
  const pipSize = isGold ? 0.1 : isJpy ? 0.01 : 0.0001;

  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const tradesPerDay = config.timeframe === 'M1' ? 8 : config.timeframe === 'M5' ? 6 : config.timeframe === 'M15' ? 5 : config.timeframe === 'M30' ? 4 : config.timeframe === 'H1' ? 3 : config.timeframe === 'H4' ? 2 : 1;
  const totalTrades = Math.min(250, totalDays * tradesPerDay);

  // Win rate varies by strategy
  const strategyWinRates: Record<BacktestStrategy, number> = {
    'SMC Scalp': 0.68, 'BOS Retest': 0.72, 'EMA Crossover': 0.65, 'Demand Zone': 0.70,
    'Supply Zone': 0.66, 'CHOCH Reversal': 0.71, 'Liquidity Sweep': 0.64, 'Trend Follow': 0.74,
    'News Fade': 0.58, 'Session Open': 0.62,
  };
  const baseWinRate = strategyWinRates[config.strategy] ?? 0.68;

  let balance = config.initialBalance;
  const trades: BacktestTrade[] = [];

  for (let i = 0; i < totalTrades; i++) {
    const dayOffset = Math.floor((i / totalTrades) * totalDays);
    const date = fmtDate(dayOffset, config.startDate);
    const minutesIntoDay = Math.floor(rng() * 720) + 480; // 08:00 - 20:00
    const time = fmtTime(minutesIntoDay);

    // Price drift simulation
    const trend = Math.sin(i / 20) * (isGold ? 15 : isJpy ? 1.5 : 0.05);
    const noise = (rng() - 0.5) * (isGold ? 8 : isJpy ? 0.8 : 0.02);
    const entryPrice = round4(basePrice + trend + noise);

    const isBuy = rng() > 0.5;
    const side = isBuy ? 'BUY' : 'SELL';

    // SL/TP distances based on timeframe
    const slPips = config.timeframe === 'M1' ? 15 + Math.floor(rng() * 10)
      : config.timeframe === 'M5' ? 20 + Math.floor(rng() * 15)
      : config.timeframe === 'M15' ? 30 + Math.floor(rng() * 20)
      : config.timeframe === 'M30' ? 40 + Math.floor(rng() * 25)
      : config.timeframe === 'H1' ? 50 + Math.floor(rng() * 30)
      : config.timeframe === 'H4' ? 80 + Math.floor(rng() * 50)
      : 120 + Math.floor(rng() * 80);

    const rrRatio = 1.5 + rng() * 1.5; // 1.5 to 3.0
    const tpPips = Math.round(slPips * rrRatio);

    const stopLoss = round4(isBuy ? entryPrice - slPips * pipSize : entryPrice + slPips * pipSize);
    const takeProfit = round4(isBuy ? entryPrice + tpPips * pipSize : entryPrice - tpPips * pipSize);

    const lotSize = round2(0.10 + rng() * 0.40);
    const pipValue = isGold ? lotSize * 1 : lotSize * 10;

    // Determine win/loss
    const r = rng();
    const isWin = r < baseWinRate;
    const isBreakeven = !isWin && r < baseWinRate + 0.05;

    let result: BacktestResult;
    let pips: number;
    let exitPrice: number;

    if (isWin) {
      result = 'WIN';
      // Partial TP or full TP
      const tpFraction = 0.7 + rng() * 0.3;
      pips = round2(tpPips * tpFraction);
      exitPrice = round4(isBuy ? entryPrice + pips * pipSize : entryPrice - pips * pipSize);
    } else if (isBreakeven) {
      result = 'BREAKEVEN';
      pips = round2((rng() - 0.5) * 4);
      exitPrice = round4(entryPrice + pips * pipSize);
    } else {
      result = 'LOSS';
      // Partial SL or full SL
      const slFraction = 0.8 + rng() * 0.2;
      pips = -round2(slPips * slFraction);
      exitPrice = round4(isBuy ? entryPrice + pips * pipSize : entryPrice - pips * pipSize);
    }

    const pnl = round2(pips * pipValue);
    const rr = result === 'WIN' ? round2(Math.abs(pips) / slPips) : result === 'LOSS' ? -round2(Math.abs(pips) / slPips) : 0;
    const confidence = Math.floor(55 + rng() * 40);

    const durationMin = config.timeframe === 'M1' ? 3 + Math.floor(rng() * 12)
      : config.timeframe === 'M5' ? 5 + Math.floor(rng() * 25)
      : config.timeframe === 'M15' ? 15 + Math.floor(rng() * 60)
      : config.timeframe === 'M30' ? 30 + Math.floor(rng() * 90)
      : config.timeframe === 'H1' ? 45 + Math.floor(rng() * 120)
      : config.timeframe === 'H4' ? 120 + Math.floor(rng() * 240)
      : 240 + Math.floor(rng() * 480);

    balance = round2(balance + pnl);

    trades.push({
      id: i + 1,
      ticket: `BT${String(10000 + i).padStart(5, '0')}`,
      side,
      entryPrice: Number(entryPrice.toFixed(pricePrecision)),
      exitPrice: Number(exitPrice.toFixed(pricePrecision)),
      stopLoss: Number(stopLoss.toFixed(pricePrecision)),
      takeProfit: Number(takeProfit.toFixed(pricePrecision)),
      lotSize,
      pnl,
      pips,
      rr,
      result,
      confidence,
      duration: fmtDuration(durationMin),
      date,
      time,
      balanceAfter: balance,
    });
  }

  return trades;
}

export function computeBacktestStats(trades: BacktestTrade[], config: BacktestConfig): BacktestStats {
  const total = trades.length;
  const wins = trades.filter((t) => t.result === 'WIN');
  const losses = trades.filter((t) => t.result === 'LOSS');
  const breakevens = trades.filter((t) => t.result === 'BREAKEVEN');

  const winningTrades = wins.length;
  const losingTrades = losses.length;
  const breakevenTrades = breakevens.length;
  const winRate = total > 0 ? (winningTrades / total) * 100 : 0;

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netProfit = round2(grossProfit - grossLoss);
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  const winPnls = wins.map((t) => t.pnl);
  const lossPnls = losses.map((t) => t.pnl);
  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
  const largestWin = winPnls.length > 0 ? Math.max(...winPnls) : 0;
  const largestLoss = lossPnls.length > 0 ? Math.min(...lossPnls) : 0;
  const avgRR = total > 0 ? trades.reduce((s, t) => s + t.rr, 0) / total : 0;

  // Max drawdown from balance curve
  let peak = config.initialBalance;
  let maxDD = 0;
  let maxDDPct = 0;
  for (const t of trades) {
    if (t.balanceAfter > peak) peak = t.balanceAfter;
    const dd = peak - t.balanceAfter;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
  }

  // Sharpe ratio (simplified, assuming risk-free rate = 0)
  const returns = trades.map((t) => t.pnl);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.length > 1
    ? returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  const returnPct = config.initialBalance > 0 ? (netProfit / config.initialBalance) * 100 : 0;
  const expectancy = total > 0 ? netProfit / total : 0;
  const totalDurationMin = trades.reduce((s, t) => {
    const m = parseInt(t.duration);
    const hMatch = t.duration.match(/(\d+)h/);
    return s + (hMatch ? parseInt(hMatch[1]) * 60 : 0) + m;
  }, 0);
  const avgDurationMin = total > 0 ? totalDurationMin / total : 0;

  return {
    totalTrades: total,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: round2(winRate),
    profitFactor: round2(profitFactor),
    sharpeRatio: round2(sharpeRatio * Math.sqrt(252)), // annualized
    maxDrawdown: round2(maxDD),
    maxDrawdownPct: round2(maxDDPct),
    avgWin: round2(avgWin),
    avgLoss: round2(avgLoss),
    avgRR: round2(avgRR),
    netProfit,
    grossProfit: round2(grossProfit),
    grossLoss: round2(grossLoss),
    largestWin: round2(largestWin),
    largestLoss: round2(largestLoss),
    avgDurationMin: round2(avgDurationMin),
    totalDurationMin,
    returnPct: round2(returnPct),
    expectancy: round2(expectancy),
  };
}

export function buildBacktestEquityCurve(trades: BacktestTrade[], initialBalance: number): number[] {
  const curve: number[] = [initialBalance];
  for (const t of trades) curve.push(t.balanceAfter);
  return curve;
}

export function buildDrawdownSeries(trades: BacktestTrade[], initialBalance: number): number[] {
  const series: number[] = [0];
  let peak = initialBalance;
  for (const t of trades) {
    if (t.balanceAfter > peak) peak = t.balanceAfter;
    const dd = peak > 0 ? ((peak - t.balanceAfter) / peak) * 100 : 0;
    series.push(round2(dd));
  }
  return series;
}

export function buildMonthlyReturns(trades: BacktestTrade[], initialBalance: number): MonthlyReturn[] {
  const map = new Map<string, { pnl: number; trades: number; startBalance: number }>();
  let runningBalance = initialBalance;

  for (const t of trades) {
    const month = t.date.substring(0, 7);
    const existing = map.get(month);
    if (existing) {
      existing.pnl += t.pnl;
      existing.trades++;
    } else {
      map.set(month, { pnl: t.pnl, trades: 1, startBalance: runningBalance });
    }
    runningBalance = t.balanceAfter;
  }

  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    pnl: round2(data.pnl),
    returnPct: round2(data.startBalance > 0 ? (data.pnl / data.startBalance) * 100 : 0),
    trades: data.trades,
  }));
}

export function buildTradeDistribution(trades: BacktestTrade[]): TradeDistribution[] {
  const ranges = [
    { range: '< -80', min: -Infinity, max: -80 },
    { range: '-80 to -40', min: -80, max: -40 },
    { range: '-40 to -20', min: -40, max: -20 },
    { range: '-20 to 0', min: -20, max: 0 },
    { range: '0 to 20', min: 0, max: 20 },
    { range: '20 to 40', min: 20, max: 40 },
    { range: '40 to 80', min: 40, max: 80 },
    { range: '> 80', min: 80, max: Infinity },
  ];

  return ranges.map((r) => {
    const filtered = trades.filter((t) => t.pnl >= r.min && t.pnl < r.max);
    return {
      range: r.range,
      count: filtered.length,
      pnl: round2(filtered.reduce((s, t) => s + t.pnl, 0)),
    };
  });
}

export function buildBacktestReport(
  trades: BacktestTrade[],
  stats: BacktestStats,
  config: BacktestConfig,
): BacktestReport {
  const monthlyReturns = buildMonthlyReturns(trades, config.initialBalance);
  const bestMonth = monthlyReturns.length > 0
    ? monthlyReturns.reduce((a, b) => Math.abs(b.returnPct) > Math.abs(a.returnPct) ? b : a).month
    : '—';
  const worstMonth = monthlyReturns.length > 0
    ? monthlyReturns.reduce((a, b) => b.pnl < a.pnl ? b : a).month
    : '—';

  // Streaks
  let currentWin = 0, currentLoss = 0;
  let maxWin = 0, maxLoss = 0;
  let maxConsecLosses = 0;
  for (const t of trades) {
    if (t.result === 'WIN') {
      currentWin++;
      currentLoss = 0;
      if (currentWin > maxWin) maxWin = currentWin;
    } else if (t.result === 'LOSS') {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > maxLoss) maxLoss = currentLoss;
      if (currentLoss > maxConsecLosses) maxConsecLosses = currentLoss;
    } else {
      currentWin = 0;
      currentLoss = 0;
    }
  }

  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const avgTradesPerDay = round2(stats.totalTrades / totalDays);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (stats.winRate >= 65) strengths.push(`Strong win rate of ${stats.winRate}% indicates reliable entry signals.`);
  else if (stats.winRate >= 55) strengths.push(`Moderate win rate of ${stats.winRate}% with room for improvement.`);
  else weaknesses.push(`Low win rate of ${stats.winRate}% — entry conditions may need tightening.`);

  if (stats.profitFactor >= 1.5) strengths.push(`Profit factor of ${stats.profitFactor} shows positive expectancy.`);
  else weaknesses.push(`Profit factor of ${stats.profitFactor} is below the 1.5 threshold for robustness.`);

  if (stats.sharpeRatio >= 1.0) strengths.push(`Sharpe ratio of ${stats.sharpeRatio} indicates good risk-adjusted returns.`);
  else weaknesses.push(`Sharpe ratio of ${stats.sharpeRatio} suggests high volatility relative to returns.`);

  if (stats.maxDrawdownPct < 10) strengths.push(`Maximum drawdown of ${stats.maxDrawdownPct}% is well-controlled.`);
  else if (stats.maxDrawdownPct < 20) weaknesses.push(`Maximum drawdown of ${stats.maxDrawdownPct}% is approaching risky territory.`);
  else weaknesses.push(`Maximum drawdown of ${stats.maxDrawdownPct}% is dangerously high — reduce position sizing.`);

  if (stats.avgRR >= 1.5) strengths.push(`Average R:R of ${stats.avgRR} demonstrates disciplined trade management.`);
  else weaknesses.push(`Average R:R of ${stats.avgRR} is below 1.5 — winners are being cut short.`);

  if (maxLoss >= 5) {
    weaknesses.push(`Longest losing streak of ${maxLoss} trades may cause psychological pressure.`);
    recommendations.push(`Consider implementing a cooldown period after 3 consecutive losses.`);
  }

  if (stats.breakevenTrades > stats.totalTrades * 0.1) {
    weaknesses.push(`${stats.breakevenTrades} breakeven trades (${Math.round((stats.breakevenTrades / stats.totalTrades) * 100)}%) suggest unclear exit criteria.`);
  }

  if (recommendations.length === 0) {
    recommendations.push(`Continue monitoring performance on forward data to validate backtest results.`);
    recommendations.push(`Run a walk-forward analysis to check for overfitting.`);
  }

  if (stats.netProfit > 0) {
    recommendations.push(`Strategy shows ${stats.returnPct}% return over the test period — test on out-of-sample data before live deployment.`);
  } else {
    recommendations.push(`Strategy is currently unprofitable — revisit entry filters and risk parameters.`);
  }

  recommendations.push(`Optimize position sizing using Kelly criterion or fixed fractional method based on ${stats.expectancy} expectancy.`);

  const summary = `Backtest of ${config.strategy} on ${config.symbol} (${config.timeframe}) from ${config.startDate} to ${config.endDate} produced ${stats.totalTrades} trades with a ${stats.winRate}% win rate, ${stats.profitFactor} profit factor, and ${stats.maxDrawdownPct}% maximum drawdown. Net result: ${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit} (${stats.returnPct}% return).`;

  return {
    summary,
    strengths,
    weaknesses,
    recommendations,
    bestMonth,
    worstMonth,
    longestWinStreak: maxWin,
    longestLossStreak: maxLoss,
    avgTradesPerDay,
    maxConsecutiveLosses: maxConsecLosses,
  };
}
