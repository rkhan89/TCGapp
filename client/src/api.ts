import type { SearchResult, PriceData } from './types';
import { setCacheEntry, getCacheEntry } from './utils/offlineCache';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function searchCards(query: string, game?: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (game && game !== 'all') params.set('game', game);
  const cacheKey = `search_${query}_${game ?? 'all'}`;

  try {
    const res = await fetch(`${BASE}/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    setCacheEntry(cacheKey, data.results);
    return data.results as SearchResult[];
  } catch (err) {
    const cached = getCacheEntry<SearchResult[]>(cacheKey);
    if (cached) return cached.data;
    throw err;
  }
}

export interface GradedResult {
  avg: number | null;
  low: number | null;
  high: number | null;
  count: number;
  sales: { title: string; price: number; date: string }[];
}

export async function getGradedPrices(
  name: string, setName: string, company: string, grade: string
): Promise<GradedResult> {
  const params = new URLSearchParams({ name, setName, company, grade });
  const res = await fetch(`${BASE}/graded?${params}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function getCardPrices(card: SearchResult): Promise<PriceData> {
  const params = new URLSearchParams();
  if (card.setId) params.set('setId', String(card.setId));
  if (card.categoryId) params.set('categoryId', String(card.categoryId));
  const cacheKey = `prices_${card.productId}`;

  try {
    const res = await fetch(`${BASE}/prices/${card.productId}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch prices');
    const data = await res.json();
    setCacheEntry(cacheKey, data);
    return data as PriceData;
  } catch (err) {
    const cached = getCacheEntry<PriceData>(cacheKey);
    if (cached) return cached.data;
    throw err;
  }
}
