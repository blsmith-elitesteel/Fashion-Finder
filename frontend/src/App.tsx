import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Sparkles, Heart } from 'lucide-react';

import { Header } from './components/Header';
import { StoreManager } from './components/StoreManager';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { LoadingState } from './components/LoadingState';
import { InstallPrompt } from './components/InstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FavoritesView } from './components/FavoritesView';

import { useLocalStorage, useRecentSearches } from './hooks/useLocalStorage';
import { useFavorites } from './hooks/useFavorites';
import { useDarkMode } from './hooks/useDarkMode';
import { DEFAULT_STORES, STORE_CATEGORIES, type SearchResponse } from './types';

const API_BASE = '/api';

function App() {
  // State
  const [selectedStores, setSelectedStores] = useLocalStorage<string[]>(
    'selectedStores',
    ['princesspolly', 'revolve', 'lulus', 'zara'] // Default fashion favorites
  );
  const [selectedCategory, setSelectedCategory] = useLocalStorage<string>(
    'selectedCategory',
    'all'
  );
  const { searches: recentSearches, addSearch } = useRecentSearches(10);
  
  // Dark mode
  const { theme, resolvedTheme, setTheme } = useDarkMode();
  
  // Favorites - get clearFavorites too for the dedicated view
  const { favorites, isFavorite, toggleFavorite, clearFavorites, shareFavorites, exportFavoritesCSV, count: favoritesCount } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // View mode: 'search' for normal search view, 'favorites' for dedicated favorites page
  const [viewMode, setViewMode] = useState<'search' | 'favorites'>('search');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  // Toggle store selection
  const handleToggleStore = useCallback((storeId: string) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      }
      return [...prev, storeId];
    });
  }, [setSelectedStores]);

  // Select all stores in a category
  const handleSelectAllInCategory = useCallback((category: string) => {
    const categoryStores = DEFAULT_STORES.filter(s => s.category === category).map(s => s.id);
    setSelectedStores(prev => {
      const others = prev.filter(id => !categoryStores.includes(id));
      return [...others, ...categoryStores];
    });
  }, [setSelectedStores]);

  // Deselect all stores in a category
  const handleDeselectAllInCategory = useCallback((category: string) => {
    const categoryStores = DEFAULT_STORES.filter(s => s.category === category).map(s => s.id);
    setSelectedStores(prev => prev.filter(id => !categoryStores.includes(id)));
  }, [setSelectedStores]);

  // Perform search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || selectedStores.length === 0) return;
    
    setCurrentQuery(query);
    setIsLoading(true);
    setError(null);
    addSearch(query);

    try {
      const response = await axios.post<SearchResponse>(`${API_BASE}/search`, {
        query: query.trim(),
        stores: selectedStores,
        category: selectedCategory !== 'all' ? selectedCategory : null
      }, {
        timeout: 120000 // 120 second timeout for multiple stores
      });

      setResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Search timed out. Try selecting fewer stores.');
        } else if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to connect. Make sure the backend is running.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedStores, selectedCategory, addSearch]);

  // Reset - also returns to search view if on favorites
  const handleReset = useCallback(() => {
    setResults(null);
    setError(null);
    setCurrentQuery('');
    setViewMode('search');
    setShowFavoritesOnly(false);
  }, []);

  // If viewing favorites page, render that instead
  if (viewMode === 'favorites') {
    return (
      <div className="min-h-screen">
        <Header 
          onReset={handleReset}
          onViewFavorites={() => setViewMode('favorites')}
          favoritesCount={favoritesCount}
          theme={theme}
          setTheme={setTheme}
          resolvedTheme={resolvedTheme}
        />
        
        <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <ErrorBoundary name="FavoritesView" level="critical">
            <FavoritesView
              favorites={favorites}
              stores={DEFAULT_STORES}
              onToggleFavorite={toggleFavorite}
              onClearAll={clearFavorites}
              onShare={shareFavorites}
              onExportCSV={exportFavoritesCSV}
              onClose={() => setViewMode('search')}
            />
          </ErrorBoundary>
        </main>
        
        <InstallPrompt />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        onReset={handleReset}
        onViewFavorites={() => setViewMode('favorites')}
        favoritesCount={favoritesCount}
        theme={theme}
        setTheme={setTheme}
        resolvedTheme={resolvedTheme}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero section — no AnimatePresence mode="wait" (was blocking search card) */}
        {!results && !isLoading && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-10"
          >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1a] rounded-full shadow-soft mb-6 border border-blush/30 dark:border-[#2d2d2d]"
              >
                <Sparkles className="w-4 h-4 text-rose" />
                <span className="text-sm font-medium text-charcoal">
                  13 fashion stores • One search
                </span>
              </motion.div>
              
              <h1 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-charcoal mb-4">
                Find your next
                <span className="text-rose italic"> favorite piece</span>
              </h1>
              
              <p className="text-lg text-warmGray max-w-2xl mx-auto font-light">
                Search Princess Polly, Lulus, Nordstrom, ASOS, and 9 more stores instantly.
                Compare prices and find the perfect outfit.
              </p>
            </motion.div>
          )}

        {/* Search section — CSS transition instead of Framer layout animation */}
        <div
          className={`bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-card border border-gray-100/50 dark:border-[#2d2d2d] p-5 md:p-6 mb-8 transition-all duration-300 ${
            results || isLoading ? 'sticky top-20 z-40' : ''
          }`}
        >
          <div className="space-y-5">
            {/* Category filter - show prominently */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            
            {/* Search bar */}
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              recentSearches={recentSearches}
              disabled={selectedStores.length === 0}
            />
            
            {/* Store selector - collapsible */}
            <details className="group" open={!results && !isLoading}>
              <summary className="cursor-pointer text-sm font-medium text-warmGray hover:text-charcoal dark:hover:text-gray-200 transition-colors list-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Select stores ({selectedStores.length} selected)
              </summary>
              <div className="mt-4">
                <StoreManager
                  stores={DEFAULT_STORES}
                  selectedStores={selectedStores}
                  onToggleStore={handleToggleStore}
                  onSelectAll={handleSelectAllInCategory}
                  onDeselectAll={handleDeselectAllInCategory}
                />
              </div>
            </details>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 mb-8"
            >
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <LoadingState 
            query={currentQuery} 
            storeCount={selectedStores.length}
            selectedStores={selectedStores}
            stores={DEFAULT_STORES}
          />
        )}

        {/* Results - wrapped in ErrorBoundary to prevent crashes from blanking page */}
        {results && !isLoading && (
          <ErrorBoundary name="ProductGrid" level="critical">
            <ProductGrid 
              results={results} 
              stores={DEFAULT_STORES}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavoritesView={() => setShowFavoritesOnly(prev => !prev)}
              favoritesCount={favoritesCount}
              onNewSearch={handleSearch}
            />
          </ErrorBoundary>
        )}

        {/* Empty state */}
        {!results && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-12"
          >
            {/* Store logos showcase */}
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-8">
              {DEFAULT_STORES.slice(0, 10).map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`bg-white dark:bg-[#1f1f1f] rounded-2xl px-4 py-3 shadow-soft border border-gray-100 dark:border-[#2d2d2d] text-center ${
                    selectedStores.includes(store.id) ? 'ring-2 ring-rose/30' : ''
                  }`}
                >
                  <span className="text-xl">{store.logo}</span>
                  <p className="text-xs text-warmGray mt-1">{store.name}</p>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className="bg-blush/30 rounded-2xl px-4 py-3 text-center flex items-center"
              >
                <p className="text-xs text-rose font-medium">+3 more</p>
              </motion.div>
            </div>
            
            <p className="text-warmGray">
              Select your favorite stores and start searching! 👗
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-[#2d2d2d] bg-white/50 dark:bg-[#0f0f0f]/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-warmGray flex items-center gap-2">
              Made with <Heart className="w-4 h-4 text-rose fill-current" /> for fashion lovers
            </p>
            <p className="text-xs text-warmGray/60">
              Results fetched in real-time from each store
            </p>
          </div>
        </div>
      </footer>
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
