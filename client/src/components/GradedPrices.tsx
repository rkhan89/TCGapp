import { useState } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { getGradedPrices, type GradedResult } from '../api';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  cardName: string;
  setName: string;
}

type Company = 'PSA' | 'CGC' | 'Beckett' | 'TAG';

const COMPANIES: Company[] = ['PSA', 'CGC', 'Beckett', 'TAG'];

const GRADES: Record<Company, string[]> = {
  PSA:     ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
  CGC:     ['10 Pristine', '10', '9.5', '9', '8.5', '8', '7.5', '7'],
  Beckett: ['10 Black Label', '9.5 Black Label', '10', '9.5', '9', '8.5', '8'],
  TAG:     ['10', '9', '8', '7'],
};

export default function GradedPrices({ cardName, setName }: Props) {
  const { fmt } = useCurrency();
  const [company, setCompany] = useState<Company>('PSA');
  const [grade, setGrade] = useState('10');
  const [result, setResult] = useState<GradedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const handleCompany = (c: Company) => {
    setCompany(c);
    setGrade(GRADES[c][0]);
    setResult(null);
    setFetched(false);
    setError('');
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await getGradedPrices(cardName, setName, company, grade);
      setResult(data);
      setFetched(true);
    } catch {
      setError('Could not fetch graded prices. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
        Graded Prices · eBay Sold
      </p>

      {/* Company selector */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px' }}>Grading company</p>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {COMPANIES.map(c => (
            <button key={c} className={`pill${company === c ? ' active' : ''}`} onClick={() => handleCompany(c)} style={{ fontSize: 13 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grade selector */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 8px' }}>Grade</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GRADES[company].map(g => (
            <button key={g} className={`pill${grade === g ? ' active' : ''}`} onClick={() => { setGrade(g); setResult(null); setFetched(false); }} style={{ fontSize: 12, padding: '5px 12px' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          width: '100%', padding: '12px', borderRadius: 14,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          border: 'none', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
          marginBottom: 16,
        }}
      >
        {loading ? 'Searching eBay sold listings…' : `Search ${company} ${grade} prices`}
      </button>

      {/* Error */}
      {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>}

      {/* No results */}
      {fetched && result && result.count === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>🔍</p>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>No sold listings found for {company} {grade}</p>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Try a broader grade or different company</p>
        </div>
      )}

      {/* Results */}
      {result && result.count > 0 && (
        <div className="animate-fade-up">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Average', value: result.avg, icon: <Minus size={13} />, color: 'var(--text2)' },
              { label: 'Lowest',  value: result.low, icon: <TrendingDown size={13} />, color: '#22c55e' },
              { label: 'Highest', value: result.high, icon: <TrendingUp size={13} />, color: '#ef4444' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, color }}>
                  {icon}
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.4px', color: 'var(--text)' }}>{fmt(value)}</p>
              </div>
            ))}
          </div>

          {/* Sale count badge */}
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            Based on {result.count} recent eBay sold listing{result.count !== 1 ? 's' : ''}
          </p>

          {/* Recent sales list */}
          <details className="card" style={{ overflow: 'hidden' }}>
            <summary style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text2)', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
              <span>Recent sold listings</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>▾</span>
            </summary>
            <div style={{ borderTop: '1px solid var(--border)', maxHeight: 240, overflowY: 'auto' }}>
              {result.sales.map((sale, i) => (
                <div key={i} style={{ padding: '10px 18px', borderBottom: i < result.sales.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.title}</p>
                    {sale.date && <p style={{ fontSize: 11, color: 'var(--text3)', margin: '2px 0 0' }}>{sale.date}</p>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>{fmt(sale.price)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
