import type { Candle, TechnicalRatingResult } from './types';

export function calculateSMA(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

export function calculateEMA(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += values[i];
  }
  let ema = initialSum / period;
  result[period - 1] = ema;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    result[i] = ema;
  }
  return result;
}

export interface BollingerBandsResult {
  upper: Array<number | null>;
  middle: Array<number | null>;
  lower: Array<number | null>;
}

export function calculateBollingerBands(
  values: number[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerBandsResult {
  const middle = calculateSMA(values, period);
  const upper: Array<number | null> = new Array(values.length).fill(null);
  const lower: Array<number | null> = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;
    let sqDiffSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - mean;
      sqDiffSum += diff * diff;
    }
    const stdDev = Math.sqrt(sqDiffSum / period);
    upper[i] = mean + stdDevMultiplier * stdDev;
    lower[i] = mean - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

export function calculateRSI(values: number[], period = 14): Array<number | null> {
  const result: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) avgGain += delta;
    else avgLoss += Math.abs(delta);
  }
  avgGain /= period;
  avgLoss /= period;

  const toRsi = (g: number, l: number) => {
    if (l === 0) return g === 0 ? 50 : 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  };

  result[period] = toRsi(avgGain, avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = toRsi(avgGain, avgLoss);
  }
  return result;
}

export interface MacdResult {
  macd: Array<number | null>;
  signal: Array<number | null>;
  histogram: Array<number | null>;
}

export function calculateMACD(
  values: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MacdResult {
  const fast = calculateEMA(values, fastPeriod);
  const slow = calculateEMA(values, slowPeriod);
  const macd: Array<number | null> = values.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? fast[i]! - slow[i]! : null,
  );

  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  macd.forEach((v, idx) => {
    if (v !== null) {
      validMacdValues.push(v);
      validIndices.push(idx);
    }
  });

  const rawSignal = calculateEMA(validMacdValues, signalPeriod);
  const signal: Array<number | null> = new Array(values.length).fill(null);
  const histogram: Array<number | null> = new Array(values.length).fill(null);

  rawSignal.forEach((sigVal, j) => {
    const origIdx = validIndices[j];
    if (sigVal !== null && macd[origIdx] !== null) {
      signal[origIdx] = sigVal;
      histogram[origIdx] = macd[origIdx]! - sigVal;
    }
  });

  return { macd, signal, histogram };
}

export function computeHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }
  return out;
}

export function computeTechnicalRating(candles: Candle[]): TechnicalRatingResult {
  if (candles.length < 30) {
    return {
      score: 0,
      label: 'Neutral',
      buySignals: 0,
      neutralSignals: 1,
      sellSignals: 0,
      rsiValue: 50,
    };
  }

  const closes = candles.map((c) => c.close);
  const last = closes[closes.length - 1];
  const periods = [10, 20, 30, 50, 100];

  let buySignals = 0;
  let sellSignals = 0;
  let neutralSignals = 0;

  for (const p of periods) {
    const smaArr = calculateSMA(closes, Math.min(p, closes.length - 1));
    const emaArr = calculateEMA(closes, Math.min(p, closes.length - 1));
    const smaVal = smaArr[smaArr.length - 1];
    const emaVal = emaArr[emaArr.length - 1];

    for (const ma of [smaVal, emaVal]) {
      if (ma === null) continue;
      const diffRatio = (last - ma) / ma;
      if (diffRatio > 0.002) buySignals++;
      else if (diffRatio < -0.002) sellSignals++;
      else neutralSignals++;
    }
  }

  const rsiArr = calculateRSI(closes, 14);
  const rsiValue = rsiArr[rsiArr.length - 1] ?? 50;
  if (rsiValue < 35) buySignals += 2;
  else if (rsiValue > 70) sellSignals += 2;
  else if (rsiValue > 54) buySignals += 1;
  else if (rsiValue < 46) sellSignals += 1;
  else neutralSignals += 2;

  const macdRes = calculateMACD(closes, 12, 26, 9);
  const lastHist = macdRes.histogram[macdRes.histogram.length - 1] ?? 0;
  if (lastHist > 0) buySignals += 2;
  else if (lastHist < 0) sellSignals += 2;
  else neutralSignals += 1;

  const total = buySignals + sellSignals + neutralSignals;
  const score = total > 0 ? (buySignals - sellSignals) / total : 0;

  let label: TechnicalRatingResult['label'] = 'Neutral';
  if (score >= 0.45) label = 'Strong Buy';
  else if (score >= 0.12) label = 'Buy';
  else if (score <= -0.45) label = 'Strong Sell';
  else if (score <= -0.12) label = 'Sell';

  return {
    score,
    label,
    buySignals,
    neutralSignals,
    sellSignals,
    rsiValue: Math.round(rsiValue * 10) / 10,
  };
}
