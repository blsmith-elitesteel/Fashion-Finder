import { useState, useCallback } from 'react';
import { ArrowUpDown, SlidersHorizontal, X } from 'lucide-react';

export type SortOrder = 'none' | 'low-high' | 'high-low';

interface PriceControlsProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Sanitize price input to allow only valid price characters.
 * Allows: digits, single decimal point, empty string
 * Prevents: multiple decimals, letters, special chars
 */
function sanitizePriceInput(value: string): string {
  // Remove anything that's not a digit or decimal
  let sanitized = value.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the first
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2 (cents)
  if (parts.length === 2 && parts[1].length > 2) {
    sanitized = parts[0] + '.' + parts[1].slice(0, 2);
  }
  
  return sanitized;
}

export function PriceControls({
  sortOrder,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onClearFilters,
  hasActiveFilters
}: PriceControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePriceInput(e.target.value);
    onMinPriceChange(sanitized);
  }, [onMinPriceChange]);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePriceInput(e.target.value);
    onMaxPriceChange(sanitized);
  }, [onMaxPriceChange]);
  
  // Validate that sort order is a known value (defensive against bad props)
  const safeSortOrder: SortOrder = 
    sortOrder === 'low-high' || sortOrder === 'high-low' ? sortOrder : 'none';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort dropdown */}
      <div className="relative">
        <select
          value={safeSortOrder}
          onChange={(e) => onSortChange(e.target.value as SortOrder)}
          className="appearance-none bg-white border border-gray-200 rounded-full px-4 py-2 pr-10 text-sm font-medium text-charcoal hover:border-rose focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all cursor-pointer"
        >
          <option value="none">Sort by Price</option>
          <option value="low-high">Price: Low → High</option>
          <option value="high-low">Price: High → Low</option>
        </select>
        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warmGray pointer-events-none" />
      </div>

      {/* Price filter toggle (mobile-friendly) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
          isExpanded || hasActiveFilters
            ? 'bg-rose/10 border-rose text-rose'
            : 'bg-white border-gray-200 text-charcoal hover:border-rose'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">Price Range</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 bg-rose rounded-full" />
        )}
      </button>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-warmGray hover:text-rose transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      )}

      {/* Expanded price range inputs */}
      {isExpanded && (
        <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmGray text-sm">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Min"
              value={minPrice}
              onChange={handleMinChange}
              className="w-20 sm:w-24 pl-7 pr-2 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
            />
          </div>
          <span className="text-warmGray">–</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warmGray text-sm">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Max"
              value={maxPrice}
              onChange={handleMaxChange}
              className="w-20 sm:w-24 pl-7 pr-2 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
