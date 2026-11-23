import { useMemo, useState } from 'react';
import { formatPrice } from '../marketData';
import type { Candle } from '../types';

interface AreaMiniChartProps {
  candles: Candle[];
  positive: boolean;
  height?: number;
  showAxes?: boolean;
  interactive?: boolean;
  currency?: string;
}

export function AreaMiniChart({
  candles,
  positive,
  height = 240,
  showAxes = true,
  interactive = true,
  currency = 'INR',
}: AreaMiniChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 760;
  const padRight = showAxes ? 72 : 8;
  const padBottom = showAxes ? 26 : 6;
  const padTop = 14;
  const padLeft = 8;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { linePath, areaPath, minPrice, maxPrice, points } = useMemo(() => {
    if (candles.length === 0) {
      return { linePath: '', areaPath: '', minPrice: 0, maxPrice: 1, points: [] as Array<{ x: number; y: number; c: Candle }> };
    }
    const closes = candles.map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    const minPad = min - span * 0.08;
    const maxPad = max + span * 0.08;
    const totalSpan = maxPad - minPad;

    const pts = candles.map((c, idx) => {
      const x = padLeft + (idx / Math.max(1, candles.length - 1)) * plotW;
      const y = padTop + ((maxPad - c.close) / totalSpan) * plotH;
      return { x, y, c };
    });

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} Z`;

    return { linePath: line, areaPath: area, minPrice: minPad, maxPrice: maxPad, points: pts };
  }, [candles, plotW, plotH]);

  const strokeColor = positive ? '#089981' : '#F23645';
  const gradId = `area-grad-${positive ? 'pos' : 'neg'}-${height}-${candles.length}`;

  const hoveredPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto block overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          if (!interactive || points.length === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * width;
          const clamped = Math.max(padLeft, Math.min(padLeft + plotW, relX));
          const ratio = (clamped - padLeft) / plotW;
          setHoverIdx(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
        }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {showAxes && [0.2, 0.5, 0.8].map((r) => {
          const y = padTop + r * plotH;
          const priceVal = maxPrice - r * (maxPrice - minPrice);
          return (
            <g key={r}>
              <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
              <text x={padLeft + plotW + 8} y={y + 4} fontSize="11" fill="#64748B" className="font-mono">
                {formatPrice(priceVal)}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />}

        {showAxes && points.length > 5 && [0, 0.25, 0.5, 0.75, 1].map((r) => {
          const idx = Math.min(points.length - 1, Math.floor(r * (points.length - 1)));
          const pt = points[idx];
          const d = new Date(pt.c.time * 1000);
          const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          return (
            <text
              key={r}
              x={pt.x}
              y={height - 6}
              textAnchor={r === 0 ? 'start' : r === 1 ? 'end' : 'middle'}
              fontSize="11"
              fill="#64748B"
              className="font-mono"
            >
              {label}
            </text>
          );
        })}

        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              y1={padTop}
              x2={hoveredPoint.x}
              y2={padTop + plotH}
              stroke="#94A3B8"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4.5" fill={strokeColor} stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hoveredPoint && (
        <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded-md bg-slate-950/90 text-white text-xs font-mono tabular-nums pointer-events-none">
          <span>{formatPrice(hoveredPoint.c.close)} {currency}</span>
          <span className="text-slate-400 ml-2">
            {new Date(hoveredPoint.c.time * 1000).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: '2-digit',
            })}
          </span>
        </div>
      )}
    </div>
  );
}

interface YieldCurveChartProps {
  points: Array<{ tenor: string; yieldPct: number }>;
}

export function YieldCurveChart({ points }: YieldCurveChartProps) {
  const width = 360;
  const height = 138;
  const padL = 38;
  const padR = 16;
  const padT = 14;
  const padB = 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const minY = 4.0;
  const maxY = 5.6;

  const coords = points.map((p, idx) => ({
    ...p,
    x: padL + (idx / Math.max(1, points.length - 1)) * plotW,
    y: padT + ((maxY - p.yieldPct) / (maxY - minY)) * plotH,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
      {[4.5, 5.0, 5.5].map((tick) => {
        const y = padT + ((maxY - tick) / (maxY - minY)) * plotH;
        return (
          <g key={tick}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#F1F5F9" strokeWidth="1" />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill="#64748B" className="font-mono">
              {tick.toFixed(1)}%
            </text>
          </g>
        );
      })}
      <path d={pathD} fill="none" stroke="#2962FF" strokeWidth="2.2" />
      {coords.map((c) => (
        <g key={c.tenor}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="#2962FF" />
          <text x={c.x} y={height - 6} textAnchor="middle" fontSize="10" fill="#64748B" className="font-mono">
            {c.tenor}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface IdeaMiniCandlesProps {
  candles: Candle[];
  direction: 'Long' | 'Short' | 'Neutral';
}

export function IdeaMiniCandles({ candles, direction }: IdeaMiniCandlesProps) {
  const slice = candles.slice(-36);
  const width = 360;
  const height = 152;
  const padX = 12;
  const padY = 16;

  const min = Math.min(...slice.map((c) => c.low));
  const max = Math.max(...slice.map((c) => c.high));
  const span = max - min || 1;
  const step = (width - padX * 2) / Math.max(1, slice.length);

  const toY = (p: number) => padY + ((max - p) / span) * (height - padY * 2);

  // Draw a technical trendline / target projection matching the idea direction
  const startIdx = Math.floor(slice.length * 0.25);
  const endIdx = slice.length - 1;
  const x1 = padX + startIdx * step;
  const y1 = toY(direction === 'Long' ? slice[startIdx].low : slice[startIdx].high);
  const x2 = padX + endIdx * step;
  const y2 = toY(direction === 'Long' ? slice[endIdx].close : slice[endIdx].close);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block bg-[#131722]">
      {[0.25, 0.5, 0.75].map((r) => (
        <line
          key={r}
          x1="0"
          y1={r * height}
          x2={width}
          y2={r * height}
          stroke="#1E222D"
          strokeWidth="1"
        />
      ))}

      {slice.map((c, i) => {
        const x = padX + i * step + step * 0.5;
        const up = c.close >= c.open;
        const color = up ? '#089981' : '#F23645';
        const top = toY(Math.max(c.open, c.close));
        const bot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(1.5, bot - top);
        return (
          <g key={c.time}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1.2" />
            <rect x={x - step * 0.3} y={top} width={Math.max(2, step * 0.6)} height={bodyH} fill={color} />
          </g>
        );
      })}

      {/* Technical setup trendline */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={direction === 'Short' ? '#F23645' : '#2962FF'}
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />
    </svg>
  );
}
