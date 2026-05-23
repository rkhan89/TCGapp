import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Currency = 'USD' | 'GBP' | 'AED';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  AED: 'AED ',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  fmt: (usd: number | null) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  fmt: n => n == null ? '—' : `$${n.toFixed(2)}`,
  loading: false,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ GBP: 1, AED: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/rates`)
      .then(r => r.json())
      .then(data => {
        if (data.rates) setRates(data.rates);
      })
      .catch(() => {/* use fallback rates silently */})
      .finally(() => setLoading(false));
  }, []);

  const convert = (usd: number | null): number | null => {
    if (usd == null) return null;
    if (currency === 'USD') return usd;
    return usd * (rates[currency] ?? 1);
  };

  const fmt = (usd: number | null): string => {
    const val = convert(usd);
    if (val == null) return '—';
    const sym = CURRENCY_SYMBOLS[currency];
    return `${sym}${val.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
