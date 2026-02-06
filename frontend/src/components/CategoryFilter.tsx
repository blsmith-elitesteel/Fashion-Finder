import { CLOTHING_CATEGORIES } from '../types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Category filter pills — optimized for mobile touch scrolling.
 * 
 * Changes from v7:
 * - Removed Framer Motion per-pill stagger animation (was re-running on every
 *   render, not just mount, causing visible jank on category switch)
 * - Uses CSS `category-pills-enter` animation for a single fade-slide on mount
 * - `-webkit-overflow-scrolling: touch` for native iOS momentum scrolling
 * - Larger touch targets (min-h-[44px]) per Apple HIG
 * - Active pill gets a subtle scale bump via CSS transition
 */
export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 category-pills-enter" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-2 py-1">
        {CLOTHING_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`category-pill min-h-[44px] transition-all duration-200 ${
                isActive 
                  ? 'category-pill-active scale-[1.02]' 
                  : 'category-pill-inactive active:scale-95'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
