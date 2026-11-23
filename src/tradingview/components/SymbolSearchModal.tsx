import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice } from '../marketData';
import type { AssetClass, MarketSymbol } from '../types';

interface SymbolSearchModalProps {
  open: boolean;
  symbols: MarketSymbol[];
  onClose: () => void;
  onSelectSymbol: (symbolId: string) => void;
}

const FILTER_TABS: Array<{ id: 'all' | AssetClass; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'india_stock', label: 'India Stocks' },
  { id: 'index', label: 'Indices' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'futures', label: 'Futures' },
];

export function SymbolSearchModal({
  open,
  symbols,
  onClose,
  onSelectSymbol,
}: SymbolSearchModalProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | AssetClass>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return symbols.filter((s) => {
      if (filter !== 'all' && s.assetClass !== filter) return false;
      if (!q) return true;
      return (
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.exchange.toLowerCase().includes(q) ||
        (s.sector?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [symbols, query, filter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Symbol search"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-950">Symbol Search</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close symbol search"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <label htmlFor="tv-symbol-search-input" className="sr-only">
            Search symbols, stocks, indices, crypto, or forex
          </label>
          <input
            ref={inputRef}
            id="tv-symbol-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NIFTY, SENSEX, RELIANCE, TCS, BTCUSD, USDINR, Gold…"
            className="w-full text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Category Filter Bar */}
        <div className="px-5 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto bg-slate-50/70">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <ul className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-slate-500">
              No symbols match &ldquo;{query}&rdquo;. Try NIFTY, RELIANCE, or BTCUSD.
            </li>
          ) : (
            results.map((item) => {
              const isPos = item.changePercent >= 0;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSymbol(item.id);
                      onClose();
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between gap-4 hover:bg-blue-50/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 font-mono"
                        style={{ backgroundColor: item.badgeColor }}
                      >
                        {item.badgeText}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-slate-950">
                            {item.symbol}
                          </span>
                          <span className="text-xs text-slate-500 truncate">{item.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.exchange} · {item.sector || item.assetClass.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-sm font-semibold text-slate-950">
                        {formatPrice(item.price)}
                      </div>
                      <div className={`text-xs font-medium ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPos ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
