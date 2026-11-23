import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  computeHeikinAshi,
} from '../indicators';
import { formatPrice, formatVolume } from '../marketData';
import type {
  Candle,
  ChartDrawing,
  ChartStyle,
  DrawingTool,
  IndicatorConfig,
  MarketSymbol,
} from '../types';

interface CandlestickCanvasProps {
  symbol: MarketSymbol;
  candles: Candle[];
  chartStyle: ChartStyle;
  indicators: IndicatorConfig;
  activeTool: DrawingTool;
  drawings: ChartDrawing[];
  onAddDrawing: (drawing: ChartDrawing) => void;
  darkTheme: boolean;
  compact?: boolean;
}

export function CandlestickCanvas({
  symbol,
  candles,
  chartStyle,
  indicators,
  activeTool,
  drawings,
  onAddDrawing,
  darkTheme,
  compact = false,
}: CandlestickCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState({ width: 900, height: compact ? 360 : 540 });
  const [visibleCount, setVisibleCount] = useState(compact ? 72 : 95);
  const [rightOffset, setRightOffset] = useState(4); // blank bars on the right
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);

  // Drag pan or drawing draft state
  const panStateRef = useRef<{ startX: number; initialOffset: number } | null>(null);
  const [draftDrawing, setDraftDrawing] = useState<ChartDrawing | null>(null);

  const displayCandles = useMemo(
    () => (chartStyle === 'heikin' ? computeHeikinAshi(candles) : candles),
    [candles, chartStyle],
  );

  const closes = useMemo(() => displayCandles.map((c) => c.close), [displayCandles]);

  const indicatorData = useMemo(() => {
    return {
      ema20: indicators.ema20 ? calculateEMA(closes, 20) : null,
      ema50: indicators.ema50 ? calculateEMA(closes, 50) : null,
      sma200: indicators.sma200 ? calculateSMA(closes, Math.min(120, Math.max(20, closes.length - 5))) : null,
      bb: indicators.bollinger ? calculateBollingerBands(closes, 20, 2) : null,
      rsi: indicators.rsi ? calculateRSI(closes, 14) : null,
      macd: indicators.macd ? calculateMACD(closes, 12, 26, 9) : null,
    };
  }, [closes, indicators]);

  // Reset pan when symbol changes
  useEffect(() => {
    setRightOffset(4);
  }, [symbol.id]);

  // Measure container cleanly with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(300, Math.floor(entry.contentRect.width));
        const h = Math.max(compact ? 260 : 380, Math.floor(entry.contentRect.height));
        setSize({ width: w, height: h });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [compact]);

  const layout = useMemo(() => {
    const priceAxisW = 78;
    const timeAxisH = 26;
    const plotW = Math.max(120, size.width - priceAxisW);
    const totalH = Math.max(180, size.height - timeAxisH);

    const hasRsi = indicators.rsi && !compact;
    const hasMacd = indicators.macd && !compact;
    const subPaneCount = (hasRsi ? 1 : 0) + (hasMacd ? 1 : 0);
    const subPaneH = subPaneCount > 0 ? Math.min(105, Math.floor(totalH * 0.2)) : 0;
    const mainH = totalH - subPaneH * subPaneCount;

    const endIndex = displayCandles.length - 1 + rightOffset;
    const startIndex = endIndex - visibleCount + 1;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 1;

    const visStart = Math.max(0, Math.floor(startIndex));
    const visEnd = Math.min(displayCandles.length - 1, Math.ceil(endIndex));

    for (let i = visStart; i <= visEnd; i++) {
      const c = displayCandles[i];
      if (!c) continue;
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      minPrice = symbol.price * 0.95;
      maxPrice = symbol.price * 1.05;
    }
    const span = maxPrice - minPrice || symbol.price * 0.01;
    const padTop = span * 0.1;
    const padBot = indicators.volume ? span * 0.22 : span * 0.1;
    const paddedMin = minPrice - padBot;
    const paddedMax = maxPrice + padTop;

    const indexToX = (idx: number) => ((idx - startIndex + 0.5) / visibleCount) * plotW;
    const xToIndex = (x: number) => startIndex + (x / plotW) * visibleCount - 0.5;
    const priceToY = (p: number) => ((paddedMax - p) / (paddedMax - paddedMin)) * mainH;
    const yToPrice = (y: number) => paddedMax - (y / mainH) * (paddedMax - paddedMin);

    return {
      priceAxisW,
      timeAxisH,
      plotW,
      totalH,
      mainH,
      hasRsi,
      hasMacd,
      subPaneH,
      startIndex,
      endIndex,
      visStart,
      visEnd,
      paddedMin,
      paddedMax,
      maxVol,
      indexToX,
      xToIndex,
      priceToY,
      yToPrice,
    };
  }, [size, indicators.rsi, indicators.macd, indicators.volume, compact, displayCandles, rightOffset, visibleCount, symbol.price]);

  // Draw canvas whenever layout, data, hover, or drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = darkTheme ? '#131722' : '#FFFFFF';
    const grid = darkTheme ? '#1E222D' : '#F1F5F9';
    const border = darkTheme ? '#2A2E39' : '#E2E8F0';
    const textMuted = darkTheme ? '#787B86' : '#64748B';
    const bull = '#089981';
    const bear = '#F23645';

    // Fill background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size.width, size.height);

    const { plotW, mainH, totalH, paddedMin, paddedMax, visStart, visEnd, indexToX, priceToY, maxVol } = layout;

    // Horizontal price grid + right axis labels
    ctx.font = '11px "JetBrains Mono", monospace';
    const priceSteps = compact ? 5 : 7;
    for (let i = 1; i < priceSteps; i++) {
      const ratio = i / priceSteps;
      const y = Math.round(ratio * mainH) + 0.5;
      const priceVal = paddedMax - ratio * (paddedMax - paddedMin);
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotW, y);
      ctx.stroke();

      ctx.fillStyle = textMuted;
      ctx.fillText(formatPrice(priceVal, symbol.price), plotW + 8, y + 3.5);
    }

    // Vertical time grid + bottom axis labels
    const timeStep = Math.max(4, Math.floor(visibleCount / (compact ? 5 : 8)));
    for (let i = visStart; i <= visEnd; i++) {
      if (i % timeStep !== 0) continue;
      const c = displayCandles[i];
      if (!c) continue;
      const x = Math.round(indexToX(i)) + 0.5;
      if (x < 0 || x > plotW) continue;
      ctx.strokeStyle = grid;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, totalH);
      ctx.stroke();

      const d = new Date(c.time * 1000);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      ctx.fillStyle = textMuted;
      ctx.fillText(label, Math.max(4, x - 20), totalH + 17);
    }

    // Clip to main price plot
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, plotW, mainH);
    ctx.clip();

    // Volume histogram at bottom of main pane
    const barW = Math.max(2, (plotW / visibleCount) * 0.68);
    if (indicators.volume) {
      const volMaxH = mainH * 0.18;
      for (let i = visStart; i <= visEnd; i++) {
        const c = displayCandles[i];
        if (!c) continue;
        const x = indexToX(i);
        const h = (c.volume / maxVol) * volMaxH;
        ctx.fillStyle = c.close >= c.open ? 'rgba(8, 153, 129, 0.25)' : 'rgba(242, 54, 69, 0.25)';
        ctx.fillRect(x - barW / 2, mainH - h, barW, h);
      }
    }

    // Bollinger Bands fill + lines
    if (indicatorData.bb) {
      const { upper, middle, lower } = indicatorData.bb;
      ctx.beginPath();
      let started = false;
      for (let i = visStart; i <= visEnd; i++) {
        const u = upper[i];
        if (u === null || u === undefined) continue;
        const x = indexToX(i);
        const y = priceToY(u);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else ctx.lineTo(x, y);
      }
      for (let i = visEnd; i >= visStart; i--) {
        const l = lower[i];
        if (l === null || l === undefined) continue;
        ctx.lineTo(indexToX(i), priceToY(l));
      }
      if (started) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(41, 98, 255, 0.08)';
        ctx.fill();
      }

      const drawSeriesLine = (arr: Array<number | null>, color: string, width = 1.2) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let s = false;
        for (let i = visStart; i <= visEnd; i++) {
          const val = arr[i];
          if (val === null || val === undefined) continue;
          const x = indexToX(i);
          const y = priceToY(val);
          if (!s) {
            ctx.moveTo(x, y);
            s = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawSeriesLine(upper, 'rgba(41, 98, 255, 0.65)', 1);
      drawSeriesLine(middle, 'rgba(255, 109, 0, 0.7)', 1);
      drawSeriesLine(lower, 'rgba(41, 98, 255, 0.65)', 1);
    }

    // Main Price Series (Candles / Hollow / Line / Area)
    if (chartStyle === 'line' || chartStyle === 'area') {
      ctx.beginPath();
      let firstX = 0;
      let lastX = 0;
      let started = false;
      for (let i = visStart; i <= visEnd; i++) {
        const c = displayCandles[i];
        if (!c) continue;
        const x = indexToX(i);
        const y = priceToY(c.close);
        if (!started) {
          ctx.moveTo(x, y);
          firstX = x;
          started = true;
        } else ctx.lineTo(x, y);
        lastX = x;
      }
      ctx.strokeStyle = '#2962FF';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (chartStyle === 'area' && started) {
        ctx.lineTo(lastX, mainH);
        ctx.lineTo(firstX, mainH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, mainH);
        grad.addColorStop(0, 'rgba(41, 98, 255, 0.28)');
        grad.addColorStop(1, 'rgba(41, 98, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    } else {
      for (let i = visStart; i <= visEnd; i++) {
        const c = displayCandles[i];
        if (!c) continue;
        const x = indexToX(i);
        const up = c.close >= c.open;
        const color = up ? bull : bear;

        const yHigh = priceToY(c.high);
        const yLow = priceToY(c.low);
        const yOpen = priceToY(c.open);
        const yClose = priceToY(c.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(Math.round(x) + 0.5, yHigh);
        ctx.lineTo(Math.round(x) + 0.5, yLow);
        ctx.stroke();

        if (chartStyle === 'hollow' && up) {
          ctx.fillStyle = bg;
          ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.3;
          ctx.strokeRect(x - barW / 2, bodyTop, barW, bodyH);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - barW / 2, bodyTop, barW, bodyH);
        }
      }
    }

    // Moving average overlays
    const drawOverlay = (arr: Array<number | null> | null, color: string) => {
      if (!arr) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let s = false;
      for (let i = visStart; i <= visEnd; i++) {
        const val = arr[i];
        if (val === null || val === undefined) continue;
        const x = indexToX(i);
        const y = priceToY(val);
        if (!s) {
          ctx.moveTo(x, y);
          s = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    drawOverlay(indicatorData.ema20, '#2962FF');
    drawOverlay(indicatorData.ema50, '#FF9800');
    drawOverlay(indicatorData.sma200, '#AB47BC');

    // User drawings (Trendlines, Horizontal lines, Fib retracement, Measure box)
    const allDrawings = draftDrawing ? [...drawings, draftDrawing] : drawings;
    for (const d of allDrawings) {
      const x1 = indexToX(d.index1);
      const y1 = priceToY(d.price1);
      const x2 = indexToX(d.index2);
      const y2 = priceToY(d.price2);

      if (d.tool === 'hline') {
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.lineTo(plotW, y1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = d.color;
        ctx.fillText(formatPrice(d.price1, symbol.price), 8, y1 - 5);
      } else if (d.tool === 'trendline') {
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.tool === 'fib') {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (const lvl of levels) {
          const p = d.price1 + (d.price2 - d.price1) * lvl;
          const y = priceToY(p);
          ctx.strokeStyle = lvl === 0.618 || lvl === 0.5 ? '#F59E0B' : 'rgba(41, 98, 255, 0.75)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(minX, y);
          ctx.lineTo(Math.max(maxX, minX + 120), y);
          ctx.stroke();
          ctx.fillStyle = textMuted;
          ctx.fillText(`${(lvl * 100).toFixed(1)}% (${formatPrice(p, symbol.price)})`, minX + 4, y - 3);
        }
      } else if (d.tool === 'measure') {
        const rx = Math.min(x1, x2);
        const ry = Math.min(y1, y2);
        const rw = Math.abs(x2 - x1);
        const rh = Math.abs(y2 - y1);
        const diff = d.price2 - d.price1;
        const pct = d.price1 !== 0 ? (diff / d.price1) * 100 : 0;
        const pos = diff >= 0;
        ctx.fillStyle = pos ? 'rgba(8, 153, 129, 0.16)' : 'rgba(242, 54, 69, 0.16)';
        ctx.strokeStyle = pos ? bull : bear;
        ctx.lineWidth = 1.2;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = pos ? bull : bear;
        ctx.fillText(
          `${pos ? '+' : ''}${formatPrice(diff, symbol.price)} (${pos ? '+' : ''}${pct.toFixed(2)}%)`,
          rx + 6,
          Math.max(14, ry - 6),
        );
      }
    }

    // Current Last Price Dashed Line
    const lastCandle = displayCandles[displayCandles.length - 1];
    if (lastCandle) {
      const lastY = priceToY(lastCandle.close);
      const lastUp = lastCandle.close >= lastCandle.open;
      const lastCol = lastUp ? bull : bear;
      ctx.strokeStyle = lastCol;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(plotW, lastY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Right price badge for last price
    if (lastCandle) {
      const lastY = Math.max(10, Math.min(mainH - 10, priceToY(lastCandle.close)));
      const lastCol = lastCandle.close >= lastCandle.open ? bull : bear;
      ctx.fillStyle = lastCol;
      ctx.fillRect(plotW + 1, lastY - 9, layout.priceAxisW - 2, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(formatPrice(lastCandle.close, symbol.price), plotW + 6, lastY + 3.5);
    }

    // Sub-panes (RSI & MACD)
    let subTop = mainH;
    if (layout.hasRsi && indicatorData.rsi) {
      const paneH = layout.subPaneH;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(0, subTop + 0.5);
      ctx.lineTo(size.width, subTop + 0.5);
      ctx.stroke();

      const rsiToY = (v: number) => subTop + 12 + ((100 - v) / 100) * (paneH - 22);
      // 70 / 30 band
      ctx.fillStyle = 'rgba(126, 87, 194, 0.08)';
      ctx.fillRect(0, rsiToY(70), plotW, rsiToY(30) - rsiToY(70));
      [70, 30].forEach((lvl) => {
        const y = rsiToY(lvl);
        ctx.strokeStyle = grid;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = textMuted;
        ctx.fillText(String(lvl), plotW + 8, y + 3);
      });

      ctx.strokeStyle = '#7E57C2';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let s = false;
      for (let i = visStart; i <= visEnd; i++) {
        const v = indicatorData.rsi[i];
        if (v === null || v === undefined) continue;
        const x = indexToX(i);
        const y = rsiToY(v);
        if (!s) {
          ctx.moveTo(x, y);
          s = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const lastRsi = indicatorData.rsi[displayCandles.length - 1];
      ctx.fillStyle = '#7E57C2';
      ctx.fillText(`RSI(14) ${lastRsi ? lastRsi.toFixed(1) : '—'}`, 10, subTop + 14);
      subTop += paneH;
    }

    if (layout.hasMacd && indicatorData.macd) {
      const paneH = layout.subPaneH;
      ctx.strokeStyle = border;
      ctx.beginPath();
      ctx.moveTo(0, subTop + 0.5);
      ctx.lineTo(size.width, subTop + 0.5);
      ctx.stroke();

      const { macd, signal, histogram } = indicatorData.macd;
      let maxAbs = 0.0001;
      for (let i = visStart; i <= visEnd; i++) {
        const m = macd[i];
        const sg = signal[i];
        if (m !== null && m !== undefined) maxAbs = Math.max(maxAbs, Math.abs(m));
        if (sg !== null && sg !== undefined) maxAbs = Math.max(maxAbs, Math.abs(sg));
      }
      const midY = subTop + paneH * 0.54;
      const scaleY = (paneH * 0.36) / maxAbs;

      for (let i = visStart; i <= visEnd; i++) {
        const h = histogram[i];
        if (h === null || h === undefined) continue;
        const x = indexToX(i);
        const barH = h * scaleY;
        ctx.fillStyle = h >= 0 ? 'rgba(8, 153, 129, 0.55)' : 'rgba(242, 54, 69, 0.55)';
        ctx.fillRect(x - barW / 2, h >= 0 ? midY - barH : midY, barW, Math.abs(barH));
      }

      const drawSubLine = (arr: Array<number | null>, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let s = false;
        for (let i = visStart; i <= visEnd; i++) {
          const val = arr[i];
          if (val === null || val === undefined) continue;
          const x = indexToX(i);
          const y = midY - val * scaleY;
          if (!s) {
            ctx.moveTo(x, y);
            s = true;
          } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawSubLine(macd, '#2962FF');
      drawSubLine(signal, '#FF6D00');

      ctx.fillStyle = '#2962FF';
      ctx.fillText('MACD(12, 26, 9)', 10, subTop + 14);
    }

    // Axis separator borders
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotW + 0.5, 0);
    ctx.lineTo(plotW + 0.5, totalH);
    ctx.moveTo(0, totalH + 0.5);
    ctx.lineTo(size.width, totalH + 0.5);
    ctx.stroke();

    // Crosshair overlay
    if (hoverPos && hoverPos.x >= 0 && hoverPos.x <= plotW && hoverPos.y >= 0 && hoverPos.y <= totalH) {
      ctx.strokeStyle = darkTheme ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverPos.x, 0);
      ctx.lineTo(hoverPos.x, totalH);
      ctx.moveTo(0, hoverPos.y);
      ctx.lineTo(plotW, hoverPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (hoverPos.y <= mainH) {
        const hoverPrice = layout.yToPrice(hoverPos.y);
        ctx.fillStyle = darkTheme ? '#363A45' : '#0F172A';
        ctx.fillRect(plotW + 1, hoverPos.y - 9, layout.priceAxisW - 2, 18);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(formatPrice(hoverPrice, symbol.price), plotW + 6, hoverPos.y + 3.5);
      }
    }
  }, [size, darkTheme, layout, displayCandles, chartStyle, indicators, indicatorData, drawings, draftDrawing, hoverPos, symbol.price, visibleCount, compact]);

  const activeCandle =
    hoveredCandleIdx !== null && displayCandles[hoveredCandleIdx]
      ? displayCandles[hoveredCandleIdx]
      : displayCandles[displayCandles.length - 1];

  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x > layout.plotW || y > layout.mainH) return;

    if (activeTool === 'crosshair') {
      panStateRef.current = { startX: e.clientX, initialOffset: rightOffset };
      return;
    }

    const idx = layout.xToIndex(x);
    const price = layout.yToPrice(y);
    const color = activeTool === 'hline' ? '#F59E0B' : '#2962FF';

    if (activeTool === 'hline') {
      onAddDrawing({
        id: `drw-${Date.now()}`,
        tool: 'hline',
        index1: idx,
        price1: price,
        index2: idx + 1,
        price2: price,
        color,
      });
      return;
    }

    setDraftDrawing({
      id: `drw-${Date.now()}`,
      tool: activeTool,
      index1: idx,
      price1: price,
      index2: idx,
      price2: price,
      color,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverPos({ x, y });

    const idx = Math.round(layout.xToIndex(x));
    if (idx >= 0 && idx < displayCandles.length) {
      setHoveredCandleIdx(idx);
    }

    if (panStateRef.current) {
      const dx = e.clientX - panStateRef.current.startX;
      const barsShift = Math.round((dx / layout.plotW) * visibleCount);
      const nextOffset = Math.max(-displayCandles.length + 20, Math.min(24, panStateRef.current.initialOffset - barsShift));
      setRightOffset(nextOffset);
    } else if (draftDrawing) {
      setDraftDrawing({
        ...draftDrawing,
        index2: layout.xToIndex(x),
        price2: layout.yToPrice(Math.min(layout.mainH, Math.max(0, y))),
      });
    }
  };

  const handleMouseUp = () => {
    panStateRef.current = null;
    if (draftDrawing) {
      onAddDrawing(draftDrawing);
      setDraftDrawing(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 8 : -8;
    setVisibleCount((prev) => Math.max(24, Math.min(displayCandles.length, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      data-testid="supercharts-canvas-container"
      className={`relative w-full h-full select-none overflow-hidden ${darkTheme ? 'bg-[#131722]' : 'bg-white'}`}
    >
      {/* OHLCV Live Legend Overlay */}
      {activeCandle && (
        <div className="absolute top-2 left-3 z-10 pointer-events-none flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={`font-display font-bold ${darkTheme ? 'text-white' : 'text-slate-950'}`}>
            {symbol.name}
          </span>
          <span className={`font-mono ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
            {symbol.exchange}:{symbol.symbol}
          </span>
          <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
            <span className={darkTheme ? 'text-slate-400' : 'text-slate-500'}>
              O <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{formatPrice(activeCandle.open, symbol.price)}</span>
            </span>
            <span className={darkTheme ? 'text-slate-400' : 'text-slate-500'}>
              H <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{formatPrice(activeCandle.high, symbol.price)}</span>
            </span>
            <span className={darkTheme ? 'text-slate-400' : 'text-slate-500'}>
              L <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{formatPrice(activeCandle.low, symbol.price)}</span>
            </span>
            <span className={darkTheme ? 'text-slate-400' : 'text-slate-500'}>
              C <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{formatPrice(activeCandle.close, symbol.price)}</span>
            </span>
            <span className={darkTheme ? 'text-slate-400' : 'text-slate-500'}>
              Vol <span className={darkTheme ? 'text-slate-200' : 'text-slate-800'}>{formatVolume(activeCandle.volume)}</span>
            </span>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoverPos(null);
          panStateRef.current = null;
        }}
        onWheel={handleWheel}
        className={`block w-full h-full ${activeTool === 'crosshair' ? 'cursor-crosshair' : 'cursor-cell'}`}
      />
    </div>
  );
}
