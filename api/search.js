/**
 * Vercel Serverless Search API
 * 
 * Contains Tier 1 (Shopify) and Tier 2 (API) scrapers only.
 * Puppeteer stores are excluded for serverless compatibility.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// ═══════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════

const MAX_RESULTS = 12;
const TIMEOUT = 15000;
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" fill="%23f5f5f5"><rect width="400" height="500"/><text x="200" y="240" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">No image</text></svg>');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ═══════════════════════════════════════════
// Store Configuration
// ═══════════════════════════════════════════

const STORE_CONFIG = {
  // Tier 1: Shopify API stores
  whitefox:       { name: 'White Fox', domain: 'www.whitefoxboutique.com' },
  princesspolly:  { name: 'Princess Polly', domain: 'us.princesspolly.com' },
  reformation:    { name: 'Reformation', domain: 'www.thereformation.com' },
  showpo:         { name: 'Showpo', domain: 'www.showpo.com' },
  vici:           { name: 'Vici', domain: 'www.vicicollection.com' },
  altardstate:    { name: "Altar'd State", domain: 'www.altardstate.com' },
  francescas:     { name: "Francesca's", domain: 'www.francescas.com' },
  windsor:        { name: 'Windsor', domain: 'www.windsorstore.com' },
  // Tier 2: API stores
  asos:           { name: 'ASOS', type: 'asos' },
  hm:             { name: 'H&M', type: 'hm' },
  lulus:          { name: 'Lulus', type: 'lulus' },
  nordstrom:      { name: 'Nordstrom', type: 'nordstrom' },
  shein:          { name: 'SHEIN', type: 'shein' },
};

// ═══════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════

function generateProductId() {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function cleanPrice(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return null;
  let cleaned = priceStr.trim();
  if (!cleaned) return null;
  if (cleaned.includes(' - ')) cleaned = cleaned.split(' - ')[0].trim();
  if (cleaned.toLowerCase().includes('from')) cleaned = cleaned.replace(/from/gi, '').trim();
  cleaned = cleaned.replace(/usd|us\$|aud|gbp|eur|cad/gi, '').trim();
  const match = cleaned.match(/[\$£€]?\s*[\d,]+\.?\d*/);
  if (match) {
    let price = match[0].trim().replace(/,/g, '');
    if (!/^[\$£€]/.test(price)) price = '$' + price;
    const numVal = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (numVal > 0 && numVal < 50000) return price;
  }
  return null;
}

function cleanTitle(title, maxLength = 120) {
  if (!title || typeof title !== 'string') return 'Unknown Product';
  let cleaned = title.trim().replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/^(new|sale|hot|best seller)[:\s-]*/gi, '').trim();
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength - 3) + '...';
  }
  return cleaned;
}

function cleanImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let cleaned = url.trim();
  if (cleaned.startsWith('//')) cleaned = 'https:' + cleaned;
  if (cleaned.startsWith('data:')) return null;
  if (/placeholder|blank\.gif|1x1|spacer/i.test(cleaned)) return null;
  try { new URL(cleaned); return cleaned; } catch { return null; }
}

function formatProduct(data, storeName, storeId) {
  if (!data.title && !data.link) return null;
  return {
    id: generateProductId(),
    store: storeId,
    storeName,
    title: cleanTitle(data.title) || 'Unknown Product',
    price: cleanPrice(data.price) || data.price || 'See price',
    image: cleanImageUrl(data.image) || PLACEHOLDER_IMAGE,
    link: data.link || '#'
  };
}

function filterValidProducts(products) {
  return products.filter(p => p !== null && p.title && p.title !== 'Unknown Product' && p.link && p.link !== '#');
}

async function fetchJSON(url, options = {}) {
  const { headers = {} } = options;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      ...headers
    },
    timeout: TIMEOUT,
    maxRedirects: 5,
    validateStatus: (s) => s < 500
  });
  if (response.status >= 400) throw new Error(`HTTP ${response.status}`);
  return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
}

async function fetchHTML(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: TIMEOUT,
    maxRedirects: 5,
    validateStatus: (s) => s < 500
  });
  if (response.status >= 400) throw new Error(`HTTP ${response.status}`);
  return cheerio.load(response.data);
}

// ═══════════════════════════════════════════
// Shopify Store Scraper (Tier 1)
// ═══════════════════════════════════════════

