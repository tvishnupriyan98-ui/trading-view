export interface IpoEntry {
  id: string;
  company: string;
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE';
  sector: string;
  priceBand: string;
  issueSize: string;
  dateLabel: string;
  status: 'Open' | 'Upcoming' | 'Listed';
  listingGainPct?: number;
  badgeColor: string;
  initials: string;
}

export interface EconomicEvent {
  id: string;
  country: 'IN' | 'US' | 'EU' | 'JP' | 'GB';
  time: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
}

export interface EarningsEvent {
  id: string;
  symbolId: string;
  symbol: string;
  company: string;
  date: string;
  epsEstimate: string;
  epsActual: string;
  revenueEstimate: string;
  surprisePct?: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  timeAgo: string;
  category: 'India' | 'Global' | 'Crypto' | 'Commodities';
  relatedSymbolId: string;
  relatedTicker: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyInr: number;
  annualMonthlyInr: number;
  popular?: boolean;
  highlights: string[];
}

export const FEATURED_IPOS: IpoEntry[] = [
  {
    id: 'ipo-lg-india',
    company: 'LG Electronics India',
    symbol: 'LGEINDIA',
    exchange: 'NSE',
    sector: 'Consumer Durables',
    priceBand: '₹1,080 – ₹1,140',
    issueSize: '₹11,607 Cr',
    dateLabel: 'Opens Dec 04',
    status: 'Upcoming',
    badgeColor: '#A50034',
    initials: 'LG',
  },
  {
    id: 'ipo-hdb',
    company: 'HDB Financial Services',
    symbol: 'HDBFS',
    exchange: 'NSE',
    sector: 'NBFC / Banking',
    priceBand: '₹700 – ₹740',
    issueSize: '₹12,500 Cr',
    dateLabel: 'Open Now',
    status: 'Open',
    badgeColor: '#1D4ED8',
    initials: 'HD',
  },
  {
    id: 'ipo-ntpc-green',
    company: 'NTPC Green Energy',
    symbol: 'NTPCGREEN',
    exchange: 'NSE',
    sector: 'Renewables',
    priceBand: '₹102 – ₹108',
    issueSize: '₹10,000 Cr',
    dateLabel: 'Listed NSE',
    status: 'Listed',
    listingGainPct: 14.8,
    badgeColor: '#059669',
    initials: 'NG',
  },
  {
    id: 'ipo-swiggy',
    company: 'Swiggy Ltd.',
    symbol: 'SWIGGY',
    exchange: 'NSE',
    sector: 'Consumer Tech',
    priceBand: '₹371 – ₹390',
    issueSize: '₹11,327 Cr',
    dateLabel: 'Listed NSE',
    status: 'Listed',
    listingGainPct: 7.7,
    badgeColor: '#EA580C',
    initials: 'SW',
  },
  {
    id: 'ipo-nsdl',
    company: 'NSDL Depository',
    symbol: 'NSDL',
    exchange: 'BSE',
    sector: 'Capital Markets',
    priceBand: '₹760 – ₹800',
    issueSize: '₹4,011 Cr',
    dateLabel: 'Opens Dec 11',
    status: 'Upcoming',
    badgeColor: '#0F766E',
    initials: 'NS',
  },
  {
    id: 'ipo-zepto',
    company: 'Zepto Commerce',
    symbol: 'ZEPTO',
    exchange: 'NSE',
    sector: 'Quick Commerce',
    priceBand: '₹485 – ₹510',
    issueSize: '₹8,500 Cr',
    dateLabel: 'DRHP Filed',
    status: 'Upcoming',
    badgeColor: '#7C3AED',
    initials: 'ZP',
  },
];

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'eco-rbi',
    country: 'IN',
    time: '10:00 IST',
    title: 'RBI MPC Repo Rate Decision',
    impact: 'High',
    actual: '6.25%',
    forecast: '6.25%',
    previous: '6.50%',
  },
  {
    id: 'eco-in-cpi',
    country: 'IN',
    time: '17:30 IST',
    title: 'India CPI Inflation Rate (YoY)',
    impact: 'High',
    actual: '4.88%',
    forecast: '5.05%',
    previous: '5.49%',
  },
  {
    id: 'eco-in-gdp',
    country: 'IN',
    time: '17:30 IST',
    title: 'India Q3 GDP Growth Rate (YoY)',
    impact: 'High',
    actual: '7.1%',
    forecast: '6.9%',
    previous: '6.7%',
  },
  {
    id: 'eco-us-fomc',
    country: 'US',
    time: '23:30 IST',
    title: 'US Federal Reserve FOMC Minutes',
    impact: 'High',
    actual: '4.50%',
    forecast: '4.50%',
    previous: '4.75%',
  },
  {
    id: 'eco-us-nfp',
    country: 'US',
    time: '19:00 IST',
    title: 'US Non-Farm Payrolls',
    impact: 'High',
    actual: '214K',
    forecast: '195K',
    previous: '188K',
  },
  {
    id: 'eco-in-pmi',
    country: 'IN',
    time: '10:30 IST',
    title: 'HSBC India Manufacturing PMI',
    impact: 'Medium',
    actual: '57.6',
    forecast: '57.1',
    previous: '57.5',
  },
  {
    id: 'eco-eu-cpi',
    country: 'EU',
    time: '15:30 IST',
    title: 'Eurozone Core CPI Flash (YoY)',
    impact: 'Medium',
    actual: '2.6%',
    forecast: '2.7%',
    previous: '2.7%',
  },
  {
    id: 'eco-jp-boj',
    country: 'JP',
    time: '08:30 IST',
    title: 'BoJ Summary of Opinions',
    impact: 'Low',
    actual: '0.50%',
    forecast: '0.50%',
    previous: '0.50%',
  },
];

