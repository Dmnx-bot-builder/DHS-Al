// Trade history data layer for DHS AI terminal

export type HistorySide = 'BUY' | 'SELL';
export type HistoryResult = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface HistoryTrade {
  id: string;
  ticket: string;
  symbol: string;
  side: HistorySide;
  lotSize: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pips: number;
  rr: number;
  duration: string;
  durationMinutes: number;
  strategy: string;
  confidence: number;
  result: HistoryResult;
  date: string;
  openTime: string;
  closeTime: string;
  commission: number;
  swap: number;
  netPnl: number;
}

export type StrategyName =
  | 'SMC Scalp' | 'BOS Retest' | 'EMA Crossover' | 'Demand Zone'
  | 'Supply Zone' | 'CHOCH Reversal' | 'Liquidity Sweep' | 'Trend Follow'
  | 'News Fade' | 'Session Open';

const STRATEGIES: StrategyName[] = [
  'SMC Scalp', 'BOS Retest', 'EMA Crossover', 'Demand Zone',
  'Supply Zone', 'CHOCH Reversal', 'Liquidity Sweep', 'Trend Follow',
  'News Fade', 'Session Open',
];

function fmtDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function round2(v: number): number { return Math.round(v * 100) / 100; }

interface RawTrade {
  side: HistorySide; lot: number; entry: number; exit: number; sl: number; tp: number;
  pips: number; pnl: number; durMin: number; strat: StrategyName; conf: number;
  result: HistoryResult; day: number; openMin: number; commission: number;
}

