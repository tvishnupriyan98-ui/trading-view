export type AssetClass = 'india_stock' | 'index' | 'crypto' | 'forex' | 'futures';

export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';

export type ChartStyle = 'candles' | 'hollow' | 'heikin' | 'line' | 'area';

export type DrawingTool = 'crosshair' | 'trendline' | 'hline' | 'fib' | 'measure';

export type AppView = 'home' | 'chart' | 'markets' | 'news' | 'community' | 'brokers' | 'pricing' | 'apps';

export interface PriceAlert {
  id: string;
  symbolId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: string;
}

export interface MarketSymbol {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  assetClass: AssetClass;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCapBillions?: number;
  peRatio?: number;
  sector?: string;
  high52w: number;
  low52w: number;
  badgeColor: string;
  badgeText: string;
  seed: number;
  volatility: number;
  unitLabel?: string;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  ema20: boolean;
  ema50: boolean;
  sma200: boolean;
  bollinger: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

export interface ChartDrawing {
  id: string;
  tool: Exclude<DrawingTool, 'crosshair'>;
  index1: number;
  price1: number;
  index2: number;
  price2: number;
  color: string;
}

export interface CommunityIdea {
  id: string;
  symbolId: string;
  displaySymbol: string;
  exchange: string;
  title: string;
  summary: string;
  direction: 'Long' | 'Short' | 'Neutral';
  author: string;
  timeframe: Timeframe;
  category: 'Editors picks' | 'Popular' | 'India' | 'Crypto' | 'Commodities';
  likes: number;
  comments: number;
  publishedAgo: string;
  featured: boolean;
}

export interface BrokerInfo {
  id: string;
  name: string;
  region: 'India' | 'Global';
  badge?: string;
  assets: string;
  rating: number;
  ratingLabel: string;
  reviewsCount: number;
  minDeposit: string;
  commission: string;
  accentColor: string;
  initials: string;
  description: string;
}

export interface PaperPosition {
  id: string;
  symbolId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  entryPrice: number;
  openedAt: string;
}

export interface TechnicalRatingResult {
  score: number; // -1 to +1
  label: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';
  buySignals: number;
  neutralSignals: number;
  sellSignals: number;
  rsiValue: number;
}
