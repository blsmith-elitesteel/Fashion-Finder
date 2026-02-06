import { Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';

type Theme = 'light' | 'dark' | 'system';

interface HeaderProps {
  onReset?: () => void;
  onViewFavorites?: () => void;
  favoritesCount?: number;
  theme?: Theme;
  setTheme?: (theme: Theme) => void;
  resolvedTheme?: 'light' | 'dark';
}

export function Header({ 
  onReset, 
  onViewFavorites, 
  favoritesCount = 0,
  theme = 'system',
  setTheme,
  resolvedTheme = 'light'
}: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-cream/90 backdrop-blur-lg border-b border-blush/50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={onReset}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-rose to-dustyRose rounded-2xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
                <span className="text-xl">👗</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-gold" />
              </motion.div>
            </div>
            <div className="text-left">
              <h1 className="font-display font-semibold text-xl text-charcoal leading-tight tracking-tight">
                Fashion Finder
              </h1>
              <p className="text-xs text-warmGray font-body">
                Your style, every store
              </p>
            </div>
          </button>
          
          {/* Right side: tagline + theme + favorites */}
          <div className="flex items-center gap-3">
            {/* Tagline - hidden on mobile */}
            <div className="hidden md:flex items-center">
              <span className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-soft border border-blush/30 dark:border-zinc-700 font-body text-sm text-warmGray dark:text-zinc-300">
                ✨ 13 fashion stores, one search
              </span>
            </div>
            
            {/* Theme toggle */}
            {setTheme && (
              <ThemeToggle 
                theme={theme} 
                setTheme={setTheme} 
                resolvedTheme={resolvedTheme} 
              />
            )}
            
            {/* Favorites button */}
            {onViewFavorites && (
              <button
                onClick={onViewFavorites}
                className="relative flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft border border-gray-100 hover:border-rose/50 transition-all group"
                aria-label="View favorites"
              >
                <Heart className="w-5 h-5 text-rose group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline text-sm font-medium text-charcoal">Favorites</span>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-rose text-white text-xs font-medium rounded-full flex items-center justify-center px-1.5">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
