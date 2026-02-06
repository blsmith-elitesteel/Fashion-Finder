import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, ExternalLink, Package, Share2, Check, Download } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ItemErrorBoundary } from './ErrorBoundary';
import type { FavoriteItem } from '../hooks/useFavorites';
import type { Product, Store } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteItem[];
  stores: Store[];
  onToggleFavorite: (product: Product) => void;
  onClearAll?: () => void;
  onShare?: () => Promise<boolean>;
  onExportCSV?: () => void;
  onClose: () => void;
}

/**
 * Dedicated view for saved favorites.
 * Shows all favorited items without requiring an active search.
 * 
 * Reuses ProductCard for consistent appearance.
 * FavoriteItem is compatible with Product interface for rendering.
 */
export function FavoritesView({ 
  favorites, 
  stores, 
  onToggleFavorite, 
  onClearAll,
  onShare,
  onExportCSV,
  onClose 
}: FavoritesViewProps) {
  // Build store lookup for ProductCard
  const storeMap = new Map(stores.map(s => [s.id, s]));
  
  // Share button state
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const handleShare = async () => {
    if (!onShare) return;
    const success = await onShare();
    setShareStatus(success ? 'success' : 'error');
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  // Convert FavoriteItem to Product format for ProductCard
  // FavoriteItem has all the same fields, so this is safe
  const favoritesAsProducts: (Product & { storeData?: Store })[] = favorites.map(fav => ({
    ...fav,
    storeData: storeMap.get(fav.store)
  }));

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-charcoal">Your Favorites</h2>
              <p className="text-sm text-warmGray">Items you've saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-warmGray hover:text-charcoal transition-colors"
          >
            Back to Search
          </button>
        </div>

        {/* Empty state */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-blush/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose/40" />
          </div>
          <h3 className="font-display text-2xl text-charcoal mb-2">
            No favorites yet
          </h3>
          <p className="text-warmGray max-w-md mx-auto mb-6">
            Tap the heart icon on any product to save it here for later.
          </p>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Start Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose/10 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose fill-current" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-charcoal">
              {favorites.length} {favorites.length === 1 ? 'Favorite' : 'Favorites'}
            </h2>
            <p className="text-sm text-warmGray">
              Saved across all your searches
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Share button */}
          {onShare && favorites.length > 0 && (
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
                shareStatus === 'success'
                  ? 'bg-green-50 border-green-300 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                  : 'text-warmGray hover:text-rose bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-rose/50'
              }`}
            >
              {shareStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          )}
          
          {/* Export CSV button */}
          {onExportCSV && favorites.length > 0 && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border text-warmGray hover:text-rose bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-rose/50 transition-colors"
              title="Download as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
          
          {/* Clear all button - with confirm */}
          {onClearAll && favorites.length > 0 && (
            <ClearAllButton onClearAll={onClearAll} count={favorites.length} />
          )}
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-warmGray hover:text-charcoal bg-white rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </motion.div>

      {/* Favorites grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {favoritesAsProducts.map((product, index) => (
          <ItemErrorBoundary key={product.id} name={`FavoriteCard-${product.id}`}>
            <ProductCard 
              product={product} 
              store={product.storeData}
              index={index}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
            />
          </ItemErrorBoundary>
        ))}
      </motion.div>

      {/* Helpful tip */}
      <p className="text-center text-sm text-warmGray py-4">
        Tap the heart icon to remove items from your favorites
      </p>
    </div>
  );
}

/**
 * Clear all button with confirmation step.
 * Prevents accidental deletion of all favorites.
 */
function ClearAllButton({ onClearAll, count }: { onClearAll: () => void; count: number }) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) {
      onClearAll();
      setConfirming(false);
    } else {
      setConfirming(true);
      // Auto-reset after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
        confirming
          ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
          : 'text-warmGray hover:text-red-500 bg-white border-gray-200 hover:border-red-200'
      }`}
    >
      <Trash2 className="w-4 h-4" />
      {confirming ? `Remove all ${count}?` : 'Clear All'}
    </button>
  );
}
