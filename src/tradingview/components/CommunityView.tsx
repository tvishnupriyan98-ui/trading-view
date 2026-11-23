import { Heart, MessageSquare, Plus, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { generateCandles, getSymbolById } from '../marketData';
import type { CommunityIdea, MarketSymbol, Timeframe } from '../types';
import { IdeaMiniCandles } from './MiniChart';

interface CommunityViewProps {
  symbols: MarketSymbol[];
  ideas: CommunityIdea[];
  likedIdeaIds: Set<string>;
  onToggleLikeIdea: (id: string) => void;
  onPublishIdea: (idea: CommunityIdea) => void;
  onOpenSymbolChart: (symbolId: string) => void;
}

const CATEGORIES = ['All', 'Editors picks', 'India', 'Crypto', 'Commodities'] as const;

export function CommunityView({
  symbols,
  ideas,
  likedIdeaIds,
  onToggleLikeIdea,
  onPublishIdea,
  onOpenSymbolChart,
}: CommunityViewProps) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [showPublish, setShowPublish] = useState(false);

  const [formSymbolId, setFormSymbolId] = useState('NSE:NIFTY');
  const [formDirection, setFormDirection] = useState<'Long' | 'Short'>('Long');
  const [formTimeframe, setFormTimeframe] = useState<Timeframe>('1D');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (category === 'All') return ideas;
    return ideas.filter((i) => i.category === category);
  }, [ideas, category]);

  const handlePublish = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim()) {
      setFormError('Enter both a title and technical thesis to publish your trading idea.');
      return;
    }
    const sym = symbols.find((s) => s.id === formSymbolId) ?? getSymbolById(formSymbolId);
    onPublishIdea({
      id: `idea-${Date.now()}`,
      symbolId: sym.id,
      displaySymbol: sym.symbol,
      exchange: sym.exchange,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      direction: formDirection,
      author: 'You (India Desk)',
      timeframe: formTimeframe,
      category: sym.assetClass === 'crypto' ? 'Crypto' : sym.assetClass === 'futures' ? 'Commodities' : 'India',
      likes: 1,
      comments: 0,
      publishedAgo: 'Just now',
      featured: false,
    });
    setFormTitle('');
    setFormSummary('');
    setFormError(null);
    setShowPublish(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 py-8 px-4 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Community Trading Ideas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chart setups, Elliott Wave counts, liquidity zones, and technical outlooks shared by Indian &amp; global traders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPublish(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2962FF] text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Publish Idea
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Idea categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                category === cat
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((idea) => {
            const sym = symbols.find((s) => s.id === idea.symbolId) ?? getSymbolById(idea.symbolId);
            const candles = generateCandles(sym, idea.timeframe, 44);
            const liked = likedIdeaIds.has(idea.id);
            return (
              <article
                key={idea.id}
                className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between bg-white"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenSymbolChart(idea.symbolId)}
                    className="block w-full h-44 relative overflow-hidden"
                    aria-label={`Inspect ${idea.displaySymbol} chart`}
                  >
                    <IdeaMiniCandles candles={candles} direction={idea.direction} />
                    <span className="absolute bottom-2.5 left-3 font-mono text-[11px] font-semibold text-white bg-black/75 px-2 py-0.5 rounded">
                      {idea.exchange}:{idea.displaySymbol} · {idea.timeframe}
                    </span>
                  </button>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>by {idea.author}</span>
                      <span
                        className={`font-semibold ${
                          idea.direction === 'Long' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {idea.direction}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenSymbolChart(idea.symbolId)}
                      className="text-left font-display text-base font-bold text-slate-950 hover:text-blue-600 leading-snug"
                    >
                      {idea.title}
                    </button>
                    <p className="text-xs text-slate-600 leading-relaxed">{idea.summary}</p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{idea.publishedAgo}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleLikeIdea(idea.id)}
                      aria-label={`Boost idea ${idea.title}`}
                      className={`inline-flex items-center gap-1 font-mono tabular-nums ${
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
      </div>

      {/* Publish Idea Modal */}
      {showPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Publish trading idea"
        >
          <form onSubmit={handlePublish} className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-950">Publish Trading Idea</h2>
              <button
                type="button"
                onClick={() => setShowPublish(false)}
                aria-label="Close publish dialog"
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="idea-sym" className="block text-xs font-medium text-slate-700 mb-1">Symbol</label>
                <select
                  id="idea-sym"
                  value={formSymbolId}
                  onChange={(e) => setFormSymbolId(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                >
                  {symbols.map((s) => (
                    <option key={s.id} value={s.id}>{s.symbol}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="idea-dir" className="block text-xs font-medium text-slate-700 mb-1">Bias</label>
                <select
                  id="idea-dir"
                  value={formDirection}
                  onChange={(e) => setFormDirection(e.target.value as 'Long' | 'Short')}
                  className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
              <div>
                <label htmlFor="idea-tf" className="block text-xs font-medium text-slate-700 mb-1">Timeframe</label>
                <select
                  id="idea-tf"
                  value={formTimeframe}
                  onChange={(e) => setFormTimeframe(e.target.value as Timeframe)}
                  className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded-lg font-mono"
                >
                  {(['15m', '1H', '4H', '1D', '1W'] as Timeframe[]).map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="idea-title" className="block text-xs font-medium text-slate-700 mb-1">Headline</label>
              <input
                id="idea-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. NIFTY 50 Breakout Above 25,600 Opening Range"
                className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="idea-summary" className="block text-xs font-medium text-slate-700 mb-1">Technical Thesis</label>
              <textarea
                id="idea-summary"
                rows={4}
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="Share key support/resistance levels, volume behavior, and invalidation zone…"
                className="w-full p-3 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            {formError && <p className="text-xs text-red-600 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublish(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#2962FF] rounded-lg hover:bg-blue-700"
              >
                Publish to Feed
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