export const EARNINGS_EVENTS: EarningsEvent[] = [
  {
    id: 'earn-tcs',
    symbolId: 'NSE:TCS',
    symbol: 'TCS',
    company: 'Tata Consultancy Services',
    date: 'Tomorrow · Post-Market',
    epsEstimate: '₹34.80',
    epsActual: '₹36.15',
    revenueEstimate: '₹64,920 Cr',
    surprisePct: 3.88,
  },
  {
    id: 'earn-rel',
    symbolId: 'NSE:RELIANCE',
    symbol: 'RELIANCE',
    company: 'Reliance Industries Ltd.',
    date: 'Nov 24 · Post-Market',
    epsEstimate: '₹28.40',
    epsActual: '₹29.10',
    revenueEstimate: '₹2,41,800 Cr',
    surprisePct: 2.46,
  },
  {
    id: 'earn-hdfc',
    symbolId: 'NSE:HDFCBANK',
    symbol: 'HDFCBANK',
    company: 'HDFC Bank Ltd.',
    date: 'Nov 25 · Pre-Market',
    epsEstimate: '₹22.90',
    epsActual: '₹23.45',
    revenueEstimate: '₹41,250 Cr',
    surprisePct: 2.4,
  },
  {
    id: 'earn-infy',
    symbolId: 'NSE:INFY',
    symbol: 'INFY',
    company: 'Infosys Ltd.',
    date: 'Nov 26 · Post-Market',
    epsEstimate: '₹16.40',
    epsActual: 'Pending',
    revenueEstimate: '₹41,610 Cr',
  },
  {
    id: 'earn-lt',
    symbolId: 'NSE:LT',
    symbol: 'LT',
    company: 'Larsen & Toubro Ltd.',
    date: 'Nov 27 · Post-Market',
    epsEstimate: '₹26.10',
    epsActual: 'Pending',
    revenueEstimate: '₹62,400 Cr',
  },
];

