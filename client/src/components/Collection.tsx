import { useState } from 'react';
import { X, Trash2, ShoppingBag, Pencil, Check } from 'lucide-react';
import type { CollectionItem } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  items: CollectionItem[];
  onToggleIncluded: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onSetCustomPrice: (id: string, price: number | undefined) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onClose: () => void;
}

const PRESETS = [50, 60, 70, 75, 80, 85, 90, 95];

export default function Collection({ items, onToggleIncluded, onRemove, onUpdateQuantity, onSetCustomPrice, onUpdateNotes, onClose }: Props) {
  const { fmt } = useCurrency();
  const [percent, setPercent] = useState(80);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  const included = items.filter(i => i.included);
  const baseTotal = included.reduce((sum, i) => {
    const price = i.customPrice ?? i.priceData.prices.market ?? 0;
    return sum + price * i.quantity;
  }, 0);
  const calcTotal = baseTotal * percent / 100;

  const startEditPrice = (item: CollectionItem) => {
    setEditingPriceId(item.id);
    setEditingPriceValue(String(item.customPrice ?? item.priceData.prices.market ?? ''));
  };

  const commitEditPrice = (id: string) => {
    const val = parseFloat(editingPriceValue);
    if (!isNaN(val) && val > 0) onSetCustomPrice(id, val);
    setEditingPriceId(null);
  };

  return (
    <div className="animate-fade-in"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="animate-fade-up"
        style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderBottom: 'none', overflow: 'hidden' }}>

        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '12px auto 0', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={17} color="var(--text2)" />
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Collection</span>
            {items.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text3)', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)' }}>
                {items.length} {items.length === 1 ? 'card' : 'cards'}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
            <span style={{ fontSize: 40 }}>🃏</span>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: 0 }}>No cards yet</p>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0, textAlign: 'center' }}>Search for a card and tap "Add" to track your bulk buy total.</p>
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* % strip */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price %</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>{percent}%</span>
              </div>
              <input type="range" min="1" max="150" value={percent} onChange={e => setPercent(Number(e.target.value))} style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {PRESETS.map(p => (
                  <button key={p} className={`pill${percent === p ? ' active' : ''}`} onClick={() => setPercent(p)} style={{ fontSize: 12, padding: '4px 11px', flexShrink: 0 }}>{p}%</button>
                ))}
              </div>
            </div>

            {/* Card list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {items.map(item => {
                const basePrice = item.customPrice ?? item.priceData.prices.market;
                const unitCalc = basePrice != null ? basePrice * percent / 100 : null;
                const rowTotal = unitCalc != null ? unitCalc * item.quantity : null;
                const isEditing = editingPriceId === item.id;
                const hasCustom = item.customPrice != null;

                return (
                  <div key={item.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', opacity: item.included ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Checkbox */}
                      <button onClick={() => onToggleIncluded(item.id)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.included ? 'var(--accent)' : 'var(--border)'}`, background: item.included ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}>
                        {item.included && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>

                      {/* Thumb */}
                      <div style={{ width: 38, height: 52, borderRadius: 6, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0 }}>
                        <img src={item.card.imageUrl} alt={item.card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      {/* Name + qty controls */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.card.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.card.setName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>

                      {/* Price column */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="number" min="0" step="0.01" value={editingPriceValue}
                              onChange={e => setEditingPriceValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') commitEditPrice(item.id); if (e.key === 'Escape') setEditingPriceId(null); }}
                              autoFocus
                              style={{ width: 70, background: 'var(--surface2)', border: '1.5px solid var(--accent)', borderRadius: 8, padding: '5px 8px', fontSize: 13, fontWeight: 700, color: 'var(--text)', outline: 'none', textAlign: 'right' }} />
                            <button onClick={() => commitEditPrice(item.id)}
                              style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                              <Check size={12} color="var(--accent-fg)" />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <button onClick={() => startEditPrice(item)}
                              style={{ background: hasCustom ? 'rgba(99,102,241,0.1)' : 'var(--surface2)', border: `1px solid ${hasCustom ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: hasCustom ? 'var(--accent)' : 'var(--text2)' }}>{fmt(basePrice)}</span>
                              <Pencil size={10} color={hasCustom ? 'var(--accent)' : 'var(--text3)'} />
                            </button>
                            {hasCustom && (
                              <button onClick={() => onSetCustomPrice(item.id, undefined)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 10, padding: '0 2px' }}>
                                reset
                              </button>
                            )}
                          </div>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>{fmt(rowTotal)}</span>
                      </div>

                      {/* Remove */}
                      <button onClick={() => onRemove(item.id)}
                        style={{ width: 28, height: 28, borderRadius: 7, background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', transition: 'all 0.15s ease', flexShrink: 0 }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fef2f2'; el.style.borderColor = '#fecaca'; el.style.color = '#ef4444'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text3)'; }}>
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Notes */}
                    <input
                      type="text"
                      value={item.notes ?? ''}
                      onChange={e => onUpdateNotes(item.id, e.target.value)}
                      placeholder="Add a note… e.g. seller wants £40, mint"
                      style={{
                        width: '100%', marginTop: 8,
                        background: 'transparent', border: 'none',
                        borderBottom: `1px solid ${item.notes ? 'var(--accent)' : 'var(--border)'}`,
                        padding: '4px 0', fontSize: 12,
                        color: item.notes ? 'var(--text)' : 'var(--text3)',
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderBottomColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderBottomColor = item.notes ? 'var(--accent)' : 'var(--border)')}
                    />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px 32px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{included.length} of {items.length} cards · base total</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text2)', letterSpacing: '-0.3px' }}>{fmt(baseTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Total at {percent}%</span>
                <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1.2px', color: 'var(--text)' }}>{fmt(calcTotal)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
