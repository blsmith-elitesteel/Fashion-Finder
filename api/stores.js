// Available stores (non-Puppeteer only for Vercel deployment)
const STORE_CONFIG = {
  // Tier 1: Shopify API stores
  whitefox:       { id: 'whitefox', name: 'White Fox', color: '#000000', logo: '🦊', category: 'boutique' },
  princesspolly:  { id: 'princesspolly', name: 'Princess Polly', color: '#FF69B4', logo: '👑', category: 'boutique' },
  reformation:    { id: 'reformation', name: 'Reformation', color: '#2D5016', logo: '🌿', category: 'boutique' },
  showpo:         { id: 'showpo', name: 'Showpo', color: '#FF69B4', logo: '🦩', category: 'boutique' },
  vici:           { id: 'vici', name: 'Vici', color: '#C9A86C', logo: '✨', category: 'boutique' },
  altardstate:    { id: 'altardstate', name: "Altar'd State", color: '#D4A574', logo: '🕊️', category: 'premium' },
  francescas:     { id: 'francescas', name: "Francesca's", color: '#E8C4A2', logo: '🌼', category: 'boutique' },
  windsor:        { id: 'windsor', name: 'Windsor', color: '#8B0000', logo: '👠', category: 'premium' },

  // Tier 2: API / good HTML stores
  asos:           { id: 'asos', name: 'ASOS', color: '#2D2D2D', logo: '🛍️', category: 'uk-fashion' },
  hm:             { id: 'hm', name: 'H&M', color: '#E50010', logo: '🔴', category: 'fast-fashion' },
  lulus:          { id: 'lulus', name: 'Lulus', color: '#F8B4B4', logo: '🌹', category: 'premium' },
  nordstrom:      { id: 'nordstrom', name: 'Nordstrom', color: '#000000', logo: '🏬', category: 'premium' },
  shein:          { id: 'shein', name: 'SHEIN', color: '#000000', logo: '🛒', category: 'fast-fashion' },
};

const STORE_CATEGORIES = {
  boutique: { name: 'Trendy Boutiques', icon: '✨' },
  'fast-fashion': { name: 'Fast Fashion', icon: '⚡' },
  'uk-fashion': { name: 'UK Fashion', icon: '🇬🇧' },
  casual: { name: 'Casual & Lifestyle', icon: '🌿' },
  premium: { name: 'Premium & Department', icon: '💎' }
};

export default function handler(req, res) {
  const stores = Object.values(STORE_CONFIG).map(({ id, name, color, logo, category }) => ({
    id, name, color, logo, category,
    searchUrl: '#' // Not needed for frontend
  }));
  
  const byCategory = {};
  for (const store of stores) {
    if (!byCategory[store.category]) {
      byCategory[store.category] = [];
    }
    byCategory[store.category].push(store);
  }
  
  res.json({ stores, categories: STORE_CATEGORIES, byCategory });
}
