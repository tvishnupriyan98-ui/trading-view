import { Check } from 'lucide-react';
import { useState } from 'react';
import { PRICING_PLANS } from '../extraData';

interface PricingViewProps {
  onStartFreeChart: () => void;
}

export function PricingView({ onStartFreeChart }: PricingViewProps) {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white text-slate-950 py-10 px-4 lg:px-8">
      <div className="max-w-[1280px] mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
            Plans for every market &amp; trader
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            All prices displayed in Indian Rupees (₹). Start free forever or unlock multi-chart layouts and Pine Script® deep backtesting.
          </p>

          <div className="pt-2 inline-flex items-center p-1 bg-slate-100 rounded-xl" role="tablist" aria-label="Billing period">
            <button
              type="button"
              role="tab"
              aria-selected={billing === 'annual'}
              onClick={() => setBilling('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                billing === 'annual' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Annually (Save 16%)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === 'monthly'}
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                billing === 'monthly' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {selectedPlan && (
          <div
            role="status"
            className="max-w-xl mx-auto p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-4"
          >
            <span>
              <strong>{selectedPlan}</strong> trial activated locally — enjoy all Supercharts, Pine Script® Tester, and Paper Trading tools immediately.
            </span>
            <button
              type="button"
              onClick={onStartFreeChart}
              className="px-3 py-1.5 rounded-md bg-emerald-700 text-white font-semibold whitespace-nowrap hover:bg-emerald-800"
            >
              Open Supercharts
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING_PLANS.map((plan) => {
            const price = billing === 'annual' ? plan.annualMonthlyInr : plan.monthlyInr;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border ${
                  plan.popular ? 'border-[#2962FF] ring-1 ring-[#2962FF]/20 bg-blue-50/20' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold text-slate-950">{plan.name}</h2>
                    {plan.popular && (
                      <span className="text-[11px] font-bold text-[#2962FF] uppercase tracking-wide">Popular</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">{plan.tagline}</p>

                  <div className="font-mono tabular-nums">
                    <span className="text-3xl font-extrabold text-slate-950">₹{price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-500"> / mo</span>
                    {billing === 'annual' && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Billed ₹{(price * 12).toLocaleString('en-IN')} yearly
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors ${
                    plan.popular
                      ? 'bg-[#2962FF] text-white hover:bg-blue-700'
                      : 'bg-slate-950 text-white hover:bg-slate-800'
                  }`}
                >
                  Start 30-day free trial
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
