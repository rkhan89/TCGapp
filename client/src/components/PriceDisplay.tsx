import { useMemo } from 'react';
import { ArrowLeft, ExternalLink, TrendingDown, TrendingUp, Minus, Plus, Check, Bookmark } from 'lucide-react';
import type { PriceData } from '../types';
import PriceCalculator from './PriceCalculator';
import GradedPrices from './GradedPrices';
import PriceTrendChart from './PriceTrendChart';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  data: PriceData;
  onBack: () => void;
  onAdd: () => void;
  isAdded: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export default function PriceDisplay({ data, onBack, onAdd, isAdded, isBookmarked, onToggleBookmark }: Props) {
  const { fmt } = useCurrency();
  const { prices, recentSales } = data;

  const salesStats = useMemo(() => {
    if (!recentSales.length) return null;
    const vals = [...recentSales].map(s => s.price).sort((a, b) => a - b);
    const sum = vals.reduce((a, b) => a + b, 0);
    return { avg: sum / vals.length, low: vals[0], high: vals[vals.length - 1], count: vals.length };
  }, [recentSales]);

  const priceCards = [
    { label: 'Market', value: prices.market, highlight: true },
    { label: 'Low',    value: prices.low,    highlight: false },
    { label: 'Mid',    value: prices.mid,    highlight: false },
    { label: 'High',   value: prices.high,   highlight: false },
  ].filter(p => p.value != null);

  return (
    <div>
      <div className="animate-fade-in" style={{ paddingTop: 20, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 14, fontWeight: 500, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
          <ArrowLeft size={16} /> Back to search
        </button>
      </div>

      {/* Card hero */}
      <div className="card animate-fade-up" style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 200, background: 'var(--surface2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={data.imageUrl} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px) brightness(0.55)', transform: 'scale(1.15)', pointerEvents: 'none' }} />
          <img src={data.imageUrl} alt={data.name} style={{ position: 'relative', height: 170, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 28px rgba(0,0,0,0.6))', borderRadius: 8, zIndex: 1 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div style={{ padding: '20px 20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>{data.name}</h2>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={onToggleBookmark} title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                style={{ width: 36, height: 36, borderRadius: 999, border: '1px solid var(--border)', background: isBookmarked ? 'var(--accent)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <Bookmark size={14} fill={isBookmarked ? 'var(--accent-fg)' : 'none'} color={isBookmarked ? 'var(--accent-fg)' : 'var(--text2)'} />
              </button>
              <button onClick={onAdd} disabled={isAdded} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 999, border: 'none', background: isAdded ? 'var(--surface2)' : 'var(--accent)', color: isAdded ? 'var(--text3)' : 'var(--accent-fg)', fontSize: 13, fontWeight: 700, cursor: isAdded ? 'default' : 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                {isAdded ? <><Check size={13} /> Added</> : <><Plus size={13} /> Add</>}
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 12px' }}>{data.setName}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {data.game   && <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text2)', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--border)' }}>{data.game}</span>}
            {data.number && <span style={{ fontSize: 12, background: 'var(--surface2)', color: 'var(--text3)', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--border)' }}>#{data.number}</span>}
            {data.rarity && <span style={{ fontSize: 12, background: 'var(--surface2)', color: 'var(--text3)', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--border)' }}>{data.rarity}</span>}
          </div>
          <a href={data.productUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--text2)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
            View on TCGplayer <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Prices */}
      {priceCards.length > 0 && (
        <div className="animate-fade-up stagger-1" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>TCGplayer Prices</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {priceCards.map(({ label, value, highlight }) => (
              <div key={label} className="card" style={{ padding: '16px 18px', background: highlight ? 'var(--accent)' : 'var(--surface)', border: highlight ? 'none' : '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px', color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: highlight ? 'var(--accent-fg)' : 'var(--text)' }}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sales */}
      {salesStats && (
        <div className="animate-fade-up stagger-2" style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Recent Sales · {salesStats.count} transactions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {[
              { label: 'Average', value: salesStats.avg, icon: <Minus size={13} />, color: 'var(--text2)' },
              { label: 'Lowest',  value: salesStats.low, icon: <TrendingDown size={13} />, color: '#22c55e' },
              { label: 'Highest', value: salesStats.high, icon: <TrendingUp size={13} />, color: '#ef4444' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, color }}>{icon}<span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span></div>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.4px', color: 'var(--text)' }}>{fmt(value)}</p>
              </div>
            ))}
          </div>
          <details className="card" style={{ overflow: 'hidden' }}>
            <summary style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text2)', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
              <span>Recent sales</span><span style={{ fontSize: 11, color: 'var(--text3)' }}>▾</span>
            </summary>
            <div style={{ borderTop: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto' }}>
              {recentSales.map((sale, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < recentSales.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', width: 70 }}>{sale.date ? new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{sale.condition}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmt(sale.price)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {recentSales.length >= 2 && (
        <div className="animate-fade-up stagger-2" style={{ marginBottom: 14 }}>
          <PriceTrendChart sales={recentSales} />
        </div>
      )}

      <div className="animate-fade-up stagger-3" style={{ marginBottom: 14 }}>
        <GradedPrices cardName={data.name} setName={data.setName} />
      </div>

      <div className="animate-fade-up stagger-3">
        <PriceCalculator prices={prices} salesStats={salesStats} />
      </div>
    </div>
  );
}
