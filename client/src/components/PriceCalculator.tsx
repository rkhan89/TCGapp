import { useState, useMemo } from 'react';
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

  const baseOptions: { key: BaseKey; label: string; value: number | null }[] = [
    { key: 'market',    label: 'Market',   value: prices.market },
    { key: 'salesAvg',  label: 'Avg Sale', value: salesStats?.avg ?? null },
    { key: 'salesLow',  label: 'Low Sale', value: salesStats?.low ?? null },
    { key: 'salesHigh', label: 'High Sale',value: salesStats?.high ?? null },
    { key: 'custom',    label: 'Custom',   value: null },
  ].filter(o => o.key === 'custom' || o.value != null);

  // Custom input is always treated as USD then converted
  const baseValueUsd = useMemo(() => {
    if (baseKey === 'custom') return parseFloat(customBase) || null;
    return baseOptions.find(o => o.key === baseKey)?.value ?? null;
  }, [baseKey, customBase, baseOptions]);

  const result = baseValueUsd != null ? (baseValueUsd * percent) / 100 : null;

  // Currency symbol for the custom input placeholder
  const symbols: Record<string, string> = { USD: '$', GBP: '£', AED: 'AED' };
  const sym = symbols[currency] ?? '$';

  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
        Selling Calculator
      </p>

      {/* Base price */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px' }}>Base price</p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {baseOptions.map(opt => (
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
        {baseKey === 'custom' && (
          <div style={{ marginTop: 10, position: 'relative', width: 150 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13, pointerEvents: 'none' }}>{sym}</span>
            <input
              type="number" min="0" step="0.01"
              value={customBase}
              onChange={e => setCustomBase(e.target.value)}
              placeholder="0.00"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: `9px 12px 9px ${sym.length > 1 ? '48px' : '28px'}`, fontSize: 14, color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => (e.target.style.borderColor = 'var(--text3)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        )}
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
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>Suggested selling price</p>
        </div>
        <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text)' }}>
          {fmt(result)}
        </span>
      </div>
    </div>
  );
}
