import { useCallback, useEffect, useState } from 'react';
import { AppsDownloadView } from './tradingview/components/AppsDownloadView';
import { BrokersView } from './tradingview/components/BrokersView';
import { CalendarsNewsView } from './tradingview/components/CalendarsNewsView';
import { CommunityView } from './tradingview/components/CommunityView';
import { HomePage } from './tradingview/components/HomePage';
import { MarketsScreenerView } from './tradingview/components/MarketsScreenerView';
import { Navbar } from './tradingview/components/Navbar';
import { OfflineIndicator } from './tradingview/components/PWAInstallButton';
import { PricingView } from './tradingview/components/PricingView';
import { SuperchartsView } from './tradingview/components/SuperchartsView';
import { SymbolSearchModal } from './tradingview/components/SymbolSearchModal';
import { COMMUNITY_IDEAS, MARKET_SYMBOLS, roundPrice } from './tradingview/marketData';
import type { AppView, CommunityIdea, MarketSymbol, PaperPosition, PriceAlert } from './tradingview/types';

const INITIAL_WATCHLIST = [
  'NSE:NIFTY',
  'BSE:SENSEX',
  'NSE:BANKNIFTY',
  'NSE:RELIANCE',
  'NSE:TCS',
  'NSE:HDFCBANK',
  'NSE:INFY',
  'NSE:LT',
  'BITSTAMP:BTCUSD',
  'FX_IDC:USDINR',
  'COMEX:GC1!',
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [activeSymbolId, setActiveSymbolId] = useState<string>('NSE:NIFTY');
  const [searchOpen, setSearchOpen] = useState(false);

  const [symbols, setSymbols] = useState<MarketSymbol[]>(() => MARKET_SYMBOLS);
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() =>
    readStored('tv_india_watchlist_v1', INITIAL_WATCHLIST),
  );
  const [ideas, setIdeas] = useState<CommunityIdea[]>(() =>
    readStored('tv_india_ideas_v1', COMMUNITY_IDEAS),
  );
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(
    () => new Set(readStored<string[]>('tv_india_likes_v1', [])),
  );

  // Paper Trading Account State (₹10,00,000 starting capital, persisted offline)
  const [paperCash, setPaperCash] = useState<number>(() => readStored('tv_india_cash_v1', 1_000_000));
  const [positions, setPositions] = useState<PaperPosition[]>(() =>
    readStored('tv_india_positions_v1', []),
  );
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => readStored('tv_india_alerts_v1', []));

  // Persist user state across reloads & offline PWA sessions
  useEffect(() => {
    try {
      window.localStorage.setItem('tv_india_watchlist_v1', JSON.stringify(watchlistIds));
      window.localStorage.setItem('tv_india_ideas_v1', JSON.stringify(ideas));
      window.localStorage.setItem('tv_india_likes_v1', JSON.stringify(Array.from(likedIdeaIds)));
      window.localStorage.setItem('tv_india_cash_v1', JSON.stringify(paperCash));
      window.localStorage.setItem('tv_india_positions_v1', JSON.stringify(positions));
      window.localStorage.setItem('tv_india_alerts_v1', JSON.stringify(alerts));
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }, [watchlistIds, ideas, likedIdeaIds, paperCash, positions, alerts]);

  // Track scroll position on HomePage to transition Navbar from dark hero to crisp white
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > 1250);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Global Ctrl+K / Cmd+K Symbol Search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Gentle live market quote ticker every 3.5 seconds across symbols
  useEffect(() => {
    const timer = setInterval(() => {
      setSymbols((prev) =>
        prev.map((s, idx) => {
          if (idx % 3 !== Math.floor(Date.now() / 3500) % 3) return s;
          const step = (Math.random() - 0.495) * s.volatility * 0.18;
          const nextPrice = roundPrice(Math.max(0.01, s.price * (1 + step)), s.price);
          const diff = nextPrice - s.price;
          const nextChange = roundPrice(s.change + diff, s.price);
          const baseOpen = nextPrice - nextChange;
          const nextPct = baseOpen > 0 ? (nextChange / baseOpen) * 100 : s.changePercent;
          return {
            ...s,
            price: nextPrice,
            change: nextChange,
            changePercent: Math.round(nextPct * 100) / 100,
          };
        }),
      );
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleOpenSymbolChart = useCallback((symbolId: string) => {
    setActiveSymbolId(symbolId);
    setWatchlistIds((prev) => (prev.includes(symbolId) ? prev : [symbolId, ...prev]));
    setActiveView('chart');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const handleRemoveFromWatchlist = useCallback((id: string) => {
    setWatchlistIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const handleToggleLikeIdea = useCallback((id: string) => {
    setLikedIdeaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePublishIdea = useCallback((idea: CommunityIdea) => {
    setIdeas((prev) => [idea, ...prev]);
  }, []);

  const handlePlacePaperOrder = useCallback(
    (symbolId: string, side: 'BUY' | 'SELL', qty: number, price: number) => {
      const sym = symbols.find((s) => s.id === symbolId);
      const symbolName = sym?.symbol ?? symbolId;
      const notional = qty * price;
      setPaperCash((prev) => Math.max(0, side === 'BUY' ? prev - notional : prev + notional));
      setPositions((prev) => [
        {
          id: `pos-${Date.now()}`,
          symbolId,
          symbol: symbolName,
          side,
          qty,
          entryPrice: price,
          openedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [symbols],
  );

  const handleClosePosition = useCallback((positionId: string, currentPrice: number) => {
    setPositions((prev) => {
      const target = prev.find((p) => p.id === positionId);
      if (!target) return prev;
      const settlement = target.qty * currentPrice;
      setPaperCash((cash) => (target.side === 'BUY' ? cash + settlement : Math.max(0, cash - settlement)));
      return prev.filter((p) => p.id !== positionId);
    });
  }, []);

  const handleAddAlert = useCallback(
    (symbolId: string, symbol: string, targetPrice: number, condition: 'above' | 'below') => {
      setAlerts((prev) => [
        {
          id: `alert-${Date.now()}`,
          symbolId,
          symbol,
          targetPrice,
          condition,
          triggered: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const handleRemoveAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const darkNavSurface =
    activeView === 'chart' || activeView === 'apps' || (activeView === 'home' && !scrolledPastHero);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSupercharts={() => handleOpenSymbolChart(activeSymbolId)}
        darkSurface={darkNavSurface}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <HomePage
            symbols={symbols}
            ideas={ideas}
            likedIdeaIds={likedIdeaIds}
            onToggleLikeIdea={handleToggleLikeIdea}
            onOpenSymbolChart={handleOpenSymbolChart}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'chart' && (
          <SuperchartsView
            symbols={symbols}
            activeSymbolId={activeSymbolId}
            onSelectSymbol={setActiveSymbolId}
            onOpenSearch={() => setSearchOpen(true)}
            watchlistIds={watchlistIds}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            paperCash={paperCash}
            positions={positions}
            onPlacePaperOrder={handlePlacePaperOrder}
            onClosePosition={handleClosePosition}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onRemoveAlert={handleRemoveAlert}
          />
        )}

        {activeView === 'markets' && (
          <MarketsScreenerView symbols={symbols} onOpenSymbolChart={handleOpenSymbolChart} />
        )}

        {activeView === 'news' && <CalendarsNewsView onOpenSymbolChart={handleOpenSymbolChart} />}

        {activeView === 'community' && (
          <CommunityView
            symbols={symbols}
            ideas={ideas}
            likedIdeaIds={likedIdeaIds}
            onToggleLikeIdea={handleToggleLikeIdea}
            onPublishIdea={handlePublishIdea}
            onOpenSymbolChart={handleOpenSymbolChart}
          />
        )}

        {activeView === 'brokers' && (
          <BrokersView onLaunchPaperTrading={() => handleOpenSymbolChart('NSE:NIFTY')} />
        )}

        {activeView === 'pricing' && (
          <PricingView onStartFreeChart={() => handleOpenSymbolChart(activeSymbolId)} />
        )}

        {activeView === 'apps' && <AppsDownloadView />}
      </main>

      <SymbolSearchModal
        open={searchOpen}
        symbols={symbols}
        onClose={() => setSearchOpen(false)}
        onSelectSymbol={handleOpenSymbolChart}
      />

      <OfflineIndicator />
    </div>
  );
}