export const MARKET_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    headline: 'Nifty 50 Reclaims 25,540 as Banking & Infrastructure Heavyweights Lead Broad NSE Rally',
    summary: 'FII net inflows of ₹3,420 Cr alongside strong domestic SIP buying lifted Nifty Bank and L&T to multi-week highs during Mumbai trade.',
    source: 'NSE Desk India',
    timeAgo: '18m ago',
    category: 'India',
    relatedSymbolId: 'NSE:NIFTY',
    relatedTicker: 'NSE:NIFTY',
  },
  {
    id: 'news-2',
    headline: 'Reliance Industries Announces New Green Hydrogen Electrolyser Expansion in Jamnagar',
    summary: 'Analysts raise FY27 EBITDA projections as new energy capex moves into commercial commissioning ahead of schedule.',
    source: 'Dalal Street Wire',
    timeAgo: '42m ago',
    category: 'India',
    relatedSymbolId: 'NSE:RELIANCE',
    relatedTicker: 'NSE:RELIANCE',
  },
  {
    id: 'news-3',
    headline: 'RBI Signals Comfortable Liquidity Stance as Core CPI Moderates Below 5% Target Band',
    summary: 'Indian sovereign 10Y yields eased 4 bps following RBI liquidity commentary, supporting private banks and NBFCs.',
    source: 'India Macro Pulse',
    timeAgo: '1h ago',
    category: 'India',
    relatedSymbolId: 'NSE:HDFCBANK',
    relatedTicker: 'NSE:HDFCBANK',
  },
  {
    id: 'news-4',
    headline: 'Spot Gold Tests $3,515 Support Following Sharp Profit-Taking Across COMEX Futures',
    summary: 'Short-term momentum funds trimmed long bullion exposure as US Treasury yields firmed near the 10Y 4.98% level.',
    source: 'Global Metals Desk',
    timeAgo: '2h ago',
    category: 'Commodities',
    relatedSymbolId: 'COMEX:GC1!',
    relatedTicker: 'COMEX:GC1!',
  },
  {
    id: 'news-5',
    headline: 'Bitcoin Dominance Holds 59.2% as BTC Consolidates Above $60,100 Psychological Pivot',
    summary: 'Perpetual funding rates normalized across major exchanges while institutional spot ETF flows turned mildly positive.',
    source: 'Crypto Flow Daily',
    timeAgo: '3h ago',
    category: 'Crypto',
    relatedSymbolId: 'BITSTAMP:BTCUSD',
    relatedTicker: 'BITSTAMP:BTCUSD',
  },
  {
    id: 'news-6',
    headline: 'S&P 500 & Nasdaq 100 Edge Higher Ahead of Semiconductor & Cloud Infrastructure Updates',
    summary: 'Mega-cap tech breadth improved with US yield curve steepening modestly between the 3Y and 20Y tenors.',
    source: 'Wall Street Brief',
    timeAgo: '4h ago',
    category: 'Global',
    relatedSymbolId: 'SP:SPX',
    relatedTicker: 'SP:SPX',
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    tagline: 'Distraction-free trading and investing with more charts and indicators.',
    monthlyInr: 1295,
    annualMonthlyInr: 1080,
    highlights: [
      '2 charts per tab',
      '5 indicators per chart',
      '20 active price alerts',
      'Ad-free experience & volume profile',
      'Windows, Linux & Android PWA sync',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Intraday technical analysis for active NSE/BSE & FX day traders.',
    monthlyInr: 2595,
    annualMonthlyInr: 2160,
    popular: true,
    highlights: [
      '4 charts per tab',
      '10 indicators per chart',
      '100 active price & technical alerts',
      'Pine Script® Strategy Tester',
      'Custom chart layouts & offline cache',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Highest precision and maximum data to capture every opportunity.',
    monthlyInr: 5195,
    annualMonthlyInr: 4320,
    highlights: [
      '8 charts per tab',
      '25 indicators per chart',
      '400 active alerts with webhooks',
      'Second-based intervals & deep backtesting',
      'Auto chart patterns & priority feeds',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    tagline: 'Institutional-grade multi-monitor power for professional desks.',
    monthlyInr: 16995,
    annualMonthlyInr: 14160,
    highlights: [
      '16 charts per tab',
      '50 indicators per chart',
      '1,000 server-side alerts & webhooks',
      'Multi-exchange NSE/BSE/CME/COMEX bundles',
      'Dedicated desktop & Android desk sync',
    ],
  },
];
