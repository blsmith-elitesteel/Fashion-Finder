import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  recentSearches: string[];
  disabled?: boolean;
}

export function SearchBar({ onSearch, isLoading, recentSearches, disabled }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Fashion-specific suggestions
  const fashionSuggestions = [
    'summer dress', 'crop top', 'high waisted jeans', 'maxi skirt',
    'bodycon dress', 'oversized blazer', 'wide leg pants', 'midi dress'
  ];

  const filteredSuggestions = query 
    ? recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : recentSearches.slice(0, 3);

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative transition-shadow duration-300">
          <div className={`absolute left-5 top-1/2 -translate-y-1/2 text-warmGray transition-colors duration-200 ${isFocused ? 'text-rose' : ''}`}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search for summer dresses, crop tops, jeans..."
            disabled={disabled || isLoading}
            className="input-field pl-14 pr-32 text-sm"
          />
          
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={clearQuery}
                className="absolute right-28 top-1/2 -translate-y-1/2 p-1.5 text-warmGray hover:text-charcoal transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <button
            type="submit"
            disabled={!query.trim() || disabled || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      <AnimatePresence>
        {showSuggestions && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden z-50"
          >
            <div className="p-3">
              {filteredSuggestions.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-warmGray flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recent
                  </div>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={`recent-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blush/30 rounded-xl transition-colors flex items-center gap-3 group"
                    >
                      <Clock className="w-4 h-4 text-warmGray/50" />
                      <span className="text-charcoal text-sm">{suggestion}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-2" />
                </>
              )}
              
              <div className="px-2 py-1.5 text-xs font-medium text-warmGray">
                ✨ Try searching for
              </div>
              <div className="flex flex-wrap gap-2 px-2 py-1">
                {fashionSuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={`fashion-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-3 py-1.5 bg-blush/30 hover:bg-blush rounded-full text-charcoal transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