const rawTrades: RawTrade[] = [
  { side: 'BUY', lot: 0.30, entry: 2356.20, exit: 2363.40, sl: 2351.20, tp: 2366.20, pips: 72.0, pnl: 216.0, durMin: 45, strat: 'SMC Scalp', conf: 84, result: 'WIN', day: 1, openMin: 555, commission: -3.6 },
  { side: 'SELL', lot: 0.20, entry: 2371.80, exit: 2376.20, sl: 2376.80, tp: 2361.80, pips: -44.0, pnl: -88.0, durMin: 32, strat: 'Supply Zone', conf: 62, result: 'LOSS', day: 1, openMin: 660, commission: -2.4 },
  { side: 'BUY', lot: 0.40, entry: 2362.50, exit: 2368.10, sl: 2357.50, tp: 2373.50, pips: 56.0, pnl: 224.0, durMin: 58, strat: 'BOS Retest', conf: 88, result: 'WIN', day: 1, openMin: 780, commission: -4.8 },
  { side: 'BUY', lot: 0.25, entry: 2369.00, exit: 2369.00, sl: 2364.00, tp: 2379.00, pips: 0.0, pnl: 0.0, durMin: 20, strat: 'Session Open', conf: 71, result: 'BREAKEVEN', day: 1, openMin: 840, commission: -3.0 },
  { side: 'SELL', lot: 0.30, entry: 2375.40, exit: 2368.20, sl: 2380.40, tp: 2364.40, pips: 72.0, pnl: 216.0, durMin: 67, strat: 'CHOCH Reversal', conf: 86, result: 'WIN', day: 1, openMin: 900, commission: -3.6 },
  { side: 'BUY', lot: 0.35, entry: 2358.90, exit: 2366.30, sl: 2353.90, tp: 2370.90, pips: 74.0, pnl: 259.0, durMin: 92, strat: 'Demand Zone', conf: 90, result: 'WIN', day: 2, openMin: 540, commission: -4.2 },
  { side: 'BUY', lot: 0.20, entry: 2370.10, exit: 2374.50, sl: 2365.10, tp: 2378.10, pips: 44.0, pnl: 88.0, durMin: 25, strat: 'EMA Crossover', conf: 78, result: 'WIN', day: 2, openMin: 660, commission: -2.4 },
  { side: 'SELL', lot: 0.40, entry: 2378.60, exit: 2382.40, sl: 2383.60, tp: 2368.60, pips: -38.0, pnl: -152.0, durMin: 50, strat: 'Liquidity Sweep', conf: 65, result: 'LOSS', day: 2, openMin: 720, commission: -4.8 },
  { side: 'BUY', lot: 0.30, entry: 2363.20, exit: 2371.80, sl: 2358.20, tp: 2376.20, pips: 86.0, pnl: 258.0, durMin: 115, strat: 'Trend Follow', conf: 92, result: 'WIN', day: 2, openMin: 795, commission: -3.6 },
  { side: 'SELL', lot: 0.25, entry: 2374.30, exit: 2369.50, sl: 2379.30, tp: 2364.30, pips: 48.0, pnl: 120.0, durMin: 38, strat: 'SMC Scalp', conf: 82, result: 'WIN', day: 2, openMin: 870, commission: -3.0 },
  { side: 'BUY', lot: 0.50, entry: 2361.40, exit: 2361.40, sl: 2356.40, tp: 2371.40, pips: 0.0, pnl: 0.0, durMin: 15, strat: 'News Fade', conf: 68, result: 'BREAKEVEN', day: 3, openMin: 555, commission: -6.0 },
  { side: 'BUY', lot: 0.30, entry: 2365.80, exit: 2374.20, sl: 2360.80, tp: 2378.80, pips: 84.0, pnl: 252.0, durMin: 73, strat: 'BOS Retest', conf: 89, result: 'WIN', day: 3, openMin: 600, commission: -3.6 },
  { side: 'SELL', lot: 0.20, entry: 2377.10, exit: 2372.30, sl: 2382.10, tp: 2367.10, pips: 48.0, pnl: 96.0, durMin: 42, strat: 'Supply Zone', conf: 80, result: 'WIN', day: 3, openMin: 720, commission: -2.4 },
  { side: 'BUY', lot: 0.35, entry: 2368.50, exit: 2362.10, sl: 2363.50, tp: 2378.50, pips: -64.0, pnl: -224.0, durMin: 55, strat: 'Demand Zone', conf: 64, result: 'LOSS', day: 3, openMin: 780, commission: -4.2 },
  { side: 'BUY', lot: 0.25, entry: 2370.90, exit: 2377.30, sl: 2365.90, tp: 2380.90, pips: 64.0, pnl: 160.0, durMin: 68, strat: 'EMA Crossover', conf: 85, result: 'WIN', day: 3, openMin: 855, commission: -3.0 },
  { side: 'SELL', lot: 0.30, entry: 2379.20, exit: 2373.40, sl: 2384.20, tp: 2369.20, pips: 58.0, pnl: 174.0, durMin: 47, strat: 'CHOCH Reversal', conf: 87, result: 'WIN', day: 4, openMin: 540, commission: -3.6 },
  { side: 'BUY', lot: 0.40, entry: 2367.10, exit: 2375.50, sl: 2362.10, tp: 2379.10, pips: 84.0, pnl: 336.0, durMin: 102, strat: 'Trend Follow', conf: 91, result: 'WIN', day: 4, openMin: 615, commission: -4.8 },
  { side: 'SELL', lot: 0.20, entry: 2376.80, exit: 2379.40, sl: 2381.80, tp: 2366.80, pips: -26.0, pnl: -52.0, durMin: 30, strat: 'Liquidity Sweep', conf: 61, result: 'LOSS', day: 4, openMin: 735, commission: -2.4 },
  { side: 'BUY', lot: 0.30, entry: 2364.20, exit: 2371.60, sl: 2359.20, tp: 2374.20, pips: 74.0, pnl: 222.0, durMin: 81, strat: 'SMC Scalp', conf: 83, result: 'WIN', day: 4, openMin: 810, commission: -3.6 },
  { side: 'BUY', lot: 0.25, entry: 2372.00, exit: 2377.00, sl: 2367.00, tp: 2382.00, pips: 50.0, pnl: 125.0, durMin: 35, strat: 'Session Open', conf: 75, result: 'WIN', day: 4, openMin: 885, commission: -3.0 },
  { side: 'SELL', lot: 0.35, entry: 2380.50, exit: 2372.30, sl: 2385.50, tp: 2370.50, pips: 82.0, pnl: 287.0, durMin: 89, strat: 'Supply Zone', conf: 90, result: 'WIN', day: 5, openMin: 525, commission: -4.2 },
  { side: 'BUY', lot: 0.30, entry: 2366.30, exit: 2360.10, sl: 2361.30, tp: 2376.30, pips: -62.0, pnl: -186.0, durMin: 48, strat: 'Demand Zone', conf: 63, result: 'LOSS', day: 5, openMin: 630, commission: -3.6 },
  { side: 'BUY', lot: 0.40, entry: 2362.80, exit: 2370.40, sl: 2357.80, tp: 2374.80, pips: 76.0, pnl: 304.0, durMin: 95, strat: 'BOS Retest', conf: 88, result: 'WIN', day: 5, openMin: 720, commission: -4.8 },
  { side: 'SELL', lot: 0.20, entry: 2374.60, exit: 2369.80, sl: 2379.60, tp: 2364.60, pips: 48.0, pnl: 96.0, durMin: 28, strat: 'CHOCH Reversal', conf: 81, result: 'WIN', day: 5, openMin: 840, commission: -2.4 },
  { side: 'BUY', lot: 0.25, entry: 2369.10, exit: 2369.10, sl: 2364.10, tp: 2379.10, pips: 0.0, pnl: 0.0, durMin: 18, strat: 'News Fade', conf: 67, result: 'BREAKEVEN', day: 5, openMin: 900, commission: -3.0 },
  { side: 'BUY', lot: 0.30, entry: 2357.60, exit: 2364.80, sl: 2352.60, tp: 2367.60, pips: 72.0, pnl: 216.0, durMin: 52, strat: 'EMA Crossover', conf: 84, result: 'WIN', day: 6, openMin: 555, commission: -3.6 },
  { side: 'SELL', lot: 0.40, entry: 2376.20, exit: 2368.40, sl: 2381.20, tp: 2366.20, pips: 78.0, pnl: 312.0, durMin: 76, strat: 'Liquidity Sweep', conf: 89, result: 'WIN', day: 6, openMin: 630, commission: -4.8 },
  { side: 'BUY', lot: 0.20, entry: 2370.50, exit: 2375.50, sl: 2365.50, tp: 2378.50, pips: 50.0, pnl: 100.0, durMin: 22, strat: 'SMC Scalp', conf: 79, result: 'WIN', day: 6, openMin: 750, commission: -2.4 },
  { side: 'SELL', lot: 0.25, entry: 2378.30, exit: 2381.10, sl: 2383.30, tp: 2368.30, pips: -28.0, pnl: -70.0, durMin: 40, strat: 'Supply Zone', conf: 60, result: 'LOSS', day: 6, openMin: 810, commission: -3.0 },
  { side: 'BUY', lot: 0.35, entry: 2363.40, exit: 2371.80, sl: 2358.40, tp: 2375.40, pips: 84.0, pnl: 294.0, durMin: 110, strat: 'Trend Follow', conf: 92, result: 'WIN', day: 6, openMin: 870, commission: -4.2 },
  { side: 'BUY', lot: 0.30, entry: 2368.70, exit: 2375.30, sl: 2363.70, tp: 2378.70, pips: 66.0, pnl: 198.0, durMin: 63, strat: 'Demand Zone', conf: 86, result: 'WIN', day: 7, openMin: 540, commission: -3.6 },
  { side: 'SELL', lot: 0.20, entry: 2377.40, exit: 2372.60, sl: 2382.40, tp: 2367.40, pips: 48.0, pnl: 96.0, durMin: 33, strat: 'CHOCH Reversal', conf: 80, result: 'WIN', day: 7, openMin: 660, commission: -2.4 },
  { side: 'BUY', lot: 0.40, entry: 2360.50, exit: 2355.50, sl: 2355.50, tp: 2370.50, pips: -50.0, pnl: -200.0, durMin: 45, strat: 'BOS Retest', conf: 62, result: 'LOSS', day: 7, openMin: 735, commission: -4.8 },
  { side: 'BUY', lot: 0.25, entry: 2371.20, exit: 2376.80, sl: 2366.20, tp: 2381.20, pips: 56.0, pnl: 140.0, durMin: 57, strat: 'EMA Crossover', conf: 85, result: 'WIN', day: 7, openMin: 810, commission: -3.0 },
  { side: 'SELL', lot: 0.30, entry: 2379.80, exit: 2373.20, sl: 2384.80, tp: 2369.80, pips: 66.0, pnl: 198.0, durMin: 71, strat: 'Liquidity Sweep', conf: 88, result: 'WIN', day: 7, openMin: 885, commission: -3.6 },
  { side: 'BUY', lot: 0.35, entry: 2359.40, exit: 2366.60, sl: 2354.40, tp: 2369.40, pips: 72.0, pnl: 252.0, durMin: 64, strat: 'SMC Scalp', conf: 87, result: 'WIN', day: 8, openMin: 525, commission: -4.2 },
  { side: 'SELL', lot: 0.20, entry: 2375.60, exit: 2379.20, sl: 2380.60, tp: 2365.60, pips: -36.0, pnl: -72.0, durMin: 28, strat: 'Supply Zone', conf: 61, result: 'LOSS', day: 8, openMin: 630, commission: -2.4 },
  { side: 'BUY', lot: 0.30, entry: 2367.80, exit: 2374.40, sl: 2362.80, tp: 2377.80, pips: 66.0, pnl: 198.0, durMin: 59, strat: 'Demand Zone', conf: 85, result: 'WIN', day: 8, openMin: 720, commission: -3.6 },
  { side: 'BUY', lot: 0.25, entry: 2373.00, exit: 2373.00, sl: 2368.00, tp: 2383.00, pips: 0.0, pnl: 0.0, durMin: 12, strat: 'Session Open', conf: 66, result: 'BREAKEVEN', day: 8, openMin: 840, commission: -3.0 },
  { side: 'SELL', lot: 0.40, entry: 2381.20, exit: 2372.80, sl: 2386.20, tp: 2371.20, pips: 84.0, pnl: 336.0, durMin: 98, strat: 'Trend Follow', conf: 91, result: 'WIN', day: 8, openMin: 870, commission: -4.8 },
  { side: 'BUY', lot: 0.20, entry: 2365.10, exit: 2371.30, sl: 2360.10, tp: 2375.10, pips: 62.0, pnl: 124.0, durMin: 37, strat: 'EMA Crossover', conf: 82, result: 'WIN', day: 9, openMin: 555, commission: -2.4 },
  { side: 'SELL', lot: 0.30, entry: 2377.80, exit: 2370.60, sl: 2382.80, tp: 2367.80, pips: 72.0, pnl: 216.0, durMin: 65, strat: 'CHOCH Reversal', conf: 87, result: 'WIN', day: 9, openMin: 630, commission: -3.6 },
  { side: 'BUY', lot: 0.35, entry: 2362.70, exit: 2357.50, sl: 2357.70, tp: 2372.70, pips: -52.0, pnl: -182.0, durMin: 43, strat: 'BOS Retest', conf: 64, result: 'LOSS', day: 9, openMin: 735, commission: -4.2 },
  { side: 'BUY', lot: 0.40, entry: 2370.40, exit: 2378.80, sl: 2365.40, tp: 2382.40, pips: 84.0, pnl: 336.0, durMin: 108, strat: 'Trend Follow', conf: 93, result: 'WIN', day: 9, openMin: 810, commission: -4.8 },
  { side: 'SELL', lot: 0.25, entry: 2376.10, exit: 2371.30, sl: 2381.10, tp: 2366.10, pips: 48.0, pnl: 120.0, durMin: 31, strat: 'SMC Scalp', conf: 80, result: 'WIN', day: 9, openMin: 900, commission: -3.0 },
  { side: 'BUY', lot: 0.30, entry: 2358.20, exit: 2365.80, sl: 2353.20, tp: 2368.20, pips: 76.0, pnl: 228.0, durMin: 70, strat: 'Demand Zone', conf: 88, result: 'WIN', day: 10, openMin: 540, commission: -3.6 },
  { side: 'SELL', lot: 0.20, entry: 2374.50, exit: 2369.10, sl: 2379.50, tp: 2364.50, pips: 54.0, pnl: 108.0, durMin: 36, strat: 'Supply Zone', conf: 79, result: 'WIN', day: 10, openMin: 660, commission: -2.4 },
  { side: 'BUY', lot: 0.40, entry: 2364.80, exit: 2358.80, sl: 2359.80, tp: 2374.80, pips: -60.0, pnl: -240.0, durMin: 52, strat: 'Liquidity Sweep', conf: 60, result: 'LOSS', day: 10, openMin: 735, commission: -4.8 },
  { side: 'BUY', lot: 0.25, entry: 2372.30, exit: 2378.10, sl: 2367.30, tp: 2382.30, pips: 58.0, pnl: 145.0, durMin: 54, strat: 'EMA Crossover', conf: 84, result: 'WIN', day: 10, openMin: 810, commission: -3.0 },
  { side: 'SELL', lot: 0.35, entry: 2380.10, exit: 2373.50, sl: 2385.10, tp: 2370.10, pips: 66.0, pnl: 231.0, durMin: 77, strat: 'CHOCH Reversal', conf: 89, result: 'WIN', day: 10, openMin: 885, commission: -4.2 },
  { side: 'BUY', lot: 0.30, entry: 2366.90, exit: 2374.10, sl: 2361.90, tp: 2376.90, pips: 72.0, pnl: 216.0, durMin: 61, strat: 'SMC Scalp', conf: 86, result: 'WIN', day: 11, openMin: 525, commission: -3.6 },
  { side: 'BUY', lot: 0.25, entry: 2375.50, exit: 2375.50, sl: 2370.50, tp: 2385.50, pips: 0.0, pnl: 0.0, durMin: 16, strat: 'News Fade', conf: 69, result: 'BREAKEVEN', day: 11, openMin: 630, commission: -3.0 },
  { side: 'SELL', lot: 0.40, entry: 2379.60, exit: 2371.20, sl: 2384.60, tp: 2369.60, pips: 84.0, pnl: 336.0, durMin: 94, strat: 'Trend Follow', conf: 92, result: 'WIN', day: 11, openMin: 720, commission: -4.8 },
  { side: 'BUY', lot: 0.20, entry: 2370.80, exit: 2365.40, sl: 2365.80, tp: 2380.80, pips: -54.0, pnl: -108.0, durMin: 38, strat: 'BOS Retest', conf: 61, result: 'LOSS', day: 11, openMin: 810, commission: -2.4 },
  { side: 'BUY', lot: 0.30, entry: 2363.50, exit: 2370.70, sl: 2358.50, tp: 2373.50, pips: 72.0, pnl: 216.0, durMin: 66, strat: 'Demand Zone', conf: 87, result: 'WIN', day: 11, openMin: 870, commission: -3.6 },
  { side: 'SELL', lot: 0.25, entry: 2377.20, exit: 2372.00, sl: 2382.20, tp: 2367.20, pips: 52.0, pnl: 130.0, durMin: 34, strat: 'CHOCH Reversal', conf: 81, result: 'WIN', day: 12, openMin: 555, commission: -3.0 },
  { side: 'BUY', lot: 0.35, entry: 2361.20, exit: 2368.40, sl: 2356.20, tp: 2371.20, pips: 72.0, pnl: 252.0, durMin: 79, strat: 'EMA Crossover', conf: 86, result: 'WIN', day: 12, openMin: 630, commission: -4.2 },
  { side: 'SELL', lot: 0.30, entry: 2378.40, exit: 2382.00, sl: 2383.40, tp: 2368.40, pips: -36.0, pnl: -108.0, durMin: 44, strat: 'Liquidity Sweep', conf: 63, result: 'LOSS', day: 12, openMin: 750, commission: -3.6 },
  { side: 'BUY', lot: 0.40, entry: 2369.60, exit: 2377.40, sl: 2364.60, tp: 2381.60, pips: 78.0, pnl: 312.0, durMin: 101, strat: 'Trend Follow', conf: 91, result: 'WIN', day: 12, openMin: 825, commission: -4.8 },
  { side: 'BUY', lot: 0.20, entry: 2374.20, exit: 2379.00, sl: 2369.20, tp: 2384.20, pips: 48.0, pnl: 96.0, durMin: 26, strat: 'SMC Scalp', conf: 78, result: 'WIN', day: 12, openMin: 900, commission: -2.4 },
  { side: 'SELL', lot: 0.35, entry: 2382.50, exit: 2375.30, sl: 2387.50, tp: 2372.50, pips: 72.0, pnl: 252.0, durMin: 82, strat: 'Supply Zone', conf: 88, result: 'WIN', day: 13, openMin: 540, commission: -4.2 },
  { side: 'BUY', lot: 0.30, entry: 2367.40, exit: 2374.20, sl: 2362.40, tp: 2377.40, pips: 68.0, pnl: 204.0, durMin: 62, strat: 'Demand Zone', conf: 85, result: 'WIN', day: 13, openMin: 660, commission: -3.6 },
  { side: 'SELL', lot: 0.20, entry: 2376.30, exit: 2371.10, sl: 2381.30, tp: 2366.30, pips: 52.0, pnl: 104.0, durMin: 29, strat: 'CHOCH Reversal', conf: 80, result: 'WIN', day: 13, openMin: 750, commission: -2.4 },
  { side: 'BUY', lot: 0.25, entry: 2372.50, exit: 2366.90, sl: 2367.50, tp: 2382.50, pips: -56.0, pnl: -140.0, durMin: 47, strat: 'BOS Retest', conf: 62, result: 'LOSS', day: 13, openMin: 810, commission: -3.0 },
  { side: 'BUY', lot: 0.30, entry: 2364.60, exit: 2371.20, sl: 2359.60, tp: 2374.60, pips: 66.0, pnl: 198.0, durMin: 58, strat: 'EMA Crossover', conf: 83, result: 'WIN', day: 13, openMin: 885, commission: -3.6 },
  { side: 'SELL', lot: 0.40, entry: 2379.10, exit: 2370.50, sl: 2384.10, tp: 2369.10, pips: 86.0, pnl: 344.0, durMin: 96, strat: 'Liquidity Sweep', conf: 90, result: 'WIN', day: 14, openMin: 525, commission: -4.8 },
  { side: 'BUY', lot: 0.25, entry: 2370.80, exit: 2370.80, sl: 2365.80, tp: 2380.80, pips: 0.0, pnl: 0.0, durMin: 14, strat: 'Session Open', conf: 65, result: 'BREAKEVEN', day: 14, openMin: 630, commission: -3.0 },
  { side: 'BUY', lot: 0.35, entry: 2365.30, exit: 2373.10, sl: 2360.30, tp: 2375.30, pips: 78.0, pnl: 273.0, durMin: 85, strat: 'Trend Follow', conf: 89, result: 'WIN', day: 14, openMin: 720, commission: -4.2 },
  { side: 'SELL', lot: 0.20, entry: 2377.50, exit: 2380.50, sl: 2382.50, tp: 2367.50, pips: -30.0, pnl: -60.0, durMin: 24, strat: 'Supply Zone', conf: 58, result: 'LOSS', day: 14, openMin: 810, commission: -2.4 },
  { side: 'BUY', lot: 0.30, entry: 2373.40, exit: 2380.20, sl: 2368.40, tp: 2383.40, pips: 68.0, pnl: 204.0, durMin: 72, strat: 'SMC Scalp', conf: 85, result: 'WIN', day: 14, openMin: 870, commission: -3.6 },
  { side: 'BUY', lot: 0.40, entry: 2368.10, exit: 2376.50, sl: 2363.10, tp: 2380.10, pips: 84.0, pnl: 336.0, durMin: 112, strat: 'Demand Zone', conf: 92, result: 'WIN', day: 15, openMin: 540, commission: -4.8 },
  { side: 'SELL', lot: 0.25, entry: 2381.30, exit: 2375.10, sl: 2386.30, tp: 2371.30, pips: 62.0, pnl: 155.0, durMin: 56, strat: 'CHOCH Reversal', conf: 86, result: 'WIN', day: 15, openMin: 660, commission: -3.0 },
  { side: 'BUY', lot: 0.20, entry: 2374.60, exit: 2369.60, sl: 2369.60, tp: 2384.60, pips: -50.0, pnl: -100.0, durMin: 35, strat: 'EMA Crossover', conf: 60, result: 'LOSS', day: 15, openMin: 750, commission: -2.4 },
  { side: 'BUY', lot: 0.30, entry: 2370.20, exit: 2377.40, sl: 2365.20, tp: 2380.20, pips: 72.0, pnl: 216.0, durMin: 68, strat: 'BOS Retest', conf: 87, result: 'WIN', day: 15, openMin: 825, commission: -3.6 },
  { side: 'SELL', lot: 0.35, entry: 2378.90, exit: 2372.70, sl: 2383.90, tp: 2368.90, pips: 62.0, pnl: 217.0, durMin: 73, strat: 'Liquidity Sweep', conf: 88, result: 'WIN', day: 15, openMin: 900, commission: -4.2 },
];

