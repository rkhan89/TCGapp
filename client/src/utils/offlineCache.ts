const PREFIX = 'tcg_cache_';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

export function setCacheEntry<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {}
}

export function getCacheEntry<T>(key: string): { data: T; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return { data: entry.data, cachedAt: entry.cachedAt };
  } catch {
    return null;
  }
}

export function clearAllCache(): void {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

export function getLastSaveTime(): number | null {
  try {
    const val = localStorage.getItem('tcg_offline_saved_at');
    return val ? parseInt(val) : null;
  } catch {
    return null;
  }
}

export function setLastSaveTime(): void {
  try {
    localStorage.setItem('tcg_offline_saved_at', String(Date.now()));
  } catch {}
}

export function formatAge(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
