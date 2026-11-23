import {
  Activity,
  BarChart2,
  Bell,
  Code2,
  Columns2,
  Crosshair,
  GitCommitHorizontal,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  Ruler,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PINE_TEMPLATES, runPineStrategyBacktest, type PineStrategyId } from '../backtest';
import { computeTechnicalRating } from '../indicators';
import { applyLiveTick, formatPrice, generateCandles, getSymbolById } from '../marketData';
import type {
  Candle,
  ChartDrawing,
  ChartStyle,
  DrawingTool,
  IndicatorConfig,
  MarketSymbol,
  PaperPosition,
  PriceAlert,
  Timeframe,
} from '../types';
import { CandlestickCanvas } from './CandlestickCanvas';

interface SuperchartsViewProps {
  symbols: MarketSymbol[];
  activeSymbolId: string;
  onSelectSymbol: (id: string) => void;
  onOpenSearch: () => void;
  watchlistIds: string[];
  onRemoveFromWatchlist: (id: string) => void;
  paperCash: number;
  positions: PaperPosition[];
  onPlacePaperOrder: (symbolId: string, side: 'BUY' | 'SELL', qty: number, price: number) => void;
  onClosePosition: (positionId: string, currentPrice: number) => void;
  alerts: PriceAlert[];
  onAddAlert: (symbolId: string, symbol: string, targetPrice: number, condition: 'above' | 'below') => void;
  onRemoveAlert: (alertId: string) => void;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];

const CHART_STYLES: Array<{ id: ChartStyle; label: string }> = [
  { id: 'candles', label: 'Candles' },
  { id: 'hollow', label: 'Hollow' },
  { id: 'heikin', label: 'Heikin Ashi' },
  { id: 'line', label: 'Line' },
  { id: 'area', label: 'Area' },
];

