import { useState, useEffect } from 'react';
import { Sun, Moon, ShoppingBag } from 'lucide-react';
import CardSearch from './components/CardSearch';
import PriceDisplay from './components/PriceDisplay';
import CardScanner from './components/CardScanner';
import Collection from './components/Collection';
import type { SearchResult, PriceData, CollectionItem } from './types';
import { getCardPrices } from './api';
import './index.css';

type View = 'search' | 'prices';

export default function App() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [view, setView] = useState<View>('search');
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanQuery, setScanQuery] = useState('');
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [showCollection, setShowCollection] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

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
    // Don't add duplicates
    if (collection.some(i => i.card.productId === card.productId)) return;
    const item: CollectionItem = {
      id: `${card.productId}-${Date.now()}`,
      card,
      priceData: data,
      included: true,
      addedAt: Date.now(),
    };
    setCollection(prev => [...prev, item]);
  };

  const handleToggleIncluded = (id: string) => {
    setCollection(prev => prev.map(i => i.id === id ? { ...i, included: !i.included } : i));
  };

  const handleRemove = (id: string) => {
    setCollection(prev => prev.filter(i => i.id !== id));
  };

  const includedCount = collection.filter(i => i.included).length;
  const isInCollection = selectedCard != null && collection.some(i => i.card.productId === selectedCard.productId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: 22 }}>🃏</span>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px', color: 'var(--text)' }}>TCGPricer</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Collection button */}
            <button
              onClick={() => setShowCollection(true)}
              style={{
                height: 38, padding: '0 14px',
                borderRadius: 999,
                background: collection.length > 0 ? 'var(--accent)' : 'var(--surface2)',
                border: `1px solid ${collection.length > 0 ? 'transparent' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer',
                color: collection.length > 0 ? 'var(--accent-fg)' : 'var(--text2)',
                transition: 'all 0.2s ease',
                fontWeight: 600, fontSize: 13,
              }}
            >
              <ShoppingBag size={15} />
              {collection.length > 0 ? includedCount : null}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(d => !d)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text2)',
                transition: 'all 0.2s ease',
              }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 40px' }}>
        {view === 'search' && (
          <CardSearch
            onSelect={handleCardSelect}
            onScanClick={() => setShowScanner(true)}
            prefilledQuery={scanQuery}
          />
        )}

        {view === 'prices' && (
          <>
            {loadingPrices && selectedCard && (
              <PriceSkeleton card={selectedCard} onBack={handleBack} />
            )}
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
              />
            )}
          </>
        )}
      </main>

      {showScanner && (
        <CardScanner onDetected={handleScanDetected} onClose={() => setShowScanner(false)} />
      )}

      {showCollection && (
        <Collection
          items={collection}
          onToggleIncluded={handleToggleIncluded}
          onRemove={handleRemove}
          onClose={() => setShowCollection(false)}
        />
      )}
    </div>
  );
}

function PriceSkeleton({ card, onBack }: { card: SearchResult; onBack: () => void }) {
  return (
    <div className="animate-fade-in" style={{ paddingTop: 24 }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        ← Back
      </button>
      <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 24, width: '70%' }} />
          <div className="skeleton" style={{ height: 16, width: '45%' }} />
          <div className="skeleton" style={{ height: 14, width: '30%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[0,1,2,3].map(i => <div key={i} className="skeleton card" style={{ height: 86 }} />)}
      </div>
      <div className="skeleton card" style={{ height: 220 }} />
    </div>
  );
}
