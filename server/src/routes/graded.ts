import { Router } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 });

const COMPANY_SEARCH: Record<string, string> = {
  PSA: 'PSA',
  CGC: 'CGC',
  Beckett: 'BGS',
  TAG: 'TAG',
};

router.get('/', async (req, res) => {
  const { name, setName, company, grade } = req.query as Record<string, string>;

  if (!name || !company || !grade) {
    return res.status(400).json({ error: 'Missing required params: name, company, grade' });
  }

  const appId = process.env.EBAY_APP_ID;
  if (!appId) {
    return res.status(503).json({ error: 'EBAY_APP_ID not configured on server' });
  }

  const cacheKey = `graded:${name}:${setName ?? ''}:${company}:${grade}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const searchCompany = COMPANY_SEARCH[company] ?? company;
    const keywords = [name, setName, searchCompany, grade].filter(Boolean).join(' ');

    const params = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      keywords,
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
      'sortOrder': 'EndTimeSoonest',
      'paginationInput.entriesPerPage': '50',
    });

    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params}`;
    const response = await axios.get(url, { timeout: 10000 });

    const searchResult = response.data?.findCompletedItemsResponse?.[0];
    const items: any[] = searchResult?.searchResult?.[0]?.item ?? [];

    const prices: number[] = [];
    const sales: { title: string; price: number; date: string }[] = [];

    for (const item of items) {
      const priceStr = item.sellingStatus?.[0]?.soldPrice?.[0]?.__value__;
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) continue;

      const title = item.title?.[0] ?? '';
      const endTime = item.listingInfo?.[0]?.endTime?.[0] ?? '';
      const date = endTime ? new Date(endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

      prices.push(price);
      if (sales.length < 15) sales.push({ title, price, date });
    }

    if (prices.length === 0) {
      return res.json({ avg: null, low: null, high: null, count: 0, sales: [] });
    }

    prices.sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    const result = { avg, low: prices[0], high: prices[prices.length - 1], count: prices.length, sales };
    cache.set(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Graded price fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch graded prices' });
  }
});

export default router;