async function scrapeShopifyStore(query, storeId) {
  const config = STORE_CONFIG[storeId];
  if (!config || !config.domain) return [];
  
  const { domain, name: storeName } = config;
  const baseUrl = `https://${domain}`;
  
  try {
    const apiUrl = `${baseUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=${MAX_RESULTS}&resources[options][unavailable_products]=hide`;
    const data = await fetchJSON(apiUrl);
    const products = data?.resources?.results?.products || [];
    
    if (products.length > 0) {
      const formatted = products.slice(0, MAX_RESULTS).map(p => {
        let image = p.image || p.featured_image?.url || p.featured_image || '';
        if (image && !image.startsWith('http')) image = 'https:' + image;
        if (image) image = image.replace(/(_\d+x\d+)?\.(jpg|png|webp)(\?.*)?$/, '_600x.$2$3');
        
        let price = 'See price';
        const rawPrice = p.price ?? p.price_min ?? null;
        if (rawPrice !== null && rawPrice !== undefined) {
          const numPrice = parseFloat(String(rawPrice));
          if (!isNaN(numPrice) && numPrice > 0) {
            const priceStr = String(rawPrice);
            const isCents = Number.isInteger(numPrice) && numPrice > 100 && !priceStr.includes('.');
            const dollars = isCents ? numPrice / 100 : numPrice;
            price = `$${dollars.toFixed(2)}`;
          }
        }
        
        return formatProduct({
          title: p.title,
          price,
          image,
          link: `${baseUrl}${p.url}`
        }, storeName, storeId);
      });
      return filterValidProducts(formatted);
    }
  } catch (e) {
    console.log(`[${storeName}] API failed: ${e.message}`);
  }
  
  return [];
}

// ═══════════════════════════════════════════
// API Store Scrapers (Tier 2)
// ═══════════════════════════════════════════

async function scrapeASOS(query) {
  const storeName = 'ASOS';
  const storeId = 'asos';
  
  try {
    const apiUrl = `https://www.asos.com/api/product/search/v2/categories/4209?q=${encodeURIComponent(query)}&store=US&lang=en-US&currency=USD&rowlength=4&channel=mobile-web&country=US&limit=${MAX_RESULTS}&offset=0`;
    const data = await fetchJSON(apiUrl, {
      headers: { 'Referer': 'https://www.asos.com/', 'Origin': 'https://www.asos.com' }
    });
    
    const products = data?.products || [];
    if (products.length > 0) {
      const formatted = products.slice(0, MAX_RESULTS).map(p => {
        const imageBase = p.imageUrl || p.images?.[0]?.url || '';
        const image = imageBase ? `https://${imageBase.replace(/^\/\//, '')}` : '';
        return formatProduct({
          title: p.name || p.brandName + ' ' + p.description,
          price: p.price?.current?.text || `$${p.price?.current?.value || ''}`,
          image,
          link: `https://www.asos.com/${p.url || `us/prd/${p.id}`}`
        }, storeName, storeId);
      });
      return filterValidProducts(formatted);
    }
  } catch (e) {
    console.log(`[${storeName}] API failed: ${e.message}`);
  }
  return [];
}

async function scrapeHM(query) {
  const storeName = 'H&M';
  const storeId = 'hm';
  
  try {
    const apiUrl = `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(query)}`;
    const $ = await fetchHTML(apiUrl);
    const products = [];
    
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      if (text.includes('productArticleDetails') || text.includes('"products"')) {
        try {
          const jsonMatch = text.match(/"products"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
          if (jsonMatch) {
            const items = JSON.parse(jsonMatch[1]);
            for (const item of items) {
              if (products.length >= MAX_RESULTS) break;
              products.push(formatProduct({
                title: item.title || item.name,
                price: item.price || item.whitePrice?.formattedValue || item.redPrice?.formattedValue,
                image: item.image || item.images?.[0]?.src || item.defaultArticle?.images?.[0]?.src,
                link: item.swatchesLink || item.link ? `https://www2.hm.com${item.swatchesLink || item.link}` : ''
              }, storeName, storeId));
            }
          }
        } catch { /* skip */ }
      }
    });
    
    return filterValidProducts(products);
  } catch (e) {
    console.log(`[${storeName}] Search failed: ${e.message}`);
  }
  return [];
}

async function scrapeLulus(query) {
  const storeName = 'Lulus';
  const storeId = 'lulus';
  
  try {
    const searchUrl = `https://www.lulus.com/search?q=${encodeURIComponent(query)}`;
    const $ = await fetchHTML(searchUrl);
    const products = [];
    
    const selectors = ['.product-card', '.product-tile', '[class*="product-card"]', 'a[href*="/product/"]'];
    for (const sel of selectors) {
      if (products.length > 0) break;
      $(sel).each((i, el) => {
        if (i >= MAX_RESULTS) return;
        const $el = $(el);
        let link = $el.find('a[href*="/product/"]').first().attr('href') || $el.attr('href') || '';
        if (link && !link.startsWith('http')) link = 'https://www.lulus.com' + link;
        const title = $el.find('.product-name, .product-title, h3').first().text().trim() || $el.find('a').first().attr('title') || '';
        const price = $el.find('.price, [class*="price"]').first().text().trim();
        let image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
        if (image?.startsWith('//')) image = 'https:' + image;
        if (title && link) products.push(formatProduct({ title, price, image, link }, storeName, storeId));
      });
    }
    
    return filterValidProducts(products);
  } catch (e) {
    console.log(`[${storeName}] Search failed: ${e.message}`);
  }
  return [];
}

