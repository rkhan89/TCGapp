import { useState, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, Camera, Star } from 'lucide-react';
import type { SearchResult } from '../types';
import { searchCards } from '../api';

const GAMES = [
  { value: 'all', label: 'All' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'one piece', label: 'One Piece' },
  { value: 'magic', label: 'Magic' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'lorcana', label: 'Lorcana' },
  { value: 'digimon', label: 'Digimon' },
];

interface Props {
  onSelect: (card: SearchResult) => void;
  onScanClick: () => void;
  prefilledQuery?: string;
}

export default function CardSearch({ onSelect, onScanClick, prefilledQuery }: Props) {
  const [query, setQuery] = useState(prefilledQuery || '');
  const [game, setGame] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, g: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true); setError('');
    try {
      const res = await searchCards(q.trim(), g === 'all' ? undefined : g);
      setResults(res); setSearched(true);
    } catch {
      setError('Search failed. Make sure the server is running.');
    } finally { setLoading(false); }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value, game), 450);
  };

  const handleGame = (value: string) => {
    setGame(value);
    if (query.trim().length >= 2) doSearch(query, value);
  };

  return (
    <div>
      {/* Hero heading */}
      <div className="animate-fade-up" style={{ paddingTop: 32, marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.7px', margin: 0, color: 'var(--text)', lineHeight: 1.15 }}>
          Card Price Lookup
        </h1>
        <p style={{ marginTop: 6, color: 'var(--text2)', fontSize: 15 }}>
          Search any TCG card for instant market prices
        </p>
      </div>

      {/* Search bar */}
      <div className="animate-fade-up stagger-1" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Search cards..."
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '13px 14px 13px 40px',
                fontSize: 15,
                color: 'var(--text)',
                outline: 'none',
                boxShadow: 'var(--card-shadow)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--text3)'; e.target.style.boxShadow = 'var(--card-shadow-hover)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'var(--card-shadow)'; }}
            />
          </div>
          <button
            onClick={onScanClick}
            title="Scan card"
            style={{
              width: 48, height: 48, flexShrink: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text2)',
              boxShadow: 'var(--card-shadow)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--text3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            <Camera size={18} />
          </button>
        </div>
      </div>

      {/* Game filter pills */}
      <div className="animate-fade-up stagger-2" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, scrollbarWidth: 'none' }}>
        {GAMES.map(g => (
          <button key={g.value} className={`pill${game === g.value ? ' active' : ''}`} onClick={() => handleGame(g.value)}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 16, display: 'flex', gap: 14, animationDelay: `${i * 0.06}s` }}>
              <div className="skeleton" style={{ width: 52, height: 72, flexShrink: 0, borderRadius: 10 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                <div className="skeleton" style={{ height: 16, width: '65%' }} />
                <div className="skeleton" style={{ height: 13, width: '45%' }} />
                <div className="skeleton" style={{ height: 12, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 24 }}>{error}</p>}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="animate-fade-up" style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>No cards found for "{query}"</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map((card, i) => (
            <button
              key={card.productId}
              onClick={() => onSelect(card)}
              className={`card card-pressable animate-fade-up stagger-${Math.min(i + 1, 5)}`}
              style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                textAlign: 'left', width: '100%',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              <div style={{
                width: 52, height: 72, flexShrink: 0,
                borderRadius: 10, overflow: 'hidden',
                background: 'var(--surface2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 72"><rect fill="%23e4e4e7" width="52" height="72"/><text x="26" y="40" text-anchor="middle" fill="%23a1a1aa" font-size="20">?</text></svg>'; }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
                  {card.name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {card.setName}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {card.game && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)' }}>
                      {card.game}
                    </span>
                  )}
                  {card.rarity && (
                    <span style={{ fontSize: 11, color: 'var(--text3)', padding: '2px 0' }}>
                      {card.rarity}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {card.marketPrice != null && (
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                    ${card.marketPrice.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>→</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="animate-fade-up stagger-3" style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Popular searches
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Charizard ex', 'Pikachu', 'Luffy', 'Black Lotus', 'Mimikyu'].map(term => (
              <button
                key={term}
                className="pill"
                onClick={() => { setQuery(term); doSearch(term, game); }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
