import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SimilarSearchesProps {
  query: string;
  onSearch: (query: string) => void;
}

/**
 * Suggests related searches based on the current query.
 * Uses keyword extraction to suggest variations.
 */
export function SimilarSearches({ query, onSearch }: SimilarSearchesProps) {
  const suggestions = useMemo(() => {
    return generateSuggestions(query);
  }, [query]);
  
  if (suggestions.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blush/20 rounded-2xl p-4 border border-blush/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-rose" />
        <span className="text-sm font-medium text-charcoal">Similar searches</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSearch(suggestion)}
            className="px-3 py-1.5 bg-white rounded-full text-sm text-warmGray hover:text-rose hover:border-rose border border-gray-200 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Generate search suggestions based on the query.
 * 
 * Strategy:
 * 1. Extract key terms (colors, styles, types)
 * 2. Generate variations with common modifiers
 * 3. Remove duplicates and the original query
 */
function generateSuggestions(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const words = normalizedQuery.split(/\s+/);
  const suggestions: Set<string> = new Set();
  
  // Common fashion colors
  const colors = ['black', 'white', 'red', 'blue', 'pink', 'green', 'beige', 'brown', 'navy', 'cream', 'floral', 'striped'];
  
  // Common styles
  const styles = ['mini', 'midi', 'maxi', 'cropped', 'oversized', 'fitted', 'relaxed', 'high waisted', 'low rise'];
  
  // Common clothing types
  const types = ['dress', 'top', 'jeans', 'pants', 'skirt', 'shorts', 'blazer', 'jacket', 'cardigan', 'sweater', 'blouse', 'shirt'];
  
  // Common occasions/vibes
  const occasions = ['casual', 'party', 'date night', 'work', 'vacation', 'summer', 'winter', 'boho', 'chic'];
  
  // Find what type of item was searched
  const foundType = types.find(t => normalizedQuery.includes(t));
  const foundColor = colors.find(c => normalizedQuery.includes(c));
  const foundStyle = styles.find(s => normalizedQuery.includes(s));
  
  // Generate variations
  if (foundType) {
    // Suggest different colors for the same type
    colors.filter(c => c !== foundColor).slice(0, 3).forEach(color => {
      suggestions.add(`${color} ${foundType}`);
    });
    
    // Suggest different styles for the same type
    styles.filter(s => s !== foundStyle).slice(0, 2).forEach(style => {
      suggestions.add(`${style} ${foundType}`);
    });
    
    // Suggest occasions
    occasions.slice(0, 2).forEach(occasion => {
      suggestions.add(`${occasion} ${foundType}`);
    });
  }
  
  // If searching for color + type, suggest other types in same color
  if (foundColor && foundType) {
    types.filter(t => t !== foundType).slice(0, 3).forEach(type => {
      suggestions.add(`${foundColor} ${type}`);
    });
  }
  
  // Suggest "matching" items
  const matchingItems: Record<string, string[]> = {
    'dress': ['heels', 'cardigan', 'clutch'],
    'jeans': ['crop top', 'blouse', 'sneakers'],
    'top': ['high waisted jeans', 'midi skirt', 'wide leg pants'],
    'skirt': ['bodysuit', 'tank top', 'blouse'],
    'blazer': ['trousers', 'bodysuit', 'straight leg pants'],
    'shorts': ['tank top', 'linen shirt', 'sandals']
  };
  
  if (foundType && matchingItems[foundType]) {
    matchingItems[foundType].forEach(item => {
      suggestions.add(item);
    });
  }
  
  // Add some generic trendy suggestions if we don't have enough
  const trendySuggestions = [
    'linen pants',
    'crochet top',
    'slip dress',
    'cargo pants',
    'matching set',
    'tube top',
    'wide leg jeans',
    'bodycon dress'
  ];
  
  if (suggestions.size < 5) {
    trendySuggestions
      .filter(s => !s.includes(normalizedQuery) && !normalizedQuery.includes(s))
      .slice(0, 5 - suggestions.size)
      .forEach(s => suggestions.add(s));
  }
  
  // Remove the original query and return
  suggestions.delete(normalizedQuery);
  
  return Array.from(suggestions)
    .filter(s => s !== normalizedQuery && s.length > 2)
    .slice(0, 6);
}
