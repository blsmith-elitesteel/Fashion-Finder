import { motion } from 'framer-motion';
import { AlertCircle, Package, ChevronDown, ChevronUp, Grid, List, Heart, Loader2, ArrowUp } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { ImageZoom, useImageZoom } from './ImageZoom';
import { SimilarSearches } from './SimilarSearches';
import { ItemErrorBoundary } from './ErrorBoundary';
import { PriceControls, type SortOrder } from './PriceControls';
import { comparePrices, isPriceInRange } from '../utils/price';
import type { SearchResponse, Store, Product } from '../types';

/**
 * Product with optional store metadata attached.
 * storeData may be undefined if the store ID doesn't match any known store.
 */
type ProductWithStore = Product & { storeData: Store | undefined };

// Number of items to show initially and load per batch
const INITIAL_ITEMS = 16;
const ITEMS_PER_LOAD = 12;

interface ProductGridProps {
  results: SearchResponse;
  stores: Store[];
  // Favorites support - accepts Product for stable URL-based matching
  isFavorite: (productOrId: string | Product) => boolean;
  onToggleFavorite: (product: Product) => void;
  showFavoritesOnly?: boolean;
  onToggleFavoritesView?: () => void;
  favoritesCount?: number;
  onNewSearch?: (query: string) => void;
}