function buildTrades(): HistoryTrade[] {
  return rawTrades.map((r, i) => {
    const closeMin = r.openMin + r.durMin;
    const swap = round2(-(r.lot * 0.14 * (r.durMin / 60)));
    const netPnl = round2(r.pnl + r.commission + swap);
    const date = `2024-07-${String(r.day).padStart(2, '0')}`;
    const rr = r.result === 'WIN' ? round2(r.pips / Math.abs(r.pips - (r.pips > 0 ? 50 : -50)) || 2) : r.result === 'LOSS' ? -1 : 0;
    return {
      id: `h${i + 1}`,
      ticket: `5042${String(1800 + i).padStart(4, '0')}`,
      symbol: 'XAU/USD',
      side: r.side,
      lotSize: r.lot,
      entryPrice: r.entry,
      exitPrice: r.exit,
      stopLoss: r.sl,
      takeProfit: r.tp,
      pnl: r.pnl,
      pips: r.pips,
      rr: rr > 0 ? rr : r.result === 'BREAKEVEN' ? 0 : -1,
      duration: fmtDuration(r.durMin),
      durationMinutes: r.durMin,
      strategy: r.strat,
      confidence: r.conf,
      result: r.result,
      date,
      openTime: fmtTime(r.openMin),
      closeTime: fmtTime(closeMin > 1440 ? closeMin - 1440 : closeMin),
      commission: r.commission,
      swap,
      netPnl,
    };
  });
}

