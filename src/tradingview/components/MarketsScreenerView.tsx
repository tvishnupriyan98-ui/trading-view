import { ArrowUpDown, LayoutGrid, Search, TableProperties } from 'lucide-react';
import { useMemo, useState } from 'react';
import { computeTechnicalRating } from '../indicators';
import { formatPrice, formatVolume, generateCandles } from '../marketData';
import type { AssetClass, MarketSymbol } from '../types';

interface MarketsScreenerViewProps {
  symbols: MarketSymbol[];
  onOpenSymbolChart: (symbolId: string) => void;
}

type SortField = 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCapBillions';

export function MarketsScreenerView({ symbols, onOpenSymbolChart }: MarketsScreenerViewProps) {
  const [mode, setMode] = useState<'screener' | 'heatmap'>('screener');
  const [assetFilter, setAssetFilter] = useState<'all' | AssetClass>('india_stock');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('marketCapBillions');
  const [sortDesc, setSortDesc] = useState(true);

  const ratingsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const sym of symbols) {
      const candles = generateCandles(sym, '1D', 70);
      map.set(sym.id, computeTechnicalRating(candles).label);
    }
    return map;
  }, [symbols]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const s of symbols) {
      if (s.sector) set.add(s.sector);
    }
    return ['All', ...Array.from(set).sort()];
  }, [symbols]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = symbols.filter((s) => {
      if (assetFilter !== 'all' && s.assetClass !== assetFilter) return false;
      if (sectorFilter !== 'All' && s.sector !== sectorFilter) return false;
      if (!q) return true;
      return (
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.sector?.toLowerCase().includes(q) ?? false)
      );
    });

    return list.sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      return sortDesc ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
  }, [symbols, assetFilter, sectorFilter, query, sortBy, sortDesc]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDesc((v) => !v);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const heatmapBySector = useMemo(() => {
    const indiaStocks = symbols.filter((s) => s.assetClass === 'india_stock');
    const grouped = new Map<string, MarketSymbol[]>();
    for (const st of indiaStocks) {
      const sec = st.sector || 'Other';
      const arr = grouped.get(sec) ?? [];
      arr.push(st);
      grouped.set(sec, arr);
    }
    return Array.from(grouped.entries());
  }, [symbols]);

  const tileColor = (pct: number) => {
    if (pct >= 2.2) return 'bg-[#089981] text-white';
    if (pct >= 0.8) return 'bg-[#26A69A] text-white';
    if (pct > 0) return 'bg-[#4DB6AC] text-slate-950';
    if (pct <= -2) return 'bg-[#D32F2F] text-white';
    return 'bg-[#EF5350] text-white';
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 py-8 px-4 lg:px-8">
      <div className="max-w-[1320px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Markets Screener &amp; NSE Heatmap
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Screen Indian NSE equities, global indices, crypto, forex, and commodities with live computed technical ratings.
            </p>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Markets view mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'screener'}
              onClick={() => setMode('screener')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'screener' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" aria-hidden="true" />
              Screener
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'heatmap'}
              onClick={() => setMode('heatmap')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'heatmap' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              NSE Heatmap
            </button>
          </div>
        </div>

        {mode === 'screener' ? (
          <>
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/70">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'india_stock', label: 'India (NSE)' },
                    { id: 'index', label: 'Indices' },
                    { id: 'crypto', label: 'Crypto' },
                    { id: 'forex', label: 'Forex' },
                    { id: 'futures', label: 'Futures' },
                    { id: 'all', label: 'All Markets' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setAssetFilter(tab.id);
                      if (tab.id !== 'india_stock') setSectorFilter('All');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      assetFilter === tab.id
                        ? 'bg-slate-950 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {assetFilter === 'india_stock' && (
                  <select
                    aria-label="Filter by sector"
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="h-9 px-3 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  >
                    {sectors.map((sec) => (
                      <option key={sec} value={sec}>
                        Sector: {sec}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
                  <label htmlFor="screener-search" className="sr-only">
                    Filter screener symbols
                  </label>
                  <input
                    id="screener-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter ticker or company…"
                    className="h-9 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 w-56"
                  />
                </div>
              </div>
            </div>

            {/* Screener Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-3 px-4">
                        <button type="button" onClick={() => handleSort('symbol')} className="inline-flex items-center gap-1 hover:text-slate-950">
                          Symbol <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button type="button" onClick={() => handleSort('price')} className="inline-flex items-center gap-1 hover:text-slate-950">
                          Price <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button type="button" onClick={() => handleSort('changePercent')} className="inline-flex items-center gap-1 hover:text-slate-950">
                          Change % <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button type="button" onClick={() => handleSort('volume')} className="inline-flex items-center gap-1 hover:text-slate-950">
                          Volume <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <button type="button" onClick={() => handleSort('marketCapBillions')} className="inline-flex items-center gap-1 hover:text-slate-950">
                          Mkt Cap <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4">Sector</th>
                      <th className="py-3 px-4 text-right">Tech Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => {
                      const isPos = item.changePercent >= 0;
                      const rating = ratingsMap.get(item.id) ?? 'Neutral';
                      const ratingClass = rating.includes('Buy')
                        ? 'text-emerald-600 font-semibold'
                        : rating.includes('Sell')
                          ? 'text-red-600 font-semibold'
                          : 'text-slate-500 font-medium';
                      return (
                        <tr
                          key={item.id}
                          onClick={() => onOpenSymbolChart(item.id)}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono shrink-0"
                                style={{ backgroundColor: item.badgeColor }}
                              >
                                {item.badgeText}
                              </span>
                              <div>
                                <div className="font-mono text-xs font-bold text-slate-950">{item.symbol}</div>
                                <div className="text-xs text-slate-500">{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-slate-950">
                            {formatPrice(item.price)} <span className="text-[10px] text-slate-400">{item.currency}</span>
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums ${
                              isPos ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {item.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-600">
                            {formatVolume(item.volume)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-600">
                            {item.marketCapBillions ? `₹${(item.marketCapBillions / 1000).toFixed(2)}L Cr` : '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            {item.sector || item.exchange}
                          </td>
                          <td className={`py-3 px-4 text-right text-xs whitespace-nowrap ${ratingClass}`}>
                            {rating}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* NSE STOCK HEATMAP */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatmapBySector.map(([sector, stocks]) => (
                <div key={sector} className="border border-slate-200 rounded-xl p-3 bg-slate-950 text-white space-y-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-display font-bold text-slate-200">{sector}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {stocks.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onOpenSymbolChart(st.id)}
                        className={`p-3 rounded-lg text-left transition-transform hover:scale-[1.01] ${tileColor(st.changePercent)} ${
                          stocks.length === 1 ? 'col-span-2' : ''
                        }`}
                      >
                        <div className="font-mono text-sm font-extrabold">{st.symbol}</div>
                        <div className="font-mono text-xs font-semibold tabular-nums mt-1">
                          {st.changePercent >= 0 ? '+' : ''}
                          {st.changePercent.toFixed(2)}%
                        </div>
                        <div className="font-mono text-[10px] opacity-85 mt-0.5">
                          ₹{formatPrice(st.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
