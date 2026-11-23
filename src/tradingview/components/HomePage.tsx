import { ArrowRight, ChevronDown, ChevronRight, Heart, MessageSquare, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ECONOMIC_EVENTS, FEATURED_IPOS, MARKET_NEWS } from '../extraData';
import {
  BROKERS,
  CORPORATE_BONDS,
  US_YIELD_CURVE,
  formatPrice,
  formatVolume,
  generateCandles,
  getSymbolById,
} from '../marketData';
import type { AppView, CommunityIdea, MarketSymbol, Timeframe } from '../types';
import { CandlestickCanvas } from './CandlestickCanvas';
import { AreaMiniChart, IdeaMiniCandles, YieldCurveChart } from './MiniChart';
import { TradingViewLogo } from './Navbar';

const HERO_EARTH_IMAGE = '/src/assets/images/hero_earth_markets_1795308620827.jpg';

interface HomePageProps {
  symbols: MarketSymbol[];
  ideas: CommunityIdea[];
  likedIdeaIds: Set<string>;
  onToggleLikeIdea: (id: string) => void;
  onOpenSymbolChart: (symbolId: string) => void;
  onNavigate: (view: AppView) => void;
}

export function HomePage({
  symbols,
  ideas,
  likedIdeaIds,
  onToggleLikeIdea,
  onOpenSymbolChart,
  onNavigate,
}: HomePageProps) {
  const [featuredIndexId, setFeaturedIndexId] = useState('NSE:NIFTY');
  const [indexRange, setIndexRange] = useState<Timeframe>('1D');
  const [stockTab, setStockTab] = useState<'active' | 'gainers' | 'losers'>('active');
  const [ideaTab, setIdeaTab] = useState<'editors' | 'popular'>('editors');

  const symbolMap = useMemo(() => {
    const map = new Map<string, MarketSymbol>();
    for (const s of symbols) map.set(s.id, s);
    return map;
  }, [symbols]);

  const getLive = (id: string) => symbolMap.get(id) ?? getSymbolById(id);

  const featuredIndex = getLive(featuredIndexId);
  const featuredIndexCandles = useMemo(
    () => generateCandles(featuredIndex, indexRange, 64),
    [featuredIndex, indexRange],
  );

  const superchartsPreviewSym = getLive('NSE:NIFTY');
  const superchartsPreviewCandles = useMemo(
    () => generateCandles(superchartsPreviewSym, '15m', 96),
    [superchartsPreviewSym],
  );

  const superchartsRightSym = getLive('BITSTAMP:BTCUSD');
  const superchartsRightCandles = useMemo(
    () => generateCandles(superchartsRightSym, '15m', 96),
    [superchartsRightSym],
  );

  const majorIndices = ['BSE:SENSEX', 'SP:SPX', 'NASDAQ:NDX', 'TVC:NI225', 'SSE:000001', 'FTSE:UKX'].map(getLive);
  const cryptoTotal = getLive('CRYPTOCAP:TOTAL');
  const cryptoTotalCandles = useMemo(() => generateCandles(cryptoTotal, '1D', 35), [cryptoTotal]);
  const btc = getLive('BITSTAMP:BTCUSD');
  const eth = getLive('BITSTAMP:ETHUSD');

  const usdinr = getLive('FX_IDC:USDINR');
  const usdinrCandles = useMemo(() => generateCandles(usdinr, '1D', 35), [usdinr]);
  const futuresList = ['NYMEX:CL1!', 'NYMEX:NG1!', 'COMEX:GC1!', 'COMEX:HG1!'].map(getLive);

  const indianStocks = useMemo(() => {
    const list = symbols.filter((s) => s.assetClass === 'india_stock');
    if (stockTab === 'gainers') return [...list].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);
    if (stockTab === 'losers') return [...list].sort((a, b) => a.changePercent - b.changePercent).slice(0, 6);
    return [...list].sort((a, b) => b.volume - a.volume).slice(0, 6);
  }, [symbols, stockTab]);

  const displayedIdeas = useMemo(() => {
    if (ideaTab === 'popular') return [...ideas].sort((a, b) => b.likes - a.likes).slice(0, 6);
    return ideas.slice(0, 6);
  }, [ideas, ideaTab]);

  return (
    <div className="bg-black text-white">
      {/* SECTION 1: HERO (Pure Black + Earth Sunrise Horizon matching in.tradingview.com) */}
      <section className="relative min-h-[760px] flex flex-col items-center justify-start pt-20 pb-12 overflow-hidden bg-black">
        <img
          src={HERO_EARTH_IMAGE}
          alt="Earth horizon from orbit glowing with city lights and financial market waves"
          referrerPolicy="no-referrer"
          className="absolute inset-x-0 bottom-0 w-full h-[640px] object-cover object-bottom pointer-events-none select-none opacity-95"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black via-black/45 to-transparent pointer-events-none"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <h1 className="font-display text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight leading-[1.05] text-white text-balance">
            Where the world does markets
          </h1>
          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto font-normal">
            Join 100 million traders and investors taking the future into their own hands.
          </p>

          <div className="pt-2 flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenSymbolChart('NSE:NIFTY')}
              className="tv-cta-btn px-9 py-4 bg-white text-slate-950 font-display font-bold text-base rounded-l-xl hover:bg-slate-100 transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              Get started for free
            </button>
            <span className="text-xs text-white/60">
              $0 forever, no credit card needed
            </span>
          </div>
        </div>

        <a
          href="#supercharts-preview"
          aria-label="Scroll to Supercharged Supercharts"
          className="relative z-10 mt-auto pt-44 text-white/60 hover:text-white transition-colors"
        >
          <ChevronDown className="w-7 h-7" />
        </a>
      </section>

      {/* SECTION 2: SUPERCHARGED SUPERCHARTS INTERACTIVE SHOWCASE */}
      <section id="supercharts-preview" className="bg-black pt-10 pb-20 px-4 lg:px-8">
        <div className="max-w-[1220px] mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
              Supercharged
              <br />
              Supercharts
            </h2>
          </div>

          {/* Interactive Dark Multi-Chart Showcase Window */}
          <div className="relative rounded-2xl border border-white/15 bg-[#131722] overflow-hidden shadow-2xl">
            <div className="h-10 px-4 border-b border-[#2A2E39] bg-[#131722] flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-4 font-mono">
                <span className="font-bold text-white">NSE:NIFTY</span>
                <span className="text-slate-400">15m</span>
                <span className="hidden sm:inline text-blue-400">EMA 20 · EMA 50 · BB(20,2)</span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span className="hidden md:inline text-white font-semibold">BITSTAMP:BTCUSD</span>
                <button
                  type="button"
                  onClick={() => onOpenSymbolChart('NSE:NIFTY')}
                  className="px-3 py-1 rounded bg-[#2962FF] text-white font-sans font-semibold text-xs hover:bg-blue-600 transition-colors"
                >
                  Open Full Terminal
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#2A2E39] h-[390px]">
              <div className="h-full">
                <CandlestickCanvas
                  symbol={superchartsPreviewSym}
                  candles={superchartsPreviewCandles}
                  chartStyle="candles"
                  indicators={{ ema20: true, ema50: true, sma200: false, bollinger: true, volume: true, rsi: false, macd: false }}
                  activeTool="crosshair"
                  drawings={[]}
                  onAddDrawing={() => {}}
                  darkTheme
                  compact
                />
              </div>
              <div className="hidden lg:block h-full">
                <CandlestickCanvas
                  symbol={superchartsRightSym}
                  candles={superchartsRightCandles}
                  chartStyle="candles"
                  indicators={{ ema20: true, ema50: false, sma200: false, bollinger: false, volume: true, rsi: false, macd: false }}
                  activeTool="crosshair"
                  drawings={[]}
                  onAddDrawing={() => {}}
                  darkTheme
                  compact
                />
              </div>
            </div>

            <div className="py-4 px-5 bg-[#0B0E14] border-t border-[#2A2E39] flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Real-time canvas candlesticks, 7 technical indicators, trendlines, Fibonacci retracements, split-screen layout &amp; paper trading.
              </p>
              <button
                type="button"
                onClick={() => onOpenSymbolChart('NSE:NIFTY')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <span>Explore all features</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHITE ROUNDED SHEET — MARKET SUMMARY (India First!) */}
      <div className="bg-white text-slate-950 rounded-t-[32px] pt-14 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 space-y-16">
          {/* MARKET SUMMARY */}
          <section aria-labelledby="market-summary-heading" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onNavigate('markets')}
                className="group inline-flex items-center gap-1.5 text-left"
              >
                <h2 id="market-summary-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors">
                  Market summary
                </h2>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('markets')}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                Open Stock Screener &amp; Heatmap
              </button>
            </div>

            {/* Row 1: Featured Nifty 50 / Selected Index Chart + Major Indices List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left 8 cols: Interactive Index Area Chart */}
              <div className="lg:col-span-8 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white font-mono shrink-0"
                      style={{ backgroundColor: featuredIndex.badgeColor }}
                    >
                      {featuredIndex.badgeText}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenSymbolChart(featuredIndex.id)}
                          className="font-display text-lg font-bold text-slate-950 hover:text-blue-600 transition-colors"
                        >
                          {featuredIndex.name}
                        </button>
                        <span className="font-mono text-xs text-slate-500">
                          {featuredIndex.symbol}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2.5 mt-0.5 font-mono tabular-nums">
                        <span className="text-2xl font-bold text-slate-950">
                          {formatPrice(featuredIndex.price)}
                        </span>
                        <span className="text-xs text-slate-500">{featuredIndex.unitLabel ?? featuredIndex.currency}</span>
                        <span
                          className={`text-sm font-semibold ${
                            featuredIndex.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {featuredIndex.changePercent >= 0 ? '+' : ''}
                          {featuredIndex.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg" role="tablist" aria-label="Index timeframe">
                    {(['15m', '1H', '1D', '1W'] as Timeframe[]).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        role="tab"
                        aria-selected={indexRange === tf}
                        onClick={() => setIndexRange(tf)}
                        className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                          indexRange === tf
                            ? 'bg-white text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <AreaMiniChart
                  candles={featuredIndexCandles}
                  positive={featuredIndex.changePercent >= 0}
                  height={250}
                  currency={featuredIndex.currency}
                />

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Click any index on the right to preview, or launch full technical analysis.</span>
                  <button
                    type="button"
                    onClick={() => onOpenSymbolChart(featuredIndex.id)}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    <span>Chart {featuredIndex.symbol}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Right 4 cols: Major Indices List */}
              <div className="lg:col-span-4 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-950 mb-3">Major indices</h3>
                  <ul className="divide-y divide-slate-100">
                    {[getLive('NSE:NIFTY'), ...majorIndices].map((idx) => {
                      const isPos = idx.changePercent >= 0;
                      const isSelected = idx.id === featuredIndexId;
                      return (
                        <li key={idx.id}>
                          <button
                            type="button"
                            onClick={() => setFeaturedIndexId(idx.id)}
                            onDoubleClick={() => onOpenSymbolChart(idx.id)}
                            className={`w-full py-2.5 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors ${
                              isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono shrink-0"
                                style={{ backgroundColor: idx.badgeColor }}
                              >
                                {idx.badgeText}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-950 truncate">{idx.name}</div>
                                <div className="font-mono text-[11px] text-slate-500">{idx.symbol}</div>
                              </div>
                            </div>

                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="text-sm font-semibold text-slate-950">
                                {formatPrice(idx.price)}{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                  {idx.unitLabel ?? idx.currency}
                                </span>
                              </div>
                              <div className={`text-xs font-medium ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isPos ? '+' : ''}
                                {idx.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('markets')}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>See all major indices</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Row 2: 3-Column Bento matching in.tradingview.com (Crypto Cap, USDINR + Futures, US Yield Curve + Bonds) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: Crypto Market Cap & Bitcoin Dominance */}
              <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        TOT
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenSymbolChart(cryptoTotal.id)}
                        className="font-display text-base font-bold text-slate-950 hover:text-blue-600"
                      >
                        Crypto market cap
                      </button>
                      <span className="font-mono text-xs text-slate-400">TOTAL</span>
                    </div>
                    <div className="mt-2 font-mono tabular-nums">
                      <span className="text-xl font-bold text-red-600">
                        {cryptoTotal.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">T USD</span>
                      <div className="text-xs font-semibold text-red-600">
                        {cryptoTotal.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <AreaMiniChart candles={cryptoTotalCandles} positive={false} height={95} showAxes={false} interactive={false} />

                  {/* Bitcoin dominance bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-950">Bitcoin dominance</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Bitcoin</div>
                        <div className="font-mono font-semibold text-slate-950 tabular-nums">59.20%</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Ethereum</div>
                        <div className="font-mono font-semibold text-slate-950 tabular-nums">10.05%</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Others</div>
                        <div className="font-mono font-semibold text-slate-950 tabular-nums">30.74%</div>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden flex gap-0.5">
                      <div className="bg-blue-600 h-full" style={{ width: '59.2%' }} />
                      <div className="bg-emerald-500 h-full" style={{ width: '10.05%' }} />
                      <div className="bg-red-500 h-full" style={{ width: '30.75%' }} />
                    </div>
                  </div>

                  {/* BTC & ETH list */}
                  <ul className="divide-y divide-slate-100 pt-1">
                    {[btc, eth].map((coin) => {
                      const pos = coin.changePercent >= 0;
                      return (
                        <li key={coin.id}>
                          <button
                            type="button"
                            onClick={() => onOpenSymbolChart(coin.id)}
                            className="w-full py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-md px-1 -mx-1"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: coin.badgeColor }}
                              >
                                {coin.badgeText}
                              </span>
                              <div className="text-left">
                                <div className="text-sm font-semibold text-slate-950">{coin.name}</div>
                                <div className="font-mono text-[11px] text-slate-400">{coin.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-sm font-semibold text-slate-950">
                                {formatPrice(coin.price)} <span className="text-[10px] text-slate-400">USD</span>
                              </div>
                              <div className={`text-xs font-medium ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                                {pos ? '+' : ''}
                                {coin.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('markets')}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>See all crypto coins</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Card 2: USD to INR & Commodities Futures */}
              <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        ₹/$
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenSymbolChart(usdinr.id)}
                        className="font-display text-base font-bold text-slate-950 hover:text-blue-600"
                      >
                        USD to INR
                      </button>
                      <span className="font-mono text-xs text-slate-400">USDINR</span>
                    </div>
                    <div className="mt-2 font-mono tabular-nums">
                      <span className="text-xl font-bold text-slate-950">{usdinr.price.toFixed(4)}</span>{' '}
                      <span className="text-xs text-slate-500">INR</span>
                      <div className={`text-xs font-semibold ${usdinr.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {usdinr.changePercent >= 0 ? '+' : ''}
                        {usdinr.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <AreaMiniChart
                    candles={usdinrCandles}
                    positive={usdinr.changePercent >= 0}
                    height={95}
                    showAxes={false}
                    interactive={false}
                  />

                  <ul className="divide-y divide-slate-100 pt-1">
                    {futuresList.map((fut) => {
                      const pos = fut.changePercent >= 0;
                      return (
                        <li key={fut.id}>
                          <button
                            type="button"
                            onClick={() => onOpenSymbolChart(fut.id)}
                            className="w-full py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-md px-1 -mx-1"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono shrink-0"
                                style={{ backgroundColor: fut.badgeColor }}
                              >
                                {fut.badgeText}
                              </span>
                              <div className="text-left min-w-0">
                                <div className="text-sm font-semibold text-slate-950 truncate">{fut.name}</div>
                                <div className="font-mono text-[11px] text-slate-400">{fut.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="text-sm font-semibold text-slate-950">
                                {formatPrice(fut.price)}{' '}
                                <span className="text-[10px] text-slate-400">{fut.unitLabel?.split(' ')[0]}</span>
                              </div>
                              <div className={`text-xs font-medium ${pos ? 'text-emerald-600' : 'text-red-600'}`}>
                                {pos ? '+' : ''}
                                {fut.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('markets')}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>See all futures</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Card 3: US Yield Curve & Investment Grade Corporate Bonds */}
              <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-white">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-950 mb-2">US yield curve</h3>
                    <YieldCurveChart points={US_YIELD_CURVE} />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h3 className="font-display text-base font-bold text-slate-950">
                      Investment grade corporate bonds
                    </h3>
                    <ul className="space-y-3.5">
                      {CORPORATE_BONDS.map((b) => (
                        <li key={b.issuer} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                style={{ backgroundColor: b.accent }}
                              >
                                {b.initials}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-950 truncate">{b.issuer}</div>
                                <div className="text-[11px] text-slate-500">{b.coupon}</div>
                              </div>
                            </div>
                            <div className="text-right font-mono tabular-nums shrink-0">
                              <div className="text-sm font-semibold text-slate-950">{b.yieldPct}</div>
                              <div className="text-[11px] text-amber-600 font-medium">{b.spread}</div>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-slate-100">
                            <div className="bg-blue-500 h-full" style={{ width: `${b.treasuryRatio}%` }} />
                            <div className="bg-amber-500 h-full" style={{ width: `${100 - b.treasuryRatio}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> US treasury yield
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> G-spread
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('markets')}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>See all bonds</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 3B: FEATURED IPOS (matching live in.tradingview.com) */}
          <section aria-labelledby="featured-ipos-heading" className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="group inline-flex items-center gap-1.5 text-left"
              >
                <h2 id="featured-ipos-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors">
                  Featured IPOs
                </h2>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                Full IPO &amp; Earnings Calendar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURED_IPOS.map((ipo) => (
                <div
                  key={ipo.id}
                  className="p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-500/60 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white font-mono shrink-0"
                        style={{ backgroundColor: ipo.badgeColor }}
                      >
                        {ipo.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-sm font-bold text-slate-950 truncate">{ipo.company}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {ipo.exchange}:{ipo.symbol} · {ipo.sector}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap ${
                        ipo.status === 'Open'
                          ? 'text-emerald-600'
                          : ipo.status === 'Listed'
                            ? 'text-blue-600'
                            : 'text-slate-500'
                      }`}
                    >
                      {ipo.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-2 border-t border-slate-100 text-slate-600">
                    <span>{ipo.priceBand}</span>
                    <span className="font-semibold text-slate-900">{ipo.issueSize}</span>
                    <span>{ipo.dateLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: INDIAN STOCKS (NSE) PULSE */}
          <section aria-labelledby="india-stocks-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 id="india-stocks-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                  Indian stocks (NSE)
                </h2>
                <p className="text-sm text-slate-500">Click any stock to launch interactive Supercharts with technical indicators.</p>
              </div>

              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Indian stocks filter">
                {(
                  [
                    { id: 'active', label: 'Most active' },
                    { id: 'gainers', label: 'Top gainers' },
                    { id: 'losers', label: 'Top losers' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={stockTab === t.id}
                    onClick={() => setStockTab(t.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      stockTab === t.id ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {indianStocks.map((st) => {
                const isPos = st.changePercent >= 0;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onOpenSymbolChart(st.id)}
                    className="p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white font-mono shrink-0"
                        style={{ backgroundColor: st.badgeColor }}
                      >
                        {st.badgeText}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-bold text-slate-950">{st.symbol}</div>
                        <div className="text-xs text-slate-500 truncate">{st.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {st.sector} · Vol {formatVolume(st.volume)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="text-sm font-bold text-slate-950">₹{formatPrice(st.price)}</div>
                      <div className={`text-xs font-semibold ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPos ? '+' : ''}
                        {st.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 4B: NEWS FLOW & ECONOMIC CALENDAR PULSE */}
          <section aria-labelledby="news-calendar-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="group inline-flex items-center gap-1.5 text-left"
              >
                <h2 id="news-calendar-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors">
                  News flow &amp; economic calendar
                </h2>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('news')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                Open News &amp; Calendars
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 border border-slate-200 rounded-2xl p-5 bg-white divide-y divide-slate-100">
                {MARKET_NEWS.slice(0, 4).map((n) => (
                  <div key={n.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] text-slate-400 font-medium">
                        {n.source} · {n.timeAgo}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenSymbolChart(n.relatedSymbolId)}
                        className="text-left font-display text-sm font-bold text-slate-950 hover:text-blue-600 leading-snug"
                      >
                        {n.headline}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenSymbolChart(n.relatedSymbolId)}
                      className="font-mono text-[11px] font-semibold text-blue-600 hover:underline whitespace-nowrap shrink-0 mt-1"
                    >
                      {n.relatedTicker}
                    </button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-5 border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-950 mb-3">Key macro events (IST)</h3>
                  <ul className="divide-y divide-slate-100 text-xs">
                    {ECONOMIC_EVENTS.slice(0, 5).map((ev) => (
                      <li key={ev.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-950 truncate">{ev.title}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {ev.country} · {ev.time} ·{' '}
                            <span className={ev.impact === 'High' ? 'text-red-600 font-semibold' : 'text-amber-600'}>
                              {ev.impact}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="font-bold text-slate-950">{ev.actual}</div>
                          <div className="text-[10px] text-slate-400">Est {ev.forecast}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('news')}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Full economic calendar</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 5: COMMUNITY IDEAS */}
          <section aria-labelledby="community-ideas-heading" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onNavigate('community')}
                className="group inline-flex items-center gap-1.5"
              >
                <h2 id="community-ideas-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors">
                  Community ideas
                </h2>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600" aria-hidden="true" />
              </button>

              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Community ideas filter">
                <button
                  type="button"
                  role="tab"
                  aria-selected={ideaTab === 'editors'}
                  onClick={() => setIdeaTab('editors')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    ideaTab === 'editors' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Editors&apos; picks
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={ideaTab === 'popular'}
                  onClick={() => setIdeaTab('popular')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    ideaTab === 'popular' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Popular
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedIdeas.map((idea) => {
                const sym = getLive(idea.symbolId);
                const ideaCandles = generateCandles(sym, idea.timeframe, 44);
                const liked = likedIdeaIds.has(idea.id);
                return (
                  <article
                    key={idea.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between bg-white hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenSymbolChart(idea.symbolId)}
                        className="block w-full h-40 overflow-hidden relative group"
                        aria-label={`Open chart for ${idea.title}`}
                      >
                        <IdeaMiniCandles candles={ideaCandles} direction={idea.direction} />
                        <span className="absolute bottom-2.5 left-3 font-mono text-[11px] font-semibold text-white bg-black/70 px-2 py-0.5 rounded">
                          {idea.exchange}:{idea.displaySymbol} · {idea.timeframe}
                        </span>
                      </button>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>by {idea.author}</span>
                          <span
                            className={`font-semibold ${
                              idea.direction === 'Long'
                                ? 'text-emerald-600'
                                : idea.direction === 'Short'
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                            }`}
                          >
                            {idea.direction}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenSymbolChart(idea.symbolId)}
                          className="text-left font-display text-base font-bold text-slate-950 hover:text-blue-600 leading-snug line-clamp-2"
                        >
                          {idea.title}
                        </button>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {idea.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{idea.publishedAgo}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleLikeIdea(idea.id)}
                          aria-label={`Boost idea ${idea.title}`}
                          className={`inline-flex items-center gap-1 font-mono tabular-nums transition-colors ${
                            liked ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-blue-600' : ''}`} aria-hidden="true" />
                          <span>{idea.likes + (liked ? 1 : 0)}</span>
                        </button>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{idea.comments}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* SECTION 6: BROKERS STRIP */}
          <section aria-labelledby="brokers-strip-heading" className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="brokers-strip-heading" className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                  Trade directly with integrated brokers
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Verified Indian NSE/BSE &amp; global brokers connected natively to Supercharts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('brokers')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                See all brokers
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BROKERS.map((br) => (
                <div key={br.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white font-display shrink-0"
                        style={{ backgroundColor: br.accentColor }}
                      >
                        {br.initials}
                      </span>
                      <div>
                        <div className="font-display text-base font-bold text-slate-950">{br.name}</div>
                        <div className="text-xs text-slate-500">{br.region} · {br.assets.split(',')[0]}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-700">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <span className="font-bold text-slate-950">{br.rating.toFixed(1)}</span>
                      <span className="text-slate-400">·</span>
                      <span>{br.ratingLabel}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('brokers')}
                    aria-label={`Connect ${br.name} account`}
                    className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-colors"
                  >
                    Connect account
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-slate-200 pt-12 px-4 lg:px-8">
          <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-6 gap-8 text-xs text-slate-600">
            <div className="md:col-span-2 space-y-3">
              <TradingViewLogo lightText={false} />
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Look first / Then leap. Track NSE, BSE, Nifty 50, Sensex, global equities, crypto, forex, commodities, IPOs, Pine Script® strategies, and yield curves across Windows, Linux, and Android.
              </p>
              <div className="text-slate-400">English (India) · © 2026 TradingView India</div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-950">Products &amp; Apps</div>
              <ul className="space-y-1.5">
                <li><button type="button" onClick={() => onOpenSymbolChart('NSE:NIFTY')} className="hover:text-blue-600">Supercharts</button></li>
                <li><button type="button" onClick={() => onNavigate('markets')} className="hover:text-blue-600">Stock Screener</button></li>
                <li><button type="button" onClick={() => onNavigate('markets')} className="hover:text-blue-600">NSE Stock Heatmap</button></li>
                <li><button type="button" onClick={() => onNavigate('apps')} className="hover:text-blue-600">Windows &amp; Linux App</button></li>
                <li><button type="button" onClick={() => onNavigate('apps')} className="hover:text-blue-600">Android PWA &amp; APK Kit</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-950">Markets &amp; Calendars</div>
              <ul className="space-y-1.5">
                <li><button type="button" onClick={() => onOpenSymbolChart('NSE:NIFTY')} className="hover:text-blue-600">Nifty 50 (NSE)</button></li>
                <li><button type="button" onClick={() => onOpenSymbolChart('BSE:SENSEX')} className="hover:text-blue-600">Sensex (BSE)</button></li>
                <li><button type="button" onClick={() => onNavigate('news')} className="hover:text-blue-600">News Flow</button></li>
                <li><button type="button" onClick={() => onNavigate('news')} className="hover:text-blue-600">Economic &amp; IPO Calendar</button></li>
                <li><button type="button" onClick={() => onOpenSymbolChart('FX_IDC:USDINR')} className="hover:text-blue-600">USD / INR</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-950">Community</div>
              <ul className="space-y-1.5">
                <li><button type="button" onClick={() => onNavigate('community')} className="hover:text-blue-600">Trading Ideas</button></li>
                <li><button type="button" onClick={() => onNavigate('community')} className="hover:text-blue-600">Editors&apos; Picks</button></li>
                <li><button type="button" onClick={() => onOpenSymbolChart('NSE:NIFTY')} className="hover:text-blue-600">Pine Script® Editor</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-950">Trading &amp; Plans</div>
              <ul className="space-y-1.5">
                <li><button type="button" onClick={() => onNavigate('brokers')} className="hover:text-blue-600">Brokers Directory</button></li>
                <li><button type="button" onClick={() => onOpenSymbolChart('NSE:NIFTY')} className="hover:text-blue-600">Paper Trading</button></li>
                <li><button type="button" onClick={() => onNavigate('pricing')} className="hover:text-blue-600">Pricing (INR)</button></li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