export const historyTrades: HistoryTrade[] = buildTrades();

export interface HistoryStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winPct: number;
  totalPnl: number;
  netPnl: number;
  largestWin: number;
  largestLoss: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  avgDurationMin: number;
  avgConfidence: number;
  profitFactor: number;
}

export function computeStats(trades: HistoryTrade[]): HistoryStats {
  const total = trades.length;
  const wins = trades.filter((t) => t.result === 'WIN').length;
  const losses = trades.filter((t) => t.result === 'LOSS').length;
  const breakevens = trades.filter((t) => t.result === 'BREAKEVEN').length;
  const winPct = total > 0 ? (wins / total) * 100 : 0;

  const winPnls = trades.filter((t) => t.result === 'WIN').map((t) => t.netPnl);
  const lossPnls = trades.filter((t) => t.result === 'LOSS').map((t) => t.netPnl);

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const netPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const largestWin = winPnls.length > 0 ? Math.max(...winPnls) : 0;
  const largestLoss = lossPnls.length > 0 ? Math.min(...lossPnls) : 0;
  const avgWin = winPnls.length > 0 ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
  const avgLoss = lossPnls.length > 0 ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
  const avgRR = trades.reduce((s, t) => s + t.rr, 0) / total;
  const avgDurationMin = trades.reduce((s, t) => s + t.durationMinutes, 0) / total;
  const avgConfidence = trades.reduce((s, t) => s + t.confidence, 0) / total;
  const grossProfit = winPnls.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(lossPnls.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    total, wins, losses, breakevens, winPct,
    totalPnl, netPnl, largestWin, largestLoss,
    avgWin, avgLoss, avgRR, avgDurationMin, avgConfidence,
    profitFactor: profitFactor === Infinity ? 0 : profitFactor,
  };
}