export function ProductGrid({ 
  results, 
  stores,
  isFavorite,
  onToggleFavorite,
  showFavoritesOnly = false,
  onToggleFavoritesView,
  favoritesCount = 0,
  onNewSearch
}: ProductGridProps) {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'byStore'>('grid');
  
  // Image zoom state
  const { zoomProduct, zoomStore, isZoomOpen, openZoom, closeZoom } = useImageZoom();
  
  // Price sorting and filtering state
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Load more state
  const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Memoize store lookup map - only changes when stores prop changes
  const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s])), [stores]);
  
  // Parse filter values (memoized to avoid repeated parsing)
  const minPriceNum = useMemo(() => {
    const num = parseFloat(minPrice);
    return isNaN(num) ? null : num;
  }, [minPrice]);
  
  const maxPriceNum = useMemo(() => {
    const num = parseFloat(maxPrice);
    return isNaN(num) ? null : num;
  }, [maxPrice]);
  
  const hasActiveFilters = sortOrder !== 'none' || minPrice !== '' || maxPrice !== '';
  
  // Memoize the raw product list to prevent recalculation on unrelated state changes
  // This is important because flatMap creates new arrays each time
  const allProductsRaw: ProductWithStore[] = useMemo(() => {
    return results.stores.flatMap(store => 
      store.results.map(product => ({ 
        ...product, 
        storeData: storeMap.get(store.id) 
      }))
    );
  }, [results.stores, storeMap]);
  
  // Apply filtering and sorting (memoized for performance)
  const allProducts = useMemo(() => {
    let filtered = allProductsRaw;
    
    // Apply favorites filter first
    // Pass full product object for stable URL-based matching
    if (showFavoritesOnly) {
      filtered = filtered.filter(p => isFavorite(p));
    }
    
    // Apply price range filter
    if (minPriceNum !== null || maxPriceNum !== null) {
      filtered = filtered.filter(p => isPriceInRange(p.price, minPriceNum, maxPriceNum));
    }
    
    // Apply sorting
    if (sortOrder !== 'none') {
      const ascending = sortOrder === 'low-high';
      filtered = [...filtered].sort((a, b) => comparePrices(a.price, b.price, ascending));
    }
    
    return filtered;
  }, [allProductsRaw, sortOrder, minPriceNum, maxPriceNum, showFavoritesOnly, isFavorite]);
  
  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_ITEMS);
  }, [sortOrder, minPrice, maxPrice, showFavoritesOnly, results]);
  
  // Get the products to display based on visibleCount
  const visibleProducts = useMemo(() => {
    return allProducts.slice(0, visibleCount);
  }, [allProducts, visibleCount]);
  
  const hasMoreToLoad = visibleCount < allProducts.length;
  
  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMoreToLoad) return;
    
    setIsLoadingMore(true);
    // Small delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + ITEMS_PER_LOAD, allProducts.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreToLoad, allProducts.length]);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || viewMode !== 'grid') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreToLoad && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, [hasMoreToLoad, isLoadingMore, handleLoadMore, viewMode]);
  
  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 800);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearFilters = () => {
    setSortOrder('none');
    setMinPrice('');
    setMaxPrice('');
  };
  
  const totalResults = allProducts.length;
  const storesWithErrors = results.stores.filter(s => s.error);
  const storesWithResults = results.stores.filter(s => s.count > 0);

  const toggleStoreExpand = (storeId: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Results header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-charcoal">
              {allProducts.length} {allProducts.length === 1 ? 'piece' : 'pieces'} found
              {allProducts.length !== allProductsRaw.length && (
                <span className="text-warmGray text-lg font-normal ml-2">
                  (of {allProductsRaw.length})
                </span>
              )}
            </h2>
            <p className="text-sm text-warmGray mt-1">
              for "{results.query}"{results.category && ` in ${results.category}`} • {storesWithResults.length} stores
            </p>
          </div>
          
          {/* View toggle */}
          <div className="flex items-center gap-2">
            {/* Favorites toggle */}
            {onToggleFavoritesView && (
              <button
                onClick={onToggleFavoritesView}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  showFavoritesOnly
                    ? 'bg-rose text-white border-rose'
                    : 'bg-white border-gray-200 text-warmGray hover:border-rose hover:text-rose'
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
                {favoritesCount > 0 && (
                  <span className={`min-w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    showFavoritesOnly ? 'bg-white/20' : 'bg-rose/10 text-rose'
                  }`}>
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}
            
            {/* Grid/List toggle */}
            <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-soft border border-gray-100">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'grid' 
                  ? 'bg-charcoal text-white' 
                  : 'text-warmGray hover:text-charcoal'
              }`}
            >
              <Grid className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setViewMode('byStore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                viewMode === 'byStore' 
                  ? 'bg-charcoal text-white' 
                  : 'text-warmGray hover:text-charcoal'
              }`}
            >
              <List className="w-4 h-4" />
              By Store
            </button>
          </div>
          </div>
        </div>
        
        {/* Price controls - sorting and filtering */}
        <PriceControls
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        
        {/* Similar searches suggestions */}
        {onNewSearch && results.query && (
          <SimilarSearches query={results.query} onSearch={onNewSearch} />
        )}
      </motion.div>

      {/* Error alerts */}
      {storesWithErrors.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Some stores couldn't be reached</p>
              <p className="mt-1 text-xs text-amber-700">
                {storesWithErrors.map(s => s.name).join(', ')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No results */}
      {totalResults === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-blush/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-rose/50" />
          </div>
          <h3 className="font-display text-2xl text-charcoal mb-2">
            No items found
          </h3>
          <p className="text-warmGray max-w-md mx-auto">
            Try different keywords or select more stores to expand your search.
          </p>
        </motion.div>
      )}

      {/* Grid view — no Framer wrapper, cards handle their own entrance */}
      {viewMode === 'grid' && totalResults > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {visibleProducts.map((product, index) => (
              <ItemErrorBoundary key={product.id} name={`ProductCard-${product.id}`}>
                <ProductCard 
                  product={product} 
                  store={product.storeData}
                  index={index}
                  isFavorite={isFavorite(product)}
                  onToggleFavorite={onToggleFavorite}
                  onImageZoom={openZoom}
                />
              </ItemErrorBoundary>
            ))}
          </div>
          
          {/* Load more / infinite scroll trigger */}
          {hasMoreToLoad && (
            <div ref={loadMoreRef} className="flex flex-col items-center py-8 gap-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-warmGray">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-white dark:bg-[#1a1a1a] rounded-full shadow-soft border border-gray-200 dark:border-[#2d2d2d] text-sm font-medium text-charcoal hover:border-rose hover:text-rose transition-colors active:scale-95"
                >
                  Load More ({allProducts.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
          
          {/* End of results indicator */}
          {!hasMoreToLoad && allProducts.length > INITIAL_ITEMS && (
            <p className="text-center text-sm text-warmGray py-6">
              You've seen all {allProducts.length} items ✨
            </p>
          )}
        </>
      )}

      {/* By store view — CSS stagger instead of Framer per-store delay */}
      {viewMode === 'byStore' && totalResults > 0 && (
        <div className="space-y-10">
          {results.stores
            .filter(store => store.count > 0)
            .map((storeResult, storeIndex) => {
              const store = storeMap.get(storeResult.id);
              const isExpanded = expandedStores.has(storeResult.id);
              const displayProducts = isExpanded 
                ? storeResult.results 
                : storeResult.results.slice(0, 4);
              
              return (
                <div
                  key={storeResult.id}
                  className="space-y-4 fade-slide-up"
                  style={{ animationDelay: `${Math.min(storeIndex * 100, 500)}ms` }}
                >
                  {/* Store header */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2d2d2d] pb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-soft"
                        style={{ backgroundColor: `${store?.color}10` }}
                      >
                        {store?.logo}
                      </div>
                      <div>
                        <h3 
                          className="font-display text-xl font-medium"
                          style={{ color: store?.color }}
                        >
                          {storeResult.name}
                        </h3>
                        <p className="text-sm text-warmGray">
                          {storeResult.count} item{storeResult.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {storeResult.results.length > 4 && (
                      <button
                        onClick={() => toggleStoreExpand(storeResult.id)}
                        className="flex items-center gap-1 text-sm font-medium text-warmGray hover:text-charcoal dark:hover:text-gray-200 transition-colors"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>View all {storeResult.count} <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Products */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {displayProducts.map((product, index) => (
                      <ItemErrorBoundary key={product.id} name={`ProductCard-${product.id}`}>
                        <ProductCard 
                          product={product} 
                          store={store}
                          index={index}
                          isFavorite={isFavorite(product)}
                          onToggleFavorite={onToggleFavorite}
                          onImageZoom={openZoom}
                        />
                      </ItemErrorBoundary>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {/* Scroll to top button — CSS animation instead of Framer AnimatePresence */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-rose text-white rounded-full shadow-lg flex items-center justify-center hover:bg-rose/90 transition-colors active:scale-90"
          style={{ animation: 'scrollTopEnter 0.2s ease-out' }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      
      {/* Image zoom modal */}
      <ImageZoom
        product={zoomProduct}
        store={zoomStore}
        isOpen={isZoomOpen}
        onClose={closeZoom}
        isFavorite={zoomProduct ? isFavorite(zoomProduct) : false}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
}
