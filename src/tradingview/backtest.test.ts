import test from 'node:test';
import assert from 'node:assert/strict';
import { runPineStrategyBacktest } from './backtest';
import { generateCandles, getSymbolById } from './marketData';
import type { Candle } from './types';

function makeTrendingCandles(count: number): Candle[] {
  const out: Candle[] = [];
  let price = 1000;
  for (let i = 0; i < count; i++) {
    // Oscillate then trend strongly upward so crossovers and breakouts trigger
    const wave = Math.sin(i / 8) * 18;
    const trend = i > 40 ? 6 : -2;
    const close = Math.max(100, price + trend + wave * 0.25);
    out.push({
      time: 1795000000 + i * 86400,
      open: price,
      high: Math.max(price, close) + 8,
      low: Math.min(price, close) - 8,
      close,
      volume: 1_000_000,
    });
    price = close;
  }
  return out;
}

test('runPineStrategyBacktest produces valid metrics for EMA Crossover', () => {
  const candles = makeTrendingCandles(160);
  const report = runPineStrategyBacktest(candles, 'ema_cross', 1_000_000);
  assert.equal(report.strategyId, 'ema_cross');
  assert.ok(report.totalTrades >= 1, 'Expected at least 1 EMA crossover trade');
  assert.ok(report.winRatePct >= 0 && report.winRatePct <= 100);
  assert.ok(report.maxDrawdownPct >= 0);
  assert.ok(Math.abs(report.netProfitInr - (report.finalEquity - report.initialCapital)) < 1e-6);
});

test('runPineStrategyBacktest works across RSI Reversion and Bollinger Breakout on NSE:NIFTY', () => {
  const nifty = getSymbolById('NSE:NIFTY');
  const candles = generateCandles(nifty, '1D', 180);

  for (const id of ['ema_cross', 'rsi_reversion', 'bb_breakout'] as const) {
    const report = runPineStrategyBacktest(candles, id, 1_000_000);
    assert.ok(Number.isFinite(report.netProfitPct));
    assert.ok(Number.isFinite(report.profitFactor));
    assert.ok(report.maxDrawdownPct >= 0 && report.maxDrawdownPct <= 100);
    for (const tr of report.trades) {
      assert.ok(tr.exitIndex > tr.entryIndex);
    }
  }
});
