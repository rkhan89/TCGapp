import { useMemo } from 'react';
import type { SaleRecord } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface Props {
  sales: SaleRecord[];
}

const W = 400;
const H = 130;
const PAD = { top: 20, right: 16, bottom: 28, left: 52 };

export default function PriceTrendChart({ sales }: Props) {
  const { fmt } = useCurrency();

  const points = useMemo(() => {
    const valid = sales
      .filter(s => s.date && s.price > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (valid.length < 2) return null;

    const prices = valid.map(s => s.price);
    const times = valid.map(s => new Date(s.date).getTime());
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const pRange = maxP - minP || 1;
    const tRange = maxT - minT || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    return valid.map(s => ({
      x: PAD.left + ((new Date(s.date).getTime() - minT) / tRange) * innerW,
      y: PAD.top + ((maxP - s.price) / pRange) * innerH,
      price: s.price,
      label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [sales]);

  if (!points) return null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${points[0].x.toFixed(1)},${(H - PAD.bottom).toFixed(1)} Z`;

  const minP = Math.min(...points.map(p => p.price));
  const maxP = Math.max(...points.map(p => p.price));
  const minPt = points.find(p => p.price === minP)!;
  const maxPt = points.find(p => p.price === maxP)!;

  // X-axis labels: first, middle, last
  const labelIdxs = [0, Math.floor(points.length / 2), points.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i && points[v]
  );

  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
        Price Trend · Recent Sales
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', overflow: 'visible', display: 'block' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(t => {
          const y = PAD.top + t * (H - PAD.top - PAD.bottom);
          return (
            <line
              key={t}
              x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--border)" strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" />
        ))}

        {/* Min label */}
        <text
          x={minPt.x}
          y={minPt.y + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#22c55e"
          fontWeight="700"
        >
          {fmt(minPt.price)}
        </text>

        {/* Max label */}
        <text
          x={maxPt.x}
          y={maxPt.y - 7}
          textAnchor="middle"
          fontSize="10"
          fill="#ef4444"
          fontWeight="700"
        >
          {fmt(maxPt.price)}
        </text>

        {/* X axis labels */}
        {labelIdxs.map(i => (
          <text
            key={i}
            x={points[i].x}
            y={H - 4}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize="9"
            fill="var(--text3)"
          >
            {points[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
