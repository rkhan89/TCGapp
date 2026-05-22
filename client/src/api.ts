import type { SearchResult, PriceData } from './types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function searchCards(query: string, game?: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (game && game !== 'all') params.set('game', game);

  const res = await fetch(`${BASE}/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return data.results as SearchResult[];
}

export async function getCardPrices(card: SearchResult): Promise<PriceData> {
  const params = new URLSearchParams();
  if (card.setId) params.set('setId', String(card.setId));
  if (card.categoryId) params.set('categoryId', String(card.categoryId));

  const res = await fetch(`${BASE}/prices/${card.productId}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json() as Promise<PriceData>;
}