export function SuperchartsView({
  symbols,
  activeSymbolId,
  onSelectSymbol,
  onOpenSearch,
  watchlistIds,
  onRemoveFromWatchlist,
  paperCash,
  positions,
  onPlacePaperOrder,
  onClosePosition,
  alerts,
  onAddAlert,
  onRemoveAlert,
}: SuperchartsViewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('candles');
  const [darkTheme, setDarkTheme] = useState(true);
  const [splitLayout, setSplitLayout] = useState(false);
  const [compareSymbolId, setCompareSymbolId] = useState('BSE:SENSEX');
  const [liveStream, setLiveStream] = useState(true);

  const [indicators, setIndicators] = useState<IndicatorConfig>({
    ema20: true,
    ema50: true,
    sma200: false,
    bollinger: false,
    volume: true,
    rsi: true,
    macd: false,
  });
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  const [activeTool, setActiveTool] = useState<DrawingTool>('crosshair');
  const [drawingsBySymbol, setDrawingsBySymbol] = useState<Record<string, ChartDrawing[]>>({});
  const [rightTab, setRightTab] = useState<'watchlist' | 'trade' | 'technicals'>('watchlist');

  const [orderQty, setOrderQty] = useState('10');
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [bottomPanel, setBottomPanel] = useState<'closed' | 'pine' | 'tester' | 'alerts'>('closed');
  const [selectedStrategy, setSelectedStrategy] = useState<PineStrategyId>('ema_cross');
  const [pineCode, setPineCode] = useState<string>(PINE_TEMPLATES[0].code);

  const activeSymbol = useMemo(
    () => symbols.find((s) => s.id === activeSymbolId) ?? getSymbolById(activeSymbolId),
    [symbols, activeSymbolId],
  );
  const compareSymbol = useMemo(
    () => symbols.find((s) => s.id === compareSymbolId) ?? getSymbolById(compareSymbolId),
    [symbols, compareSymbolId],
  );

  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(activeSymbol, timeframe, 160));
  const [compareCandles, setCompareCandles] = useState<Candle[]>(() =>
    generateCandles(compareSymbol, timeframe, 120),
  );

  // Regenerate series when symbol or timeframe changes
  useEffect(() => {
    setCandles(generateCandles(activeSymbol, timeframe, 160));
  }, [activeSymbol.id, timeframe]);

  useEffect(() => {
    setCompareCandles(generateCandles(compareSymbol, timeframe, 120));
  }, [compareSymbol.id, timeframe]);

  // Simulated real-time candle tick stream
  useEffect(() => {
    if (!liveStream) return;
    const timer = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        copy[copy.length - 1] = applyLiveTick(copy[copy.length - 1], activeSymbol);
        return copy;
      });
    }, 1800);
    return () => clearInterval(timer);
  }, [liveStream, activeSymbol]);

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : activeSymbol.price;
  const technicalRating = useMemo(() => computeTechnicalRating(candles), [candles]);
  const symbolDrawings = drawingsBySymbol[activeSymbol.id] ?? [];

  const handleAddDrawing = (drawing: ChartDrawing) => {
    setDrawingsBySymbol((prev) => ({
      ...prev,
      [activeSymbol.id]: [...(prev[activeSymbol.id] ?? []), drawing],
    }));
    setActiveTool('crosshair');
  };

  const handleClearDrawings = () => {
    setDrawingsBySymbol((prev) => ({
      ...prev,
      [activeSymbol.id]: [],
    }));
  };

  const handleTriggerAlert = () => {
    const target = Number((currentPrice * 1.005).toFixed(2));
    onAddAlert(activeSymbol.id, activeSymbol.symbol, target, 'above');
    setAlertNotice(`Price alert saved on ${activeSymbol.symbol} above ${formatPrice(target)} ${activeSymbol.currency}`);
    setBottomPanel('alerts');
    setTimeout(() => setAlertNotice(null), 3200);
  };

  const backtestReport = useMemo(
    () => runPineStrategyBacktest(candles, selectedStrategy, 1_000_000),
    [candles, selectedStrategy],
  );

  const handleSelectPineTemplate = (id: PineStrategyId) => {
    setSelectedStrategy(id);
    const tpl = PINE_TEMPLATES.find((t) => t.id === id);
    if (tpl) setPineCode(tpl.code);
  };

  const handleOrder = (side: 'BUY' | 'SELL') => {
    const qty = Math.max(1, Math.floor(Number(orderQty) || 0));
    onPlacePaperOrder(activeSymbol.id, side, qty, currentPrice);
    setAlertNotice(`${side} ${qty} ${activeSymbol.symbol} @ ${formatPrice(currentPrice)} executed in Paper Trading`);
    setTimeout(() => setAlertNotice(null), 3200);
  };

  const toggleIndicator = (key: keyof IndicatorConfig) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const shellBg = darkTheme ? 'bg-[#131722] text-slate-100' : 'bg-white text-slate-900';
  const borderCol = darkTheme ? 'border-[#2A2E39]' : 'border-slate-200';
  const panelBg = darkTheme ? 'bg-[#131722]' : 'bg-white';
  const hoverBg = darkTheme ? 'hover:bg-[#2A2E39]' : 'hover:bg-slate-100';

  const watchlistSymbols = useMemo(
    () => watchlistIds.map((id) => symbols.find((s) => s.id === id) ?? getSymbolById(id)),
    [watchlistIds, symbols],
  );

  const ratingColor =
    technicalRating.label.includes('Buy')
      ? 'text-emerald-500'
      : technicalRating.label.includes('Sell')
        ? 'text-red-500'
        : 'text-slate-400';

  return (
    <div className={`h-[calc(100vh-56px)] flex flex-col overflow-hidden ${shellBg}`}>
      {/* TOP SUPERCHARTS TOOLBAR */}
      <div className={`h-11 px-2 border-b ${borderCol} flex items-center justify-between gap-2 overflow-x-auto shrink-0`}>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Symbol Trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-bold font-mono transition-colors whitespace-nowrap ${hoverBg}`}
            aria-label={`Change chart symbol (currently ${activeSymbol.symbol})`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{activeSymbol.symbol}</span>
            <span className="text-[10px] font-normal text-slate-400">{activeSymbol.exchange}</span>
          </button>

          <div className={`h-5 w-px ${darkTheme ? 'bg-[#2A2E39]' : 'bg-slate-200'}`} />

          {/* Timeframes */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Chart timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'text-[#2962FF] bg-[#2962FF]/15 font-bold'
                    : `${darkTheme ? 'text-slate-300' : 'text-slate-600'} ${hoverBg}`
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className={`h-5 w-px ${darkTheme ? 'bg-[#2A2E39]' : 'bg-slate-200'}`} />

          {/* Chart Style Select */}
          <label htmlFor="tv-chart-style" className="sr-only">
            Chart style
          </label>
          <select
            id="tv-chart-style"
            value={chartStyle}
            onChange={(e) => setChartStyle(e.target.value as ChartStyle)}
            className={`h-7 px-2 rounded text-xs font-medium bg-transparent border ${borderCol} focus:outline-none focus:border-blue-500`}
          >
            {CHART_STYLES.map((st) => (
              <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                {st.label}
              </option>
            ))}
          </select>

          <div className={`h-5 w-px ${darkTheme ? 'bg-[#2A2E39]' : 'bg-slate-200'}`} />

          {/* Indicators Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIndicatorsOpen((v) => !v)}
              aria-expanded={indicatorsOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                indicatorsOpen ? 'bg-[#2962FF] text-white' : hoverBg
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Indicators</span>
            </button>
          </div>

          {/* Alert Trigger */}
          <button
            type="button"
            onClick={handleTriggerAlert}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${hoverBg}`}
          >
            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Alert</span>
          </button>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setLiveStream((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${hoverBg}`}
            aria-label={liveStream ? 'Pause live ticks' : 'Resume live ticks'}
          >
            {liveStream ? <Pause className="w-3.5 h-3.5 text-emerald-500" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{liveStream ? 'Live' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSplitLayout((v) => !v)}
            aria-pressed={splitLayout}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
              splitLayout ? 'bg-[#2962FF]/20 text-[#2962FF]' : hoverBg
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            type="button"
            onClick={() => setDarkTheme((v) => !v)}
            aria-label={darkTheme ? 'Switch to light chart theme' : 'Switch to dark chart theme'}
            className={`p-1.5 rounded ${hoverBg}`}
          >
            {darkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Indicators Dropdown Strip (clean, non-overlapping) */}
      {indicatorsOpen && (
        <div className={`px-4 py-2.5 border-b ${borderCol} flex flex-wrap items-center justify-between gap-3 text-xs ${darkTheme ? 'bg-[#1E222D]' : 'bg-slate-50'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-400">Active Studies:</span>
            {(
              [
                { key: 'ema20', label: 'EMA 20', color: '#2962FF' },
                { key: 'ema50', label: 'EMA 50', color: '#FF9800' },
                { key: 'sma200', label: 'SMA 200', color: '#AB47BC' },
                { key: 'bollinger', label: 'Bollinger Bands (20, 2)', color: '#2962FF' },
                { key: 'volume', label: 'Volume', color: '#089981' },
                { key: 'rsi', label: 'RSI (14)', color: '#7E57C2' },
                { key: 'macd', label: 'MACD (12, 26, 9)', color: '#2962FF' },
              ] as const
            ).map((ind) => (
              <label key={ind.key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={indicators[ind.key]}
                  onChange={() => toggleIndicator(ind.key)}
                  className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">{ind.label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndicatorsOpen(false)}
            aria-label="Close indicators bar"
            className="p-1 rounded hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alert Notice Toast Banner */}
      {alertNotice && (
        <div role="status" className="px-4 py-2 bg-[#2962FF] text-white text-xs font-medium flex items-center justify-between">
          <span>{alertNotice}</span>
          <button type="button" onClick={() => setAlertNotice(null)} aria-label="Dismiss notification">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MAIN TERMINAL BODY: Left Drawing Toolbar + Center Canvas(es) + Right Dock */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT DRAWING TOOLBAR */}
        <aside
          aria-label="Chart drawing tools"
          className={`w-11 border-r ${borderCol} ${panelBg} py-2 flex flex-col items-center gap-1.5 shrink-0`}
        >
          {(
            [
              { id: 'crosshair', label: 'Crosshair & Pan', icon: <Crosshair className="w-4 h-4" /> },
              { id: 'trendline', label: 'Trend Line (drag on chart)', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'hline', label: 'Horizontal Support/Resistance Ray', icon: <Minus className="w-4 h-4" /> },
              { id: 'fib', label: 'Fibonacci Retracement (drag)', icon: <GitCommitHorizontal className="w-4 h-4" /> },
              { id: 'measure', label: 'Price Range Measure (drag)', icon: <Ruler className="w-4 h-4" /> },
            ] as const
          ).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={activeTool === tool.id}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                activeTool === tool.id
                  ? 'bg-[#2962FF] text-white'
                  : `${darkTheme ? 'text-slate-400' : 'text-slate-600'} ${hoverBg}`
              }`}
            >
              {tool.icon}
            </button>
          ))}

          <div className={`w-6 h-px my-1 ${darkTheme ? 'bg-[#2A2E39]' : 'bg-slate-200'}`} />

          <button
            type="button"
            onClick={handleClearDrawings}
            disabled={symbolDrawings.length === 0}
            title="Remove all drawings"
            aria-label="Remove all drawings"
            className={`w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-35 ${
              darkTheme ? 'text-slate-400' : 'text-slate-600'
            } ${hoverBg}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </aside>

        {/* CENTER CHART AREA */}
        <div className={`flex-1 min-w-0 grid ${splitLayout ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'} divide-y xl:divide-y-0 xl:divide-x ${borderCol}`}>
          <div className="min-h-0 h-full">
            <CandlestickCanvas
              symbol={activeSymbol}
              candles={candles}
              chartStyle={chartStyle}
              indicators={indicators}
              activeTool={activeTool}
              drawings={symbolDrawings}
              onAddDrawing={handleAddDrawing}
              darkTheme={darkTheme}
            />
          </div>

          {splitLayout && (
            <div className="min-h-0 h-full flex flex-col">
              <div className={`h-8 px-3 border-b ${borderCol} flex items-center justify-between text-xs shrink-0`}>
                <span className="font-mono font-semibold">Compare Pane</span>
                <label htmlFor="compare-symbol-select" className="sr-only">
                  Comparison symbol
                </label>
                <select
                  id="compare-symbol-select"
                  value={compareSymbolId}
                  onChange={(e) => setCompareSymbolId(e.target.value)}
                  className="bg-transparent font-mono text-xs focus:outline-none"
                >
                  {symbols.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.exchange}:{s.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-h-0">
                <CandlestickCanvas
                  symbol={compareSymbol}
                  candles={compareCandles}
                  chartStyle={chartStyle}
                  indicators={{ ...indicators, rsi: false, macd: false }}
                  activeTool="crosshair"
                  drawings={[]}
                  onAddDrawing={() => {}}
                  darkTheme={darkTheme}
                  compact
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT DOCKED PANEL: Watchlist / Paper Trade / Technicals */}
        <aside className={`hidden lg:flex w-[308px] border-l ${borderCol} ${panelBg} flex-col shrink-0 overflow-hidden`}>
          {/* Dock Tabs */}
          <div className={`px-1.5 py-1.5 border-b ${borderCol} grid grid-cols-3 gap-1 shrink-0`} role="tablist" aria-label="Right sidebar panels">
            {(
              [
                { id: 'watchlist', label: 'Watchlist', aria: 'Watchlist', icon: <BarChart2 className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'trade', label: 'Paper', aria: 'Paper Trade', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
                { id: 'technicals', label: 'Technicals', aria: 'Technicals', icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" /> },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-label={t.aria}
                aria-selected={rightTab === t.id}
                onClick={() => setRightTab(t.id)}
                className={`py-1.5 px-1.5 rounded text-[11px] font-medium inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap min-w-0 ${
                  rightTab === t.id
                    ? 'bg-[#2962FF] text-white'
                    : `${darkTheme ? 'text-slate-400' : 'text-slate-600'} ${hoverBg}`
                }`}
              >
                {t.icon}
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>

          {/* WATCHLIST PANEL */}
          {rightTab === 'watchlist' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`px-3 py-2 border-b ${borderCol} flex items-center justify-between text-xs`}>
                <span className="font-semibold">India &amp; Global Watchlist</span>
                <button
                  type="button"
                  onClick={onOpenSearch}
                  aria-label="Add symbol to watchlist"
                  className={`p-1 rounded ${hoverBg}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-transparent">
                <span className="col-span-5">Symbol</span>
                <span className="col-span-4 text-right">Last</span>
                <span className="col-span-3 text-right">Chg%</span>
              </div>

              <ul className="flex-1 overflow-y-auto divide-y divide-white/5">
                {watchlistSymbols.map((item) => {
                  const isPos = item.changePercent >= 0;
                  const isActive = item.id === activeSymbol.id;
                  return (
                    <li
                      key={item.id}
                      className={`group flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? darkTheme
                            ? 'bg-[#2962FF]/20'
                            : 'bg-blue-50'
                          : hoverBg
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSymbol(item.id)}
                        className="flex-1 grid grid-cols-12 items-center text-left min-w-0"
                      >
                        <div className="col-span-5 min-w-0 pr-1">
                          <div className="font-mono font-bold truncate">{item.symbol}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.exchange}</div>
                        </div>
                        <div className="col-span-4 text-right font-mono tabular-nums font-medium">
                          {formatPrice(item.id === activeSymbol.id ? currentPrice : item.price)}
                        </div>
                        <div
                          className={`col-span-3 text-right font-mono tabular-nums font-semibold ${
                            isPos ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {isPos ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </div>
                      </button>
                      {watchlistSymbols.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveFromWatchlist(item.id)}
                          aria-label={`Remove ${item.symbol} from watchlist`}
                          className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* PAPER TRADING PANEL */}
          {rightTab === 'trade' && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
              <div className={`p-3 rounded-lg border ${borderCol} space-y-1`}>
                <div className="text-slate-400">Paper Account Balance</div>
                <div className="font-mono text-lg font-bold tabular-nums">
                  ₹{paperCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono">{activeSymbol.exchange}:{activeSymbol.symbol}</span>
                  <span className="font-mono tabular-nums font-semibold">
                    {formatPrice(currentPrice)} {activeSymbol.currency}
                  </span>
                </div>

                <div>
                  <label htmlFor="paper-qty-input" className="block text-[11px] text-slate-400 mb-1">
                    Quantity (Units / Shares)
                  </label>
                  <input
                    id="paper-qty-input"
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    className={`w-full h-9 px-3 rounded border ${borderCol} bg-transparent font-mono text-sm focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOrder('BUY')}
                    className="py-2.5 rounded-md bg-[#089981] hover:bg-emerald-600 text-white font-bold transition-colors"
                  >
                    Buy Market
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrder('SELL')}
                    className="py-2.5 rounded-md bg-[#F23645] hover:bg-red-600 text-white font-bold transition-colors"
                  >
                    Sell Market
                  </button>
                </div>
              </div>

              <div className={`pt-3 border-t ${borderCol} space-y-2`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>Open Positions</span>
                  <span className="font-mono text-slate-400">{positions.length}</span>
                </div>
                {positions.length === 0 ? (
                  <p className="text-slate-400 leading-relaxed">
                    No open paper trades yet. Place a Buy or Sell order above to track live unrealized P&amp;L.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {positions.map((pos) => {
                      const sym = symbols.find((s) => s.id === pos.symbolId) ?? getSymbolById(pos.symbolId);
                      const mark = pos.symbolId === activeSymbol.id ? currentPrice : sym.price;
                      const pnl = (mark - pos.entryPrice) * pos.qty * (pos.side === 'BUY' ? 1 : -1);
                      return (
                        <li key={pos.id} className={`p-2.5 rounded border ${borderCol} space-y-1`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold">
                              <span className={pos.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}>{pos.side}</span>{' '}
                              {pos.qty} {pos.symbol}
                            </span>
                            <button
                              type="button"
                              onClick={() => onClosePosition(pos.id, mark)}
                              className="text-[11px] text-blue-500 hover:underline"
                            >
                              Close
                            </button>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                            <span className="text-slate-400">Entry {formatPrice(pos.entryPrice)}</span>
                            <span className={pnl >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                              {pnl >= 0 ? '+' : ''}
                              {pnl.toFixed(2)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TECHNICAL ANALYSIS GAUGE PANEL */}
          {rightTab === 'technicals' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              <div className="text-center space-y-2">
                <div className="text-slate-400 font-medium">Technical Summary ({timeframe})</div>
                {/* Semicircular Gauge */}
                <svg viewBox="0 0 200 112" className="w-48 mx-auto block">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={darkTheme ? '#2A2E39' : '#E2E8F0'} strokeWidth="10" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 65 28" fill="none" stroke="#F23645" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 135 28 A 80 80 0 0 1 180 100" fill="none" stroke="#089981" strokeWidth="10" strokeLinecap="round" />
                  {/* Needle rotated by score [-1, +1] */}
                  <g transform={`rotate(${technicalRating.score * 78} 100 100)`}>
                    <line x1="100" y1="100" x2="100" y2="30" stroke={darkTheme ? '#FFFFFF' : '#0F172A'} strokeWidth="3" strokeLinecap="round" />
                    <circle cx="100" cy="100" r="6" fill={darkTheme ? '#FFFFFF' : '#0F172A'} />
                  </g>
                </svg>
                <div className={`font-display text-lg font-bold ${ratingColor}`}>
                  {technicalRating.label}
                </div>
              </div>

              <div className="grid grid-cols-3 text-center font-mono tabular-nums py-2 border-y border-white/10">
                <div>
                  <div className="text-red-500 font-bold text-sm">{technicalRating.sellSignals}</div>
                  <div className="text-[11px] text-slate-400">Sell</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold text-sm">{technicalRating.neutralSignals}</div>
                  <div className="text-[11px] text-slate-400">Neutral</div>
                </div>
                <div>
                  <div className="text-emerald-500 font-bold text-sm">{technicalRating.buySignals}</div>
                  <div className="text-[11px] text-slate-400">Buy</div>
                </div>
              </div>

              <dl className="space-y-2.5 font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">RSI (14)</dt>
                  <dd className="font-semibold">{technicalRating.rsiValue.toFixed(1)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">52W High</dt>
                  <dd className="font-semibold">{formatPrice(activeSymbol.high52w)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">52W Low</dt>
                  <dd className="font-semibold">{formatPrice(activeSymbol.low52w)}</dd>
                </div>
                {activeSymbol.peRatio && (
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-400">P/E Ratio</dt>
                    <dd className="font-semibold">{activeSymbol.peRatio.toFixed(1)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </aside>
      </div>

      {/* BOTTOM BAR: Pine Script Editor / Strategy Tester / Price Alerts (matching real TradingView) */}
      <div className={`border-t ${borderCol} ${panelBg} shrink-0`}>
        <div className="h-9 px-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1" role="tablist" aria-label="Supercharts bottom panels">
            <button
              type="button"
              role="tab"
              aria-selected={bottomPanel === 'pine'}
              onClick={() => setBottomPanel((p) => (p === 'pine' ? 'closed' : 'pine'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                bottomPanel === 'pine' ? 'bg-[#2962FF] text-white' : hoverBg
              }`}
            >
              <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Pine Editor</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bottomPanel === 'tester'}
              onClick={() => setBottomPanel((p) => (p === 'tester' ? 'closed' : 'tester'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                bottomPanel === 'tester' ? 'bg-[#2962FF] text-white' : hoverBg
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Strategy Tester</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={bottomPanel === 'alerts'}
              onClick={() => setBottomPanel((p) => (p === 'alerts' ? 'closed' : 'alerts'))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                bottomPanel === 'alerts' ? 'bg-[#2962FF] text-white' : hoverBg
              }`}
            >
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Alerts ({alerts.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>{activeSymbol.exchange}:{activeSymbol.symbol}</span>
            <span>IST (UTC+5:30)</span>
          </div>
        </div>

        {bottomPanel === 'pine' && (
          <div className={`h-52 border-t ${borderCol} p-3 flex flex-col gap-2 text-xs`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-400 mr-1">Pine Script® v5:</span>
                {PINE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectPineTemplate(tpl.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      selectedStrategy === tpl.id
                        ? 'bg-[#2962FF]/20 text-[#2962FF] font-semibold'
                        : hoverBg
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStrategy === 'bb_breakout') {
                      setIndicators((prev) => ({ ...prev, bollinger: true }));
                    } else if (selectedStrategy === 'rsi_reversion') {
                      setIndicators((prev) => ({ ...prev, rsi: true }));
                    } else {
                      setIndicators((prev) => ({ ...prev, ema20: true, ema50: true }));
                    }
                    setBottomPanel('tester');
                  }}
                  className="px-3 py-1 rounded bg-[#2962FF] text-white font-semibold hover:bg-blue-600"
                >
                  Run Backtest
                </button>
                <button type="button" onClick={() => setBottomPanel('closed')} aria-label="Close bottom drawer" className="p-1 rounded hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <label htmlFor="pine-editor-textarea" className="sr-only">
              Pine Script source code
            </label>
            <textarea
              id="pine-editor-textarea"
              value={pineCode}
              onChange={(e) => setPineCode(e.target.value)}
              spellCheck={false}
              className={`flex-1 w-full rounded border ${borderCol} p-2.5 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-blue-500 ${
                darkTheme ? 'bg-[#0B0E14] text-emerald-300' : 'bg-slate-50 text-slate-900'
              }`}
            />
          </div>
        )}

        {bottomPanel === 'tester' && (
          <div className={`h-52 border-t ${borderCol} p-3.5 overflow-y-auto space-y-3 text-xs`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-display font-bold text-sm">{backtestReport.strategyName}</span>
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  {activeSymbol.exchange}:{activeSymbol.symbol} · {timeframe} · ₹10,00,000 capital
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBottomPanel('pine')}
                  className={`px-2.5 py-1 rounded border ${borderCol} text-[11px] font-medium ${hoverBg}`}
                >
                  Edit Pine Script
                </button>
                <button type="button" onClick={() => setBottomPanel('closed')} aria-label="Close strategy tester" className="p-1 rounded hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono tabular-nums">
              <div className={`p-2.5 rounded-lg border ${borderCol}`}>
                <div className="text-[10px] text-slate-400 font-sans">Net Profit</div>
                <div className={`text-sm font-bold mt-0.5 ${backtestReport.netProfitPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {backtestReport.netProfitPct >= 0 ? '+' : ''}
                  {backtestReport.netProfitPct.toFixed(2)}%
                </div>
              </div>
              <div className={`p-2.5 rounded-lg border ${borderCol}`}>
                <div className="text-[10px] text-slate-400 font-sans">Total Trades</div>
                <div className="text-sm font-bold mt-0.5">{backtestReport.totalTrades}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${borderCol}`}>
                <div className="text-[10px] text-slate-400 font-sans">Percent Profitable</div>
                <div className="text-sm font-bold mt-0.5">{backtestReport.winRatePct.toFixed(1)}%</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${borderCol}`}>
                <div className="text-[10px] text-slate-400 font-sans">Profit Factor</div>
                <div className="text-sm font-bold mt-0.5">{backtestReport.profitFactor.toFixed(2)}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${borderCol}`}>
                <div className="text-[10px] text-slate-400 font-sans">Max Drawdown</div>
                <div className="text-sm font-bold text-amber-500 mt-0.5">{backtestReport.maxDrawdownPct.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        {bottomPanel === 'alerts' && (
          <div className={`h-44 border-t ${borderCol} p-3.5 overflow-y-auto space-y-2.5 text-xs`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Active Price Alerts (Saved Locally)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerAlert}
                  className="px-2.5 py-1 rounded bg-[#2962FF] text-white text-[11px] font-semibold hover:bg-blue-600"
                >
                  + Alert on {activeSymbol.symbol}
                </button>
                <button type="button" onClick={() => setBottomPanel('closed')} aria-label="Close alerts panel" className="p-1 rounded hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {alerts.length === 0 ? (
              <p className="text-slate-400">No active alerts yet. Click &ldquo;+ Alert&rdquo; above to create a persistent price watch.</p>
            ) : (
              <ul className="space-y-1.5 font-mono">
                {alerts.map((al) => (
                  <li key={al.id} className={`px-3 py-2 rounded border ${borderCol} flex items-center justify-between gap-3`}>
                    <span>
                      <strong>{al.symbol}</strong> crossing {al.condition} <strong>{formatPrice(al.targetPrice)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveAlert(al.id)}
                      aria-label={`Remove alert for ${al.symbol}`}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
