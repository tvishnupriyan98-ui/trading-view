import { ArrowUpRight, Calendar, Globe, Newspaper, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EARNINGS_EVENTS, ECONOMIC_EVENTS, FEATURED_IPOS, MARKET_NEWS } from '../extraData';

interface CalendarsNewsViewProps {
  onOpenSymbolChart: (symbolId: string) => void;
}

type HubTab = 'news' | 'economic' | 'earnings' | 'ipos';

export function CalendarsNewsView({ onOpenSymbolChart }: CalendarsNewsViewProps) {
  const [tab, setTab] = useState<HubTab>('news');
  const [newsCategory, setNewsCategory] = useState<'All' | 'India' | 'Global' | 'Crypto' | 'Commodities'>('All');
  const [impactFilter, setImpactFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredNews = useMemo(() => {
    if (newsCategory === 'All') return MARKET_NEWS;
    return MARKET_NEWS.filter((n) => n.category === newsCategory);
  }, [newsCategory]);

  const filteredEconomic = useMemo(() => {
    if (impactFilter === 'All') return ECONOMIC_EVENTS;
    return ECONOMIC_EVENTS.filter((ev) => ev.impact === impactFilter);
  }, [impactFilter]);

  return (
    <div className="min-h-screen bg-white text-slate-950 py-8 px-4 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              News Flow &amp; Market Calendars
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time India NSE/RBI headlines, macroeconomic releases, corporate earnings, and upcoming IPOs.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center p-1 bg-slate-100 rounded-lg" role="tablist" aria-label="Calendars and news sections">
            {(
              [
                { id: 'news', label: 'News Flow', icon: <Newspaper className="w-3.5 h-3.5" /> },
                { id: 'economic', label: 'Economic', icon: <Globe className="w-3.5 h-3.5" /> },
                { id: 'earnings', label: 'Earnings', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { id: 'ipos', label: 'IPOs', icon: <Calendar className="w-3.5 h-3.5" /> },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  tab === item.id ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NEWS FLOW */}
        {tab === 'news' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'India', 'Global', 'Crypto', 'Commodities'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewsCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    newsCategory === cat ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-3 bg-white hover:border-blue-500/60 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{item.source}</span>
                      <span>{item.timeAgo}</span>
                    </div>
                    <h2 className="font-display text-base font-bold text-slate-950 leading-snug">
                      {item.headline}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">{item.category}</span>
                    <button
                      type="button"
                      onClick={() => onOpenSymbolChart(item.relatedSymbolId)}
                      className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>Chart {item.relatedTicker}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ECONOMIC CALENDAR */}
        {tab === 'economic' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'High', 'Medium', 'Low'] as const).map((imp) => (
                <button
                  key={imp}
                  type="button"
                  onClick={() => setImpactFilter(imp)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    impactFilter === imp ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {imp === 'All' ? 'All Impact Levels' : `${imp} Impact`}
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Region</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Impact</th>
                      <th className="py-3 px-4 text-right">Actual</th>
                      <th className="py-3 px-4 text-right">Forecast</th>
                      <th className="py-3 px-4 text-right">Previous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredEconomic.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">{ev.time}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{ev.country}</td>
                        <td className="py-3 px-4 font-semibold text-slate-950">{ev.title}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              ev.impact === 'High'
                                ? 'text-red-600'
                                : ev.impact === 'Medium'
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                            }`}
                          >
                            {ev.impact}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-950">{ev.actual}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">{ev.forecast}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">{ev.previous}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EARNINGS CALENDAR */}
        {tab === 'earnings' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4 text-right">EPS Est.</th>
                    <th className="py-3 px-4 text-right">Reported EPS</th>
                    <th className="py-3 px-4 text-right">Rev. Est.</th>
                    <th className="py-3 px-4 text-right">Surprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {EARNINGS_EVENTS.map((er) => (
                    <tr
                      key={er.id}
                      onClick={() => onOpenSymbolChart(er.symbolId)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-950">{er.symbol}</div>
                        <div className="text-slate-500">{er.company}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{er.date}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{er.epsEstimate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-950">{er.epsActual}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">{er.revenueEstimate}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-emerald-600">
                        {er.surprisePct !== undefined ? `+${er.surprisePct.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* IPO CALENDAR */}
        {tab === 'ipos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED_IPOS.map((ipo) => (
              <div key={ipo.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white font-mono shrink-0"
                      style={{ backgroundColor: ipo.badgeColor }}
                    >
                      {ipo.initials}
                    </span>
                    <div>
                      <div className="font-display font-bold text-slate-950">{ipo.company}</div>
                      <div className="font-mono text-xs text-slate-500">
                        {ipo.exchange}:{ipo.symbol} · {ipo.sector}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
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

                <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs font-mono tabular-nums">
                  <div>
                    <dt className="text-slate-400 font-sans">Price Band</dt>
                    <dd className="font-semibold text-slate-950 mt-0.5">{ipo.priceBand}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-sans">Issue Size</dt>
                    <dd className="font-semibold text-slate-950 mt-0.5">{ipo.issueSize}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-sans">Schedule</dt>
                    <dd className="font-semibold text-slate-700 mt-0.5">{ipo.dateLabel}</dd>
                  </div>
                  {ipo.listingGainPct !== undefined && (
                    <div>
                      <dt className="text-slate-400 font-sans">Listing Gain</dt>
                      <dd className="font-semibold text-emerald-600 mt-0.5">+{ipo.listingGainPct.toFixed(1)}%</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
