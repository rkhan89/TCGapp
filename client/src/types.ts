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

export interface CollectionItem {
  id: string;
  card: SearchResult;
  priceData: PriceData;
  included: boolean;
  addedAt: number;
  quantity: number;
  customPrice?: number;
}

export interface BookmarkedCard {
  card: SearchResult;
  bookmarkedAt: number;
}