export function buildEquityCurve(trades: HistoryTrade[], startBalance = 50000): number[] {
  const sorted = [...trades].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.openTime.localeCompare(b.openTime);
  });
  const curve: number[] = [startBalance];
  let balance = startBalance;
  for (const t of sorted) {
    balance += t.netPnl;
    curve.push(round2(balance));
  }
  return curve;
}

export interface MonthlyPnl {
  month: string;
  pnl: number;
  wins: number;
  losses: number;
}

export function buildMonthlyPnl(trades: HistoryTrade[]): MonthlyPnl[] {
  const map = new Map<string, MonthlyPnl>();
  for (const t of trades) {
    const month = t.date.substring(0, 7);
    const existing = map.get(month);
    if (existing) {
      existing.pnl += t.netPnl;
      if (t.result === 'WIN') existing.wins++;
      if (t.result === 'LOSS') existing.losses++;
    } else {
      map.set(month, { month, pnl: t.netPnl, wins: t.result === 'WIN' ? 1 : 0, losses: t.result === 'LOSS' ? 1 : 0 });
    }
  }
  return Array.from(map.values()).map((m) => ({ ...m, pnl: round2(m.pnl) }));
}

export interface StrategyStats {
  strategy: string;
  total: number;
  wins: number;
  pnl: number;
  winPct: number;
}

export function buildStrategyStats(trades: HistoryTrade[]): StrategyStats[] {
  const map = new Map<string, { strategy: string; total: number; wins: number; pnl: number }>();
  for (const t of trades) {
    const existing = map.get(t.strategy);
    if (existing) {
      existing.total++;
      if (t.result === 'WIN') existing.wins++;
      existing.pnl += t.netPnl;
    } else {
      map.set(t.strategy, { strategy: t.strategy, total: 1, wins: t.result === 'WIN' ? 1 : 0, pnl: t.netPnl });
    }
  }
  return Array.from(map.values()).map((s) => ({
    ...s,
    pnl: round2(s.pnl),
    winPct: (s.wins / s.total) * 100,
  })).sort((a, b) => b.pnl - a.pnl);
}

export { STRATEGIES };
