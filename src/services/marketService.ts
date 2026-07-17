// Market data service — quotes, candles, news, sessions, watchlist

import { apiGet } from './apiClient';
import type { MarketQuote, WatchlistItem, Candle, CandleRequest, NewsEvent, MarketStatus } from '../types';

export const marketService = {
  getQuote: (symbol: string) =>
    apiGet<MarketQuote>(`/market/quote/${symbol}`),

  getQuotes: (symbols?: string[]) =>
    apiGet<MarketQuote[]>(`/market/quotes${symbols ? `?symbols=${symbols.join(',')}` : ''}`),

  getWatchlist: () =>
    apiGet<WatchlistItem[]>('/market/watchlist'),

  getCandles: (params: CandleRequest) => {
    const query = new URLSearchParams({
      symbol: params.symbol,
      timeframe: params.timeframe,
    });
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.limit) query.set('limit', String(params.limit));
    return apiGet<Candle[]>(`/market/candles?${query}`);
  },

  getNews: () =>
    apiGet<NewsEvent[]>('/market/news'),

  getMarketStatus: () =>
    apiGet<MarketStatus>('/market/status'),
};
