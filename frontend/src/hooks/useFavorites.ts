import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Product } from '../types';

/**
 * Favorite item stored in localStorage.
 * We store minimal data to keep localStorage small.
 */
export interface FavoriteItem {
  id: string;          // Stable ID derived from product URL
  store: string;
  storeName: string;
  title: string;
  price: string;
  image: string;
  link: string;
  savedAt: number;     // Timestamp for sorting by recency
}

/**
 * Generate a stable, deterministic ID from a product URL.
 * 
 * Uses a simple hash function (djb2) that's fast and produces consistent results.
 * This ensures the same product URL always maps to the same favorite ID,
 * allowing favorites to persist across different searches.
 * 
 * Why URL-based:
 * - Product URLs are unique identifiers provided by stores
 * - Same product in different searches will have the same URL
 * - Doesn't rely on scraped data that might change (title, price)
 */
function generateStableId(url: string): string {
  // Normalize URL: remove trailing slashes, lowercase, remove query params that vary
  // but keep essential path components
  let normalized = url.trim().toLowerCase();
  
  // Remove tracking/session parameters that don't identify the product
  try {
    const urlObj = new URL(normalized);
    // Keep only the origin + pathname for stability
    // Query params often contain tracking data that changes
    normalized = urlObj.origin + urlObj.pathname;
  } catch {
    // If URL parsing fails, use as-is
  }
  
  // Remove trailing slash for consistency
  normalized = normalized.replace(/\/$/, '');
  
  // djb2 hash - fast, simple, good distribution
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string with prefix for clarity
  return `fav_${(hash >>> 0).toString(16)}`;
}

/**
 * Check if an ID looks like a legacy format (prod_timestamp_random)
 * Used for backward compatibility during migration.
 */
function isLegacyId(id: string): boolean {
  return id.startsWith('prod_');
}

/**
 * Hook for managing favorite products.
 * Favorites are persisted to localStorage and survive page reloads.
 * 
 * MIGRATION NOTE: This version uses stable URL-based IDs instead of
 * random generated IDs. Old favorites with 'prod_' prefix are preserved
 * but won't match new searches. Users can re-favorite items to get
 * stable IDs, or clear favorites to start fresh.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteItem[]>('favoriteProducts', []);

  // Build a Set of favorite IDs for O(1) lookup
  // Includes both new stable IDs and legacy IDs for backward compat
  const favoriteIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fav of favorites) {
      ids.add(fav.id);
      // Also index by URL hash if this is a legacy item with a valid link
      // This allows matching old favorites with new products
      if (isLegacyId(fav.id) && fav.link) {
        ids.add(generateStableId(fav.link));
      }
    }
    return ids;
  }, [favorites]);

  /**
   * Check if a product is favorited.
   * Accepts either a product ID or a product object.
   * Uses stable URL-based matching for reliable cross-search detection.
   */
  const isFavorite = useCallback(
    (productOrId: string | Product): boolean => {
      if (typeof productOrId === 'string') {
        return favoriteIds.has(productOrId);
      }
      // For product objects, check both the product's ID and its URL hash
      const product = productOrId;
      const stableId = generateStableId(product.link);
      return favoriteIds.has(product.id) || favoriteIds.has(stableId);
    },
    [favoriteIds]
  );

  /**
   * Get the stable ID for a product
   */
  const getStableId = useCallback((product: Product): string => {
    return generateStableId(product.link);
  }, []);

  /**
   * Add a product to favorites using stable URL-based ID
   */
  const addFavorite = useCallback(
    (product: Product) => {
      const stableId = generateStableId(product.link);
      
      setFavorites(prev => {
        // Don't add if already exists (check both ID types)
        if (prev.some(f => f.id === stableId || f.id === product.id)) {
          return prev;
        }
        
        const newFavorite: FavoriteItem = {
          id: stableId,  // Use stable ID, not the random one
          store: product.store,
          storeName: product.storeName,
          title: product.title,
          price: product.price,
          image: product.image,
          link: product.link,
          savedAt: Date.now()
        };
        
        return [newFavorite, ...prev];
      });
    },
    [setFavorites]
  );

  /**
   * Remove a product from favorites.
   * Handles both stable IDs and legacy IDs.
   */
  const removeFavorite = useCallback(
    (productOrId: string | Product) => {
      setFavorites(prev => {
        if (typeof productOrId === 'string') {
          return prev.filter(f => f.id !== productOrId);
        }
        // For product objects, remove by stable ID or matching link
        const product = productOrId;
        const stableId = generateStableId(product.link);
        return prev.filter(f => 
          f.id !== stableId && 
          f.id !== product.id && 
          f.link !== product.link
        );
      });
    },
    [setFavorites]
  );

  /**
   * Toggle favorite status for a product
   */
  const toggleFavorite = useCallback(
    (product: Product) => {
      if (isFavorite(product)) {
        removeFavorite(product);
      } else {
        addFavorite(product);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  /**
   * Clear all favorites
   */
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, [setFavorites]);

  /**
   * Share favorites via Web Share API or clipboard
   * Creates a text list of favorited items with links
   */
  const shareFavorites = useCallback(async (): Promise<boolean> => {
    if (favorites.length === 0) return false;
    
    // Create shareable text
    const lines = favorites.map((fav, i) => 
      `${i + 1}. ${fav.title} - ${fav.price}\n   ${fav.storeName}: ${fav.link}`
    );
    const shareText = `My Fashion Wishlist 💕\n\n${lines.join('\n\n')}`;
    
    // Try Web Share API first (works great on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Fashion Wishlist',
          text: shareText
        });
        return true;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === 'AbortError') return false;
      }
    }
    
    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch {
      return false;
    }
  }, [favorites]);

  /**
   * Export favorites as CSV file download
   */
  const exportFavoritesCSV = useCallback(() => {
    if (favorites.length === 0) return;
    
    // CSV header
    const headers = ['Title', 'Price', 'Store', 'Link', 'Saved Date'];
    
    // CSV rows
    const rows = favorites.map(fav => [
      `"${fav.title.replace(/"/g, '""')}"`,
      `"${fav.price}"`,
      `"${fav.storeName}"`,
      `"${fav.link}"`,
      `"${new Date(fav.savedAt).toLocaleDateString()}"`
    ]);
    
    // Combine into CSV string
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fashion-favorites-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [favorites]);

  return {
    favorites,
    isFavorite,
    getStableId,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    shareFavorites,
    exportFavoritesCSV,
    count: favorites.length
  };
}
