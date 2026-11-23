import { calculateBollingerBands, calculateEMA, calculateRSI } from './indicators';
import type { Candle } from './types';

export type PineStrategyId = 'ema_cross' | 'rsi_reversion' | 'bb_breakout';

export interface PineTemplate {
  id: PineStrategyId;
  name: string;
  description: string;
  code: string;
}

export interface BacktestTrade {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  pnlInr: number;
}

export interface BacktestReport {
  strategyId: PineStrategyId;
  strategyName: string;
  initialCapital: number;
  finalEquity: number;
  netProfitInr: number;
  netProfitPct: number;
  totalTrades: number;
  winningTrades: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  trades: BacktestTrade[];
}

export const PINE_TEMPLATES: PineTemplate[] = [
  {
    id: 'ema_cross',
    name: 'EMA 20 / 50 Crossover (India Trend)',
    description: 'Enters long when fast EMA(20) crosses above slow EMA(50), exits on reverse cross.',
    code: `//@version=5
strategy("EMA 20/50 India Trend", overlay=true, initial_capital=1000000)
fastLen = input.int(20, "Fast EMA")
slowLen = input.int(50, "Slow EMA")
fastEma = ta.ema(close, fastLen)
slowEma = ta.ema(close, slowLen)
if ta.crossover(fastEma, slowEma)
    strategy.entry("Long", strategy.long)
if ta.crossunder(fastEma, slowEma)
    strategy.close("Long")
plot(fastEma, color=#2962FF, title="Fast EMA")
plot(slowEma, color=#FF9800, title="Slow EMA")`,
  },
  {
    id: 'rsi_reversion',
    name: 'RSI (14) Mean Reversion',
    description: 'Buys oversold dips when RSI(14) crosses back above 35 and exits when RSI exceeds 68.',
    code: `//@version=5
strategy("RSI 14 Mean Reversion", overlay=false, initial_capital=1000000)
rsiVal = ta.rsi(close, 14)
if ta.crossover(rsiVal, 35)
    strategy.entry("RSI Long", strategy.long)
if rsiVal >= 68
    strategy.close("RSI Long")
hline(70, "Overbought", color=color.red)
hline(30, "Oversold", color=color.green)`,
  },
  {
    id: 'bb_breakout',
    name: 'Bollinger Bands (20, 2) Breakout',
    description: 'Captures volatility expansion above the upper band and exits below the 20-period basis.',
    code: `//@version=5
strategy("Bollinger Breakout", overlay=true, initial_capital=1000000)
[basis, upper, lower] = ta.bb(close, 20, 2.0)
if close > upper
    strategy.entry("BB Breakout", strategy.long)
if close < basis
    strategy.close("BB Breakout")
plot(basis, color=color.blue)`,
  },
];

/**
 * Pure deterministic Pine Script strategy backtester executed over OHLCV candles.
 */
export function runPineStrategyBacktest(
  candles: Candle[],
  strategyId: PineStrategyId,
  initialCapital = 1_000_000,
): BacktestReport {
  const template = PINE_TEMPLATES.find((t) => t.id === strategyId) ?? PINE_TEMPLATES[0];
  const closes = candles.map((c) => c.close);

  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi14 = calculateRSI(closes, 14);
  const bb = calculateBollingerBands(closes, 20, 2);

  let equity = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdownPct = 0;

  let inPosition = false;
  let entryIdx = -1;
  let entryPrice = 0;
  const trades: BacktestTrade[] = [];

  for (let i = 1; i < candles.length; i++) {
    const close = closes[i];
    let buySignal = false;
    let sellSignal = false;

    if (strategyId === 'ema_cross') {
      const fPrev = ema20[i - 1];
      const sPrev = ema50[i - 1];
      const fCurr = ema20[i];
      const sCurr = ema50[i];
      if (fPrev !== null && sPrev !== null && fCurr !== null && sCurr !== null) {
        if (fPrev <= sPrev && fCurr > sCurr) buySignal = true;
        if (fPrev >= sPrev && fCurr < sCurr) sellSignal = true;
      }
    } else if (strategyId === 'rsi_reversion') {
      const rPrev = rsi14[i - 1];
      const rCurr = rsi14[i];
      if (rPrev !== null && rCurr !== null) {
        if (rPrev <= 35 && rCurr > 35) buySignal = true;
        if (rCurr >= 68) sellSignal = true;
      }
    } else {
      const upper = bb.upper[i];
      const mid = bb.middle[i];
      if (upper !== null && mid !== null) {
        if (close > upper) buySignal = true;
        if (close < mid) sellSignal = true;
      }
    }

    if (!inPosition && buySignal) {
      inPosition = true;
      entryIdx = i;
      entryPrice = close;
    } else if (inPosition && (sellSignal || i === candles.length - 1)) {
      const returnRatio = (close - entryPrice) / Math.max(0.0001, entryPrice);
      const pnlInr = equity * returnRatio;
      equity += pnlInr;
      trades.push({
        entryIndex: entryIdx,
        exitIndex: i,
        entryPrice,
        exitPrice: close,
        returnPct: returnRatio * 100,
        pnlInr,
      });
      inPosition = false;
    }

    // Track mark-to-market drawdown
    const markEquity = inPosition
      ? equity * (1 + (close - entryPrice) / Math.max(0.0001, entryPrice))
      : equity;
    if (markEquity > peakEquity) peakEquity = markEquity;
    const dd = peakEquity > 0 ? ((peakEquity - markEquity) / peakEquity) * 100 : 0;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
  }

  const winningTrades = trades.filter((t) => t.pnlInr > 0).length;
  const grossProfit = trades.filter((t) => t.pnlInr > 0).reduce((acc, t) => acc + t.pnlInr, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnlInr < 0).reduce((acc, t) => acc + t.pnlInr, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 9.99 : 0;

  return {
    strategyId,
    strategyName: template.name,
    initialCapital,
    finalEquity: equity,
    netProfitInr: equity - initialCapital,
    netProfitPct: ((equity - initialCapital) / initialCapital) * 100,
    totalTrades: trades.length,
    winningTrades,
    winRatePct: trades.length > 0 ? (winningTrades / trades.length) * 100 : 0,
    profitFactor,
    maxDrawdownPct,
    trades,
  };
}
