import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  computeHeikinAshi,
  computeTechnicalRating,
} from './indicators';
import { generateCandles, getSymbolById } from './marketData';

test('calculateSMA computes exact moving averages', () => {
  const sma = calculateSMA([10, 20, 30, 40, 50], 3);
  assert.deepEqual(sma, [null, null, 20, 30, 40]);
});

test('calculateEMA seeds with SMA and updates exponentially', () => {
  const ema = calculateEMA([10, 20, 30, 40], 3);
  assert.equal(ema[0], null);
  assert.equal(ema[1], null);
  assert.equal(ema[2], 20);
  // k = 2/(3+1) = 0.5 -> (40 - 20)*0.5 + 20 = 30
  assert.equal(ema[3], 30);
});

test('calculateBollingerBands satisfies upper >= middle >= lower', () => {
  const values = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i / 3) * 5 + i * 0.2);
  const bb = calculateBollingerBands(values, 20, 2);
  assert.equal(bb.middle[18], null);
  for (let i = 19; i < values.length; i++) {
    assert.ok(bb.upper[i]! >= bb.middle[i]!);
    assert.ok(bb.middle[i]! >= bb.lower[i]!);
  }
});

test('calculateRSI stays strictly within [0, 100] and detects uptrends', () => {
  const uptrend = Array.from({ length: 25 }, (_, i) => 100 + i * 2);
  const rsi = calculateRSI(uptrend, 14);
  assert.equal(rsi[13], null);
  assert.equal(rsi[14], 100);
  for (let i = 14; i < rsi.length; i++) {
    assert.ok(rsi[i]! >= 0 && rsi[i]! <= 100);
  }
});

test('calculateMACD produces macd - signal === histogram', () => {
  const sym = getSymbolById('NSE:NIFTY');
  const candles = generateCandles(sym, '1D', 90);
  const closes = candles.map((c) => c.close);
  const res = calculateMACD(closes, 12, 26, 9);
  const last = closes.length - 1;
  assert.ok(res.macd[last] !== null);
  assert.ok(res.signal[last] !== null);
  assert.ok(Math.abs(res.macd[last]! - res.signal[last]! - res.histogram[last]!) < 1e-9);
});

test('generateCandles obeys OHLC invariants and anchors final close to symbol price', () => {
  const sym = getSymbolById('NSE:RELIANCE');
  const candles = generateCandles(sym, '15m', 120);
  assert.equal(candles.length, 120);
  for (const c of candles) {
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
    assert.ok(c.volume > 0);
  }
  assert.ok(Math.abs(candles[candles.length - 1].close - sym.price) < 0.05);
});

test('computeHeikinAshi and computeTechnicalRating return valid structures', () => {
  const sym = getSymbolById('NSE:NIFTY');
  const candles = generateCandles(sym, '1D', 120);
  const ha = computeHeikinAshi(candles);
  assert.equal(ha.length, candles.length);
  for (const c of ha) {
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
  }

  const rating = computeTechnicalRating(candles);
  assert.ok(['Strong Sell', 'Sell', 'Neutral', 'Buy', 'Strong Buy'].includes(rating.label));
  assert.ok(rating.rsiValue >= 0 && rating.rsiValue <= 100);
});
