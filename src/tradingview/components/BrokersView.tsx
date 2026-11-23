import { CheckCircle2, Star } from 'lucide-react';
import { useState } from 'react';
import { BROKERS } from '../marketData';

interface BrokersViewProps {
  onLaunchPaperTrading: () => void;
}

export function BrokersView({ onLaunchPaperTrading }: BrokersViewProps) {
  const [regionFilter, setRegionFilter] = useState<'All' | 'India' | 'Global'>('All');
  const [connectedBrokerId, setConnectedBrokerId] = useState<string | null>(null);

  const visible = BROKERS.filter((b) => regionFilter === 'All' || b.region === regionFilter);

  return (
    <div className="min-h-screen bg-white text-slate-950 py-8 px-4 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Trade Directly from Supercharts
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Compare verified Indian NSE/BSE brokers and global FX providers, or practice risk-free with built-in Paper Trading.
            </p>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            {(['All', 'India', 'Global'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegionFilter(r)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  regionFilter === r ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Built-in Paper Trading Banner */}
        <div className="p-6 rounded-2xl bg-slate-950 text-white flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="text-xs font-mono text-blue-400">Built-in Simulator · ₹10,00,000 Virtual Capital</div>
            <h2 className="font-display text-xl font-bold">TradingView Paper Trading</h2>
            <p className="text-sm text-slate-300">
              Test strategies on Nifty 50, Bank Nifty, Reliance, BTCUSD, and Gold with instant market orders and live unrealized P&amp;L inside Supercharts.
            </p>
          </div>
          <button
            type="button"
            onClick={onLaunchPaperTrading}
            className="px-6 py-3 rounded-lg bg-[#2962FF] hover:bg-blue-600 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Launch Paper Trading
          </button>
        </div>

        {/* Broker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visible.map((br) => {
            const isConnected = connectedBrokerId === br.id;
            return (
              <article key={br.id} className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5 bg-white">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white font-display shrink-0"
                        style={{ backgroundColor: br.accentColor }}
                      >
                        {br.initials}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-lg font-bold text-slate-950">{br.name}</h2>
                          <span className="text-xs text-slate-500">· {br.region}</span>
                        </div>
                        <div className="text-xs text-slate-500">{br.assets}</div>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <div className="inline-flex items-center gap-1 text-sm font-bold text-slate-950">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {br.rating.toFixed(1)}
                      </div>
                      <div className="text-[11px] text-slate-400">{br.reviewsCount.toLocaleString('en-IN')} reviews</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{br.description}</p>

                  <dl className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <dt className="text-slate-400">Min Deposit</dt>
                      <dd className="font-mono font-semibold text-slate-950 mt-0.5">{br.minDeposit}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Commission</dt>
                      <dd className="font-medium text-slate-950 mt-0.5">{br.commission}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConnectedBrokerId(isConnected ? null : br.id)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${
                      isConnected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-950 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isConnected && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                    {isConnected ? `Connected (${br.name} Sandbox)` : `Connect ${br.name}`}
                  </button>
                  <button
                    type="button"
                    onClick={onLaunchPaperTrading}
                    className="py-2.5 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Open Chart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
