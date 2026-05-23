import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 });

// Map display company name to eBay search term
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

  const cacheKey = `graded:${name}:${setName ?? ''}:${company}:${grade}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const searchCompany = COMPANY_SEARCH[company] ?? company;
    // Build a tight query: card name + grading company + grade
    const query = [name, setName, searchCompany, grade].filter(Boolean).join(' ');
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const prices: number[] = [];
    const sales: { title: string; price: number; date: string }[] = [];

    $('.s-item').each((_, el) => {
      const title = $(el).find('.s-item__title').text().trim();
      if (!title || title === 'Shop on eBay') return;

      const priceText = $(el).find('.s-item__price').text().trim();
      const dateText = $(el).find('.s-item__ended-date').text().trim();

      // Handle ranges ("$10.00 to $20.00") — take the first number
      const match = priceText.match(/[\d,]+\.?\d*/);
      if (!match) return;

      const price = parseFloat(match[0].replace(/,/g, ''));
      if (isNaN(price) || price <= 0) return;

      prices.push(price);
      if (sales.length < 15) sales.push({ title, price, date: dateText });
    });

    if (prices.length === 0) {
      return res.json({ avg: null, low: null, high: null, count: 0, sales: [] });
    }

    prices.sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    const result = {
      avg,
      low: prices[0],
      high: prices[prices.length - 1],
      count: prices.length,
      sales,
    };

    cache.set(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('Graded price fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch graded prices' });
  }
});

export default router;