async function scrapeNordstrom(query) {
  const storeName = 'Nordstrom';
  const storeId = 'nordstrom';
  
  try {
    const searchUrl = `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${encodeURIComponent(query)}&filterByGender=Women`;
    const $ = await fetchHTML(searchUrl);
    const products = [];
    
    $('script#__NEXT_DATA__, script[type="application/json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const searchResults = data?.props?.pageProps?.searchResults?.productsById || data?.props?.pageProps?.products || {};
        const items = Object.values(searchResults);
        for (const item of items) {
          if (products.length >= MAX_RESULTS) break;
          const p = item.product || item;
          products.push(formatProduct({
            title: `${p.brandName || ''} ${p.productName || p.name || ''}`.trim(),
            price: p.currentPriceString || p.priceString || `$${p.currentPrice || p.price || ''}`,
            image: p.imageUrl || p.mediaUrl || p.images?.[0]?.url || '',
            link: p.productPageUrl ? `https://www.nordstrom.com${p.productPageUrl}` : `https://www.nordstrom.com/s/${p.id || ''}`
          }, storeName, storeId));
        }
      } catch { /* skip */ }
    });
    
    return filterValidProducts(products);
  } catch (e) {
    console.log(`[${storeName}] Search failed: ${e.message}`);
  }
  return [];
}

async function scrapeShein(query) {
  const storeName = 'SHEIN';
  const storeId = 'shein';
  
  try {
    const searchUrl = `https://us.shein.com/pdsearch/${encodeURIComponent(query)}/`;
    const $ = await fetchHTML(searchUrl);
    const products = [];
    
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      if (text.includes('productListData') || text.includes('goods_id')) {
        try {
          const matches = text.match(/\[\{[^[\]]*"goods_id"[^[\]]*\}\]/g) || text.match(/\[\{[^[\]]*"goods_sn"[^[\]]*\}\]/g);
          if (matches) {
            for (const match of matches) {
              try {
                const items = JSON.parse(match);
                for (const item of items) {
                  if (products.length >= MAX_RESULTS) break;
                  products.push(formatProduct({
                    title: item.goods_name || item.title || item.name,
                    price: item.salePrice?.amount ? `$${item.salePrice.amount}` : (item.sale_price || item.retail_price || ''),
                    image: item.goods_img || item.image || '',
                    link: item.goods_url_name ? `https://us.shein.com/${item.goods_url_name}-p-${item.goods_id}.html` : `https://us.shein.com/p-${item.goods_id || ''}.html`
                  }, storeName, storeId));
                }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip */ }
      }
    });
    
    return filterValidProducts(products);
  } catch (e) {
    console.log(`[${storeName}] Search failed: ${e.message}`);
  }
  return [];
}

// ═══════════════════════════════════════════
// Main Search Router
// ═══════════════════════════════════════════

async function searchStore(storeId, query) {
  const config = STORE_CONFIG[storeId];
  if (!config) return [];
  
  // Shopify stores (Tier 1)
  if (config.domain) {
    return scrapeShopifyStore(query, storeId);
  }
  
  // API stores (Tier 2)
  switch (config.type) {
    case 'asos': return scrapeASOS(query);
    case 'hm': return scrapeHM(query);
    case 'lulus': return scrapeLulus(query);
    case 'nordstrom': return scrapeNordstrom(query);
    case 'shein': return scrapeShein(query);
    default: return [];
  }
}

// ═══════════════════════════════════════════
// Vercel Handler
// ═══════════════════════════════════════════

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { query, stores, category } = req.body;
  
  // Validation
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  if (!stores || !Array.isArray(stores) || stores.length === 0) {
    return res.status(400).json({ error: 'At least one store must be selected' });
  }
  
  const sanitizedQuery = query.trim().replace(/[<>{}]/g, '').slice(0, 200);
  const validStores = stores.filter(id => STORE_CONFIG[id]);
  
  console.log(`[SEARCH] Query: "${sanitizedQuery}" | Stores: ${validStores.join(', ')}`);
  
  try {
    const searchPromises = validStores.map(storeId =>
      searchStore(storeId, sanitizedQuery)
        .then(results => ({ storeId, results, error: null }))
        .catch(error => ({ storeId, results: [], error: error.message }))
    );
    
    const storeResults = await Promise.all(searchPromises);
    
    const response = {
      query: sanitizedQuery,
      category: category || null,
      timestamp: new Date().toISOString(),
      stores: storeResults.map(({ storeId, results, error }) => ({
        id: storeId,
        name: STORE_CONFIG[storeId]?.name || storeId,
        results: results || [],
        error,
        count: results?.length || 0
      }))
    };
    
    const totalResults = response.stores.reduce((sum, s) => sum + s.count, 0);
    console.log(`[SEARCH] Completed: ${totalResults} products from ${validStores.length} stores`);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('[SEARCH] Error:', error);
    return res.status(500).json({ error: 'Search failed. Please try again.' });
  }
}
