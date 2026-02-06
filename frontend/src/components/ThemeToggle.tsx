import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

/**
 * Theme toggle button with three states: light, dark, system.
 * Shows current resolved theme icon.
 */
export function ThemeToggle({ theme, setTheme, resolvedTheme }: ThemeToggleProps) {
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-4 h-4" />;
    }
    return resolvedTheme === 'dark' 
      ? <Moon className="w-4 h-4" />
      : <Sun className="w-4 h-4" />;
  };
  
  const getLabel = () => {
    if (theme === 'system') return 'System theme';
    return theme === 'dark' ? 'Dark mode' : 'Light mode';
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={cycleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-charcoal dark:text-zinc-200 hover:border-rose dark:hover:border-rose transition-colors shadow-soft"
      aria-label={getLabel()}
      title={getLabel()}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.div>
    </motion.button>
  );
}

/**
 * Expanded theme selector with all three options visible.
 */
export function ThemeSelector({ theme, setTheme }: Omit<ThemeToggleProps, 'resolvedTheme'>) {
  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
            theme === option.value
              ? 'bg-white dark:bg-zinc-700 text-charcoal dark:text-white shadow-sm'
              : 'text-warmGray dark:text-zinc-400 hover:text-charcoal dark:hover:text-white'
          }`}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
