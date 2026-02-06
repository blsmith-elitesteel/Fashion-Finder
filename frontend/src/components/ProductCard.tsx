import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ExternalLink, ImageOff, Heart, Tag, ZoomIn } from 'lucide-react';
import { detectSalePrice } from '../utils/price';
import type { Product, Store } from '../types';

interface ProductCardProps {
  product: Product;
  store?: Store;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onImageZoom?: (product: Product, store?: Store) => void;
}

/**
 * ProductCard — optimized for mobile (iPhone PWA) performance.
 * 
 * Key changes from v7:
 * - Replaced Framer Motion with CSS animations & IntersectionObserver
 *   for GPU-composited, jank-free entrance on scroll
 * - Removed per-card staggered JS delays (was index * 0.04s = 4s for card #100)
 * - Uses CSS `animation-delay` via stagger class for first 8 cards only;
 *   all subsequent cards animate immediately on intersection
 * - Favorite/action buttons use pure CSS opacity transitions instead of
 *   Framer Motion animate on every hover state change
 * - Sale badge uses CSS keyframe instead of Framer spring
 * - Image hover overlay uses CSS transition, not JS-driven opacity
 * - `will-change: transform` on card for smooth iOS compositing
 * - `content-visibility: auto` on card for off-screen rendering skip
 */
export function ProductCard({ 
  product, 
  store, 
  index, 
  isFavorite = false,
  onToggleFavorite,
  onImageZoom
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const storeColor = store?.color || '#666';
  
  const saleInfo = useMemo(() => detectSalePrice(product.price), [product.price]);

  // IntersectionObserver for scroll-triggered entrance — one observe per card,
  // fires once then disconnects (no ongoing observation cost)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(product);
  }, [onToggleFavorite, product]);
  
  const handleZoomClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onImageZoom?.(product, store);
  }, [onImageZoom, product, store]);

  // CSS stagger: only first 8 cards get a stagger delay (keeps first screenful feeling polished).
  // Cards beyond that animate instantly on intersection — no waiting.
  const staggerStyle = index < 8
    ? { animationDelay: `${index * 50}ms` } as React.CSSProperties
    : undefined;

  return (
    <a
      ref={cardRef}
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`card-fashion group cursor-pointer flex flex-col h-full relative product-card-enter ${
        isVisible ? 'product-card-visible' : ''
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 400px',
        willChange: isVisible ? 'auto' : 'transform, opacity',
        ...staggerStyle,
      }}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-gray-50 dark:bg-zinc-800 overflow-hidden">
        {/* Store badge */}
        <div 
          className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-md backdrop-blur-sm max-w-[45%] truncate"
          style={{ backgroundColor: `${storeColor}dd` }}
        >
          {product.storeName}
        </div>
        
        {/* Sale badge — CSS animation instead of Framer spring */}
        {saleInfo.isSale && saleInfo.discountPercent && (
          <div className="absolute top-2 right-14 z-10 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-red-500 to-rose text-white text-xs font-bold rounded-md shadow-md sale-badge-pop">
            <Tag className="w-3 h-3" />
            {saleInfo.discountPercent}% OFF
          </div>
        )}
        
        {/* Action buttons — CSS-only show/hide, no JS hover state tracking */}
        <div className={`absolute top-3 right-3 z-10 flex flex-col gap-2 transition-opacity duration-200 ${
          isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } touch-device-visible`}>
          <button 
            onClick={handleFavoriteClick}
            className={`w-10 h-10 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 ${
              isFavorite 
                ? 'bg-rose text-white scale-100' 
                : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-rose hover:text-white text-charcoal dark:text-gray-300'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {onImageZoom && (
            <button
              onClick={handleZoomClick}
              className="w-10 h-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-charcoal hover:text-white transition-colors duration-200 md:hidden"
              aria-label="Zoom image"
            >
              <ZoomIn className="w-4 h-4 text-charcoal dark:text-gray-300" />
            </button>
          )}
          <div className="w-10 h-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-md items-center justify-center hidden md:flex">
            <ExternalLink className="w-4 h-4 text-charcoal dark:text-gray-300" />
          </div>
        </div>
        
        {/* Image with native lazy loading */}
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 shimmer" aria-hidden="true" />
            )}
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blush/20 dark:bg-zinc-800">
            <div className="text-center text-warmGray">
              <ImageOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span className="text-xs">No image</span>
            </div>
          </div>
        )}
        
        {/* Quick view overlay — pure CSS transition */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="text-white text-sm font-medium">
            View on {product.storeName} →
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="font-body font-medium text-charcoal text-sm leading-snug line-clamp-2 group-hover:text-rose transition-colors duration-200 mb-2">
          {product.title}
        </h3>
        
        <div className="mt-auto">
          {saleInfo.isSale && saleInfo.originalPrice ? (
            <div className="flex items-baseline gap-2">
              <p className="font-display font-semibold text-xl text-rose">
                ${saleInfo.salePrice?.toFixed(2)}
              </p>
              <p className="text-sm text-warmGray line-through">
                ${saleInfo.originalPrice.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="font-display font-semibold text-xl text-charcoal">
              {product.price}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
