import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { Store } from '../types';
import { STORE_CATEGORIES } from '../types';

interface StoreManagerProps {
  stores: Store[];
  selectedStores: string[];
  onToggleStore: (storeId: string) => void;
  onSelectAll: (category: string) => void;
  onDeselectAll: (category: string) => void;
}

export function StoreManager({ 
  stores, 
  selectedStores, 
  onToggleStore, 
  onSelectAll, 
  onDeselectAll 
}: StoreManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['boutique', 'premium', 'fast-fashion'])
  );

  // Group stores by category
  const storesByCategory = stores.reduce((acc, store) => {
    if (!acc[store.category]) {
      acc[store.category] = [];
    }
    acc[store.category].push(store);
    return acc;
  }, {} as Record<string, Store[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categoryOrder = ['boutique', 'premium', 'fast-fashion', 'uk-fashion', 'casual'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-charcoal">
          Select stores to search
          <span className="text-warmGray font-normal ml-2">
            ({selectedStores.length} of {stores.length})
          </span>
        </p>
        {selectedStores.length > 0 && (
          <button
            onClick={() => categoryOrder.forEach(cat => onDeselectAll(cat))}
            className="text-xs text-rose hover:text-rose/80 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {categoryOrder.map((categoryId) => {
          const categoryStores = storesByCategory[categoryId] || [];
          const categoryInfo = STORE_CATEGORIES[categoryId];
          const isExpanded = expandedCategories.has(categoryId);
          const selectedInCategory = categoryStores.filter(s => 
            selectedStores.includes(s.id)
          ).length;
          
          return (
            <motion.div
              key={categoryId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 rounded-2xl border border-gray-100 overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(categoryId)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryInfo?.icon}</span>
                  <span className="font-medium text-sm text-charcoal">
                    {categoryInfo?.name}
                  </span>
                  <span className="text-xs text-warmGray bg-gray-100 px-2 py-0.5 rounded-full">
                    {selectedInCategory}/{categoryStores.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectAll(categoryId); }}
                        className="text-xs text-rose hover:underline"
                      >
                        All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeselectAll(categoryId); }}
                        className="text-xs text-warmGray hover:underline"
                      >
                        None
                      </button>
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-warmGray" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-warmGray" />
                  )}
                </div>
              </button>
              
              {/* Store tags */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3"
                >
                  <div className="flex flex-wrap gap-2">
                    {categoryStores.map((store) => {
                      const isSelected = selectedStores.includes(store.id);
                      
                      return (
                        <button
                          key={store.id}
                          onClick={() => onToggleStore(store.id)}
                          className={`store-tag ${isSelected ? 'store-tag-active' : 'store-tag-inactive'}`}
                          style={isSelected ? { 
                            color: store.color, 
                            backgroundColor: `${store.color}10`,
                            borderColor: store.color 
                          } : undefined}
                        >
                          <span className="text-sm">{store.logo}</span>
                          <span className="text-xs">{store.name}</span>
                          {isSelected && (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {selectedStores.length === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-rose text-center py-2"
        >
          Please select at least one store to search
        </motion.p>
      )}
      
      {selectedStores.length > 4 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-warmGray text-center"
        >
          💡 Searching {selectedStores.length} stores may take 30-60 seconds
        </motion.p>
      )}
    </div>
  );
}
