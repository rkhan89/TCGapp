import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

const SEARCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.tcgplayer.com',
  'Referer': 'https://www.tcgplayer.com/',
  'Content-Type': 'application/json',
};

const PRICE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

export interface SearchResult {
  productId: number;
  name: string;
  setName: string;
  imageUrl: string;
  productUrl: string;
  game: string;
  number?: string;
  rarity?: string;
  marketPrice?: number;
  lowestPrice?: number;
  setId?: number;
  categoryId?: number;
}

export interface PriceData {
  productId: number;
  name: string;
  setName: string;
  imageUrl: string;
  productUrl: string;
  game: string;
  number?: string;
  rarity?: string;
  prices: {
    market: number | null;
    low: number | null;
    mid: number | null;
    high: number | null;
    directLow: number | null;
  };
  recentSales: SaleRecord[];
}

export interface SaleRecord {
  date: string;
  condition: string;
  quantity: number;
  price: number;
}

const GAME_LINE_NAMES: Record<string, string[]> = {
  pokemon: ['pokemon'],
  'one piece': ['one piece card game'],
  magic: ['magic'],
  yugioh: ['yugioh'],
  lorcana: ['lorcana'],
  digimon: ['digimon'],
};

export async function searchCards(query: string, game?: string): Promise<SearchResult[]> {
  const cacheKey = `search:${query}:${game || 'all'}`;
  const cached = cache.get<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const filters: Record<string, unknown> = {
    range: {},
    match: { productName: query },
  };

  if (game && GAME_LINE_NAMES[game.toLowerCase()]) {
    filters.term = { productLineName: GAME_LINE_NAMES[game.toLowerCase()] };
  } else {
    filters.term = {};
  }

  const body = { search: query, size: 24, filters };

  try {
    const response = await axios.post(
      'https://mp-search-api.tcgplayer.com/v1/search/request',
      body,
      { headers: SEARCH_HEADERS, timeout: 12000 }
    );

    const items: any[] = response.data?.results?.[0]?.results ?? [];
    const results: SearchResult[] = items.map((item) => ({
      productId: Math.round(item.productId),
      name: item.productName ?? '',
      setName: item.setName ?? '',
      imageUrl: `https://product-images.tcgplayer.com/fit-in/400x400/${Math.round(item.productId)}.jpg`,
      productUrl: `https://www.tcgplayer.com/product/${Math.round(item.productId)}`,
      game: item.productLineName ?? '',
      number: item.customAttributes?.number ?? undefined,
      rarity: item.rarityName ?? undefined,
      marketPrice: item.marketPrice ?? undefined,
      lowestPrice: item.lowestPrice ?? undefined,
      setId: item.setId ? Math.round(item.setId) : undefined,
      categoryId: item.productLineId ? Math.round(item.productLineId) : undefined,
    }));

    cache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.error('TCGplayer search error:', err);
    return [];
  }
}

export async function getCardPrices(
  productId: number,
  setId?: number,
  categoryId?: number
): Promise<PriceData | null> {
  const cacheKey = `prices:${productId}`;
  const cached = cache.get<PriceData>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch pricepoints (market + listedMedian)
    const pricePointsRes = await axios.get(
      `https://mpapi.tcgplayer.com/v2/product/${productId}/pricepoints`,
      { headers: PRICE_HEADERS, timeout: 10000 }
    ).catch(() => null);

    const priceArr: any[] = Array.isArray(pricePointsRes?.data) ? pricePointsRes!.data : [];
    const normal = priceArr.find((p) => p.printingType?.toLowerCase() === 'normal');
    const foil = priceArr.find((p) => p.printingType?.toLowerCase() === 'foil');
    const primary = normal ?? foil ?? {};

    let market: number | null = primary.marketPrice ?? null;
    let low: number | null = null;
    let mid: number | null = primary.listedMedianPrice ?? null;
    let high: number | null = null;
    let directLow: number | null = null;

    // Fetch full price data from tcgcsv.com — provides low/mid/high/market/directLow
    if (setId && categoryId) {
      const csvRes = await axios.get(
        `https://tcgcsv.com/tcgplayer/${categoryId}/${setId}/prices`,
        { headers: PRICE_HEADERS, timeout: 8000 }
      ).catch(() => null);

      const csvItems: any[] = csvRes?.data?.results ?? [];
      // Prefer Normal subtype, fall back to any entry for this productId
      const csvEntry = csvItems.find((p) => p.productId === productId && p.subTypeName === 'Normal')
        ?? csvItems.find((p) => p.productId === productId);

      if (csvEntry) {
        market = csvEntry.marketPrice ?? market;
        low = csvEntry.lowPrice ?? low;
        mid = csvEntry.midPrice ?? mid;
        high = csvEntry.highPrice ?? high;
        directLow = csvEntry.directLowPrice ?? directLow;
      }
    }

    const result: PriceData = {
      productId,
      name: '',
      setName: '',
      imageUrl: `https://product-images.tcgplayer.com/fit-in/400x400/${productId}.jpg`,
      productUrl: `https://www.tcgplayer.com/product/${productId}`,
      game: '',
      prices: { market, low, mid, high, directLow },
      recentSales: [],
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('TCGplayer price fetch error:', err);
    return null;
  }
}
