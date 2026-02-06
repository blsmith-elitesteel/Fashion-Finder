import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Store } from '../types';

interface LoadingStateProps {
  query: string;
  storeCount: number;
  selectedStores?: string[];
  stores?: Store[];
}

/**
 * Loading state — optimized for mobile performance.
 * 
 * Changes from v7:
 * - Removed N×setTimeout + N×setState per-store simulation (was creating
 *   storeCount number of timers + state updates, hammering the render loop)
 * - Now uses a single requestAnimationFrame-based counter that increments
 *   one "completed" store every ~800ms via a ref (single setState per tick)
 * - Skeleton cards use CSS stagger animation instead of Framer per-card delays
 * - Progress bar uses CSS transition instead of Framer animate
 * - Bouncing emoji uses CSS animation instead of Framer
 */
export function LoadingState({ query, storeCount, selectedStores = [], stores = [] }: LoadingStateProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  
  // Single interval that ticks one store forward at a time (not N timers)
  useEffect(() => {
    if (storeCount === 0) return;
    
    setCompletedCount(0);
    let count = 0;
    
    // Stagger completions at ~800ms intervals
    timerRef.current = setInterval(() => {
      count++;
      if (count >= storeCount) {
        clearInterval(timerRef.current);
      }
      setCompletedCount(count);
    }, 600 + Math.random() * 400);
    
    return () => clearInterval(timerRef.current);
  }, [storeCount, selectedStores]);
  
  const getStore = (id: string) => stores.find(s => s.id === id);
  const progressPercent = Math.max(10, (completedCount / storeCount) * 100);

  return (
    <div className="space-y-8">
      {/* Loading header */}
      <div className="text-center py-8 loading-header-enter">
        {/* Bouncing emoji — CSS animation instead of Framer */}
        <div className="text-6xl mb-6 loading-bounce">
          👗
        </div>
        
        <h2 className="font-display text-2xl text-charcoal mb-2">
          Searching for "{query}"
        </h2>
        <p className="text-warmGray">
          Checking {storeCount} fashion stores...
        </p>
        
        {/* Progress bar — CSS transition */}
        <div className="max-w-xs mx-auto mt-4">
          <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose to-pink-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-warmGray mt-2">
            {completedCount} of {storeCount} stores checked
          </p>
        </div>
      </div>
      
      {/* Per-store status — uses CSS stagger, not per-store JS state */}
      {selectedStores.length > 0 && stores.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-[#2d2d2d] loading-section-enter">
          <p className="text-sm font-medium text-charcoal mb-3">Store Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selectedStores.map((storeId, i) => {
              const store = getStore(storeId);
              // Each store "completes" when the counter passes its index
              const isDone = i < completedCount;
              
              return (
                <div
                  key={storeId}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-300 ${
                    isDone 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-gray-50 dark:bg-zinc-800 text-warmGray'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  )}
                  <span className="truncate">{store?.name || storeId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skeleton grid — CSS stagger animation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="card-fashion skeleton-card-enter"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="aspect-[3/4] shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-4 shimmer rounded-full w-full" />
              <div className="h-4 shimmer rounded-full w-2/3" />
              <div className="h-6 shimmer rounded-full w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
