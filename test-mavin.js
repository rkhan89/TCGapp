const https = require('https');

const query = 'Charizard ex 151 PSA 10';
const url = `https://mavin.io/search?q=${encodeURIComponent(query)}&selling=1`;
console.log('Fetching:', url);

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  }
};

https.get(url, options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for price patterns in the HTML
    const prices = [...data.matchAll(/\$[\d,]+\.?\d*/g)].map(m => m[0]).slice(0, 10);
    console.log('Price matches found:', prices);
    console.log('HTML length:', data.length);
  });
}).on('error', e => console.error('Error:', e.message));
