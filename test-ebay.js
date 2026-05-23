const axios = require('./server/node_modules/axios');
const cheerio = require('./server/node_modules/cheerio');

async function test() {
  const query = 'Charizard ex 151 PSA 10';
  const url = 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(query) + '&LH_Complete=1&LH_Sold=1&_sop=13&_ipg=60';
  console.log('Fetching:', url);
  try {
    const res = await axios.default.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    });
    console.log('HTTP status:', res.status);
    const $ = cheerio.load(res.data);
    const items = [];
    $('.s-item').each((_, el) => {
      const title = $(el).find('.s-item__title').text().trim();
      const price = $(el).find('.s-item__price').text().trim();
      if (title && title !== 'Shop on eBay') items.push({ title: title.substring(0, 60), price });
    });
    console.log('Found items:', items.length);
    console.log('First 3:', JSON.stringify(items.slice(0, 3), null, 2));
    if (items.length === 0) {
      // Print a snippet of the HTML to see what's there
      console.log('\nHTML snippet:', res.data.substring(0, 2000));
    }
  } catch(e) {
    console.error('Error:', e.message);
    if (e.response) console.error('Status:', e.response.status);
  }
}
test();
