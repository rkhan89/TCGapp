import { useState, useEffect } from 'react';
import { Sun, Moon, ShoppingBag } from 'lucide-react';
import CardSearch from './components/CardSearch';
import PriceDisplay from './components/PriceDisplay';
import CardScanner from './components/CardScanner';
import Collection from './components/Collection';
import { CurrencyProvider, useCurrency, type Currency } from './context/CurrencyContext';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { SearchResult, PriceData, CollectionItem, BookmarkedCard } from './types';
import { getCardPrices } from './api';
import './index.css';

type View = 'search' | 'prices';

const CURRENCIES: Currency[] = ['USD', 'GBP', 'AED'];

export default function App() {
  return (
    <CurrencyProvider>
      <AppInner />
    </CurrencyProvider>
  );
}

function AppInner() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [view, setView] = useState<View>('search');
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanQuery, setScanQuery] = useState('');
  const [showCollection, setShowCollection] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const [collection, setCollection] = useLocalStorage<CollectionItem[]>('tcg-collection', []);
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkedCard[]>('tcg-bookmarks', []);
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('tcg-history', []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const addToHistory = (query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      return [query, ...filtered].slice(0, 8);
    });
  };

  const handleCardSelect = async (card: SearchResult) => {
    setSelectedCard(card);
    setLoadingPrices(true);
    setPriceError('');
    setView('prices');
    try {
      const data = await getCardPrices(card);
      setPriceData({
        ...data,
        name: data.name || card.name,
        setName: data.setName || card.setName,
        imageUrl: data.imageUrl || card.imageUrl,
        game: data.game || card.game,
        number: data.number || card.number,
        rarity: data.rarity || card.rarity,
      });
    } catch {
      setPriceError('Failed to load price data.');
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleBack = () => {
    setView('search');
    setSelectedCard(null);
    setPriceData(null);
    setPriceError('');
  };

  const handleScanDetected = (text: string) => {
    setShowScanner(false);
    setScanQuery(text);
    setView('search');
  };

  const handleAddToCollection = (card: SearchResult, data: PriceData) => {
    if (collection.some(i => i.card.productId === card.productId)) return;
    setCollection(prev => [...prev, {
      id: `${card.productId}-${Date.now()}`,
      card, priceData: data, included: true, addedAt: Date.now(),
      quantity: 1,
    }]);
  };

  const handleToggleBookmark = (card: SearchResult) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.card.productId === card.productId);
      if (exists) return prev.filter(b => b.card.productId !== card.productId);
      return [{ card, bookmarkedAt: Date.now() }, ...prev];
    });
  };

  const includedCount = collection.filter(i => i.included).length;
  const isInCollection = selectedCard != null && collection.some(i => i.card.productId === selectedCard.productId);
  const isBookmarked = selectedCard != null && bookmarks.some(b => b.card.productId === selectedCard.productId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', transition: 'background 0.3s ease' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 4 }}>
            <span style={{ fontSize: 20 }}>🃏</span>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: 'var(--text)' }}>TCGPricer</span>
          </button>

          <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 999, padding: 3, gap: 2 }}>
            {CURRENCIES.map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{ padding: '4px 10px', borderRadius: 999, border: 'none', background: currency === c ? 'var(--accent)' : 'transparent', color: currency === c ? 'var(--accent-fg)' : 'var(--text3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s ease' }}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={() => setShowCollection(true)} style={{ height: 34, padding: '0 12px', borderRadius: 999, background: collection.length > 0 ? 'var(--accent)' : 'var(--surface2)', border: `1px solid ${collection.length > 0 ? 'transparent' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: collection.length > 0 ? 'var(--accent-fg)' : 'var(--text2)', transition: 'all 0.2s ease', fontWeight: 600, fontSize: 13 }}>
            <ShoppingBag size={14} />
            {collection.length > 0 ? includedCount : null}
          </button>

          <button onClick={() => setDark(d => !d)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)', transition: 'all 0.2s ease' }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 40px' }}>
        {view === 'search' && (
          <CardSearch
            onSelect={handleCardSelect}
            onScanClick={() => setShowScanner(true)}
            prefilledQuery={scanQuery}
            searchHistory={searchHistory}
            bookmarks={bookmarks}
            onAddToHistory={addToHistory}
            onSelectBookmark={handleCardSelect}
            onRemoveHistory={q => setSearchHistory(prev => prev.filter(h => h !== q))}
          />
        )}
        {view === 'prices' && (
          <>
            {loadingPrices && selectedCard && <PriceSkeleton onBack={handleBack} />}
            {priceError && (
              <div className="animate-fade-up" style={{ paddingTop: 48, textAlign: 'center' }}>
                <p style={{ color: '#ef4444', marginBottom: 16 }}>{priceError}</p>
                <button className="pill active" onClick={handleBack}>Back to search</button>
              </div>
            )}
            {!loadingPrices && priceData && selectedCard && (
              <PriceDisplay
                data={priceData}
                onBack={handleBack}
                onAdd={() => handleAddToCollection(selectedCard, priceData)}
                isAdded={isInCollection}
                isBookmarked={isBookmarked}
                onToggleBookmark={() => handleToggleBookmark(selectedCard)}
              />
            )}
          </>
        )}
      </main>

      {showScanner && <CardScanner onDetected={handleScanDetected} onClose={() => setShowScanner(false)} />}
      {showCollection && (
        <Collection
          items={collection}
          onToggleIncluded={id => setCollection(prev => prev.map(i => i.id === id ? { ...i, included: !i.included } : i))}
          onRemove={id => setCollection(prev => prev.filter(i => i.id !== id))}
          onUpdateQuantity={(id, qty) => setCollection(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))}
          onSetCustomPrice={(id, price) => setCollection(prev => prev.map(i => i.id === id ? { ...i, customPrice: price } : i))}
          onClose={() => setShowCollection(false)}
        />
      )}
    </div>
  );
}

function PriceSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="animate-fade-in" style={{ paddingTop: 24 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Back</button>
      <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 24, width: '70%' }} />
          <div className="skeleton" style={{ height: 16, width: '45%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[0,1,2,3].map(i => <div key={i} className="skeleton card" style={{ height: 86 }} />)}
      </div>
      <div className="skeleton card" style={{ height: 220 }} />
    </div>
  );
}
