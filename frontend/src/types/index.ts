// Store types
export interface Store {
  id: string;
  name: string;
  color: string;
  logo: string;
  category: string;
  searchUrl: string;
}

// Store category types
export interface StoreCategory {
  name: string;
  icon: string;
}

// Clothing category types
export interface ClothingCategory {
  id: string;
  name: string;
  icon: string;
}

// Product types
export interface Product {
  id: string;
  store: string;
  storeName: string;
  title: string;
  price: string;
  image: string;
  link: string;
}

// API Response types
export interface StoreResult {
  id: string;
  name: string;
  results: Product[];
  error: string | null;
  count: number;
}

export interface SearchResponse {
  query: string;
  category: string | null;
  timestamp: string;
  stores: StoreResult[];
}

export interface StoresResponse {
  stores: Store[];
  categories: Record<string, StoreCategory>;
  byCategory: Record<string, Store[]>;
}

// UI State types
export interface SearchState {
  isLoading: boolean;
  error: string | null;
  results: SearchResponse | null;
}

// Default clothing categories
export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  { id: 'all', name: 'All Items', icon: '✨' },
  { id: 'dresses', name: 'Dresses', icon: '👗' },
  { id: 'tops', name: 'Tops', icon: '👚' },
  { id: 'bottoms', name: 'Pants', icon: '👖' },
  { id: 'jeans', name: 'Jeans', icon: '👖' },
  { id: 'skirts', name: 'Skirts', icon: '🩱' },
  { id: 'shorts', name: 'Shorts', icon: '🩳' },
  { id: 'swimwear', name: 'Swim', icon: '👙' },
  { id: 'activewear', name: 'Active', icon: '🏃‍♀️' },
  { id: 'outerwear', name: 'Jackets', icon: '🧥' },
  { id: 'loungewear', name: 'Lounge', icon: '🛋️' },
  { id: 'accessories', name: 'Accessories', icon: '👜' }
];

// Default fashion stores - organized by category
// NOTE: Vercel deployment includes 13 stores (no Puppeteer stores)
export const DEFAULT_STORES: Store[] = [
  // Trendy Boutiques (Shopify API)
  { id: 'whitefox', name: 'White Fox', color: '#000000', logo: '🦊', category: 'boutique', searchUrl: 'https://www.whitefoxboutique.com/search?q=' },
  { id: 'princesspolly', name: 'Princess Polly', color: '#FF69B4', logo: '👑', category: 'boutique', searchUrl: 'https://us.princesspolly.com/search?q=' },
  { id: 'reformation', name: 'Reformation', color: '#2D5016', logo: '🌿', category: 'boutique', searchUrl: 'https://www.thereformation.com/search?q=' },
  { id: 'showpo', name: 'Showpo', color: '#FF69B4', logo: '🦩', category: 'boutique', searchUrl: 'https://www.showpo.com/us/search?q=' },
  { id: 'vici', name: 'Vici', color: '#C9A86C', logo: '✨', category: 'boutique', searchUrl: 'https://www.vicicollection.com/search?q=' },
  { id: 'francescas', name: "Francesca's", color: '#E8C4A2', logo: '🌼', category: 'boutique', searchUrl: 'https://www.francescas.com/search?q=' },
  
  // Fast Fashion (API)
  { id: 'shein', name: 'SHEIN', color: '#000000', logo: '🛒', category: 'fast-fashion', searchUrl: 'https://us.shein.com/pdsearch/' },
  { id: 'hm', name: 'H&M', color: '#E50010', logo: '🔴', category: 'fast-fashion', searchUrl: 'https://www2.hm.com/en_us/search-results.html?q=' },
  
  // UK Fashion (API)
  { id: 'asos', name: 'ASOS', color: '#2D2D2D', logo: '🛍️', category: 'uk-fashion', searchUrl: 'https://www.asos.com/us/search/?q=' },
  
  // Premium & Department (Mixed)
  { id: 'altardstate', name: "Altar'd State", color: '#D4A574', logo: '🕊️', category: 'premium', searchUrl: 'https://www.altardstate.com/search?q=' },
  { id: 'windsor', name: 'Windsor', color: '#8B0000', logo: '👠', category: 'premium', searchUrl: 'https://www.windsorstore.com/search?q=' },
  { id: 'lulus', name: 'Lulus', color: '#F8B4B4', logo: '🌹', category: 'premium', searchUrl: 'https://www.lulus.com/search?q=' },
  { id: 'nordstrom', name: 'Nordstrom', color: '#000000', logo: '🏬', category: 'premium', searchUrl: 'https://www.nordstrom.com/sr?keyword=' }
];

// Store categories
export const STORE_CATEGORIES: Record<string, StoreCategory> = {
  boutique: { name: 'Trendy Boutiques', icon: '✨' },
  'fast-fashion': { name: 'Fast Fashion', icon: '⚡' },
  'uk-fashion': { name: 'UK Fashion', icon: '🇬🇧' },
  casual: { name: 'Casual & Lifestyle', icon: '🌿' },
  premium: { name: 'Premium & Department', icon: '💎' }
};
