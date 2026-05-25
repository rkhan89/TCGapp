import { useState, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  prices: { market: number | null; low: number | null; mid: number | null; high: number | null; directLow: number | null; };
  salesStats: { avg: number; low: number; high: number } | null;
}

type BaseKey = 'market' | 'salesAvg' | 'salesLow' | 'salesHigh' | 'custom';
const PRESETS = [50, 60, 70, 75, 80, 85, 90, 95];

export default function PriceCalculator({ prices, salesStats }: Props) {
  const { fmt, currency } = useCurrency();
  const [baseKey, setBaseKey] = useState<BaseKey>('market');
  const [customBase, setCustomBase] = useState('');
  const [percent, setPercent] = useState(80);

  const baseOptions = ([
    { key: 'market' as BaseKey,    label: 'Market',     value: prices.market },
    { key: 'salesAvg' as BaseKey,  label: 'Avg Sale',   value: salesStats?.avg ?? null },
    { key: 'salesLow' as BaseKey,  label: 'Low Sale',   value: salesStats?.low ?? null },
    { key: 'salesHigh' as BaseKey, label: 'High Sale',  value: salesStats?.high ?? null },
    { key: 'custom' as BaseKey,    label: 'Vendor Price', value: null },
  ] as { key: BaseKey; label: string; value: number | null }[]).filter(o => o.key === 'custom' || o.value != null);

  const baseValueUsd = useMemo(() => {
    if (baseKey === 'custom') return parseFloat(customBase) || null;
    return baseOptions.find(o => o.key === baseKey)?.value ?? null;
  }, [baseKey, customBase, baseOptions]);

  const result = baseValueUsd != null ? (baseValueUsd * percent) / 100 : null;

  const symbols: Record<string, string> = { USD: '$', GBP: '£', AED: 'AED' };
  const sym = symbols[currency] ?? '$';

  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
        Selling Calculator
      </p>

      {/* Vendor price banner — always visible, prominent */}
      <div
        onClick={() => setBaseKey('custom')}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: baseKey === 'custom' ? 'var(--accent)' : 'var(--surface2)',
          border: `1.5px solid ${baseKey === 'custom' ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          cursor: 'pointer', transition: 'all 0.2s ease',
        }}
      >
        <Tag size={16} color={baseKey === 'custom' ? 'var(--accent-fg)' : 'var(--text2)'} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: baseKey === 'custom' ? 'var(--accent-fg)' : 'var(--text)' }}>
            Vendor Price
          </p>
          <p style={{ fontSize: 11, margin: '1px 0 0', color: baseKey === 'custom' ? 'rgba(255,255,255,0.65)' : 'var(--text3)' }}>
            Enter the price tag on the card
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: baseKey === 'custom' ? 'rgba(255,255,255,0.7)' : 'var(--text3)',
            fontSize: 14, pointerEvents: 'none', fontWeight: 600,
          }}>{sym}</span>
          <input
            type="number" min="0" step="0.01"
            value={customBase}
            onChange={e => { setCustomBase(e.target.value); setBaseKey('custom'); }}
            onClick={e => e.stopPropagation()}
            placeholder="0.00"
            style={{
              width: 90,
              background: baseKey === 'custom' ? 'rgba(255,255,255,0.15)' : 'var(--surface)',
              border: `1px solid ${baseKey === 'custom' ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: `8px 8px 8px ${sym.length > 1 ? '44px' : '24px'}`,
              fontSize: 14, fontWeight: 700,
              color: baseKey === 'custom' ? 'var(--accent-fg)' : 'var(--text)',
              outline: 'none',
            }}
            onFocus={() => setBaseKey('custom')}
          />
        </div>
      </div>

      {/* Other base options */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px' }}>Or use market data</p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {baseOptions.filter(o => o.key !== 'custom').map(opt => (
            <button key={opt.key} className={`pill${baseKey === opt.key ? ' active' : ''}`} onClick={() => setBaseKey(opt.key)} style={{ fontSize: 13 }}>
              {opt.label}
              {opt.value != null && (
                <span style={{ marginLeft: 5, opacity: baseKey === opt.key ? 0.65 : 0.5, fontSize: 12 }}>
                  {fmt(opt.value)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Percentage */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>Percentage</p>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{percent}%</span>
        </div>
        <input type="range" min="1" max="150" value={percent} onChange={e => setPercent(Number(e.target.value))} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p} className={`pill${percent === p ? ' active' : ''}`} onClick={() => setPercent(p)} style={{ fontSize: 12, padding: '5px 12px' }}>
              {p}%
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 2px' }}>{percent}% of {fmt(baseValueUsd)}</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>Suggested buying price</p>
        </div>
        <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)' }}>
          {fmt(result)}
        </span>
      </div>
    </div>
  );
}
