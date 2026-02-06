import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for ErrorBoundary component.
 * 
 * @param children - Components to wrap and protect
 * @param fallback - Optional custom fallback UI (default provided)
 * @param onError - Optional callback when error occurs (for logging/analytics)
 * @param level - Severity level affects styling ('section' for recoverable, 'critical' for page-level)
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'section' | 'critical';
  /** Identifier for debugging which boundary caught the error */
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for graceful failure containment.
 * 
 * PURPOSE:
 * - Prevents a single component crash from blanking the entire page
 * - Shows user-friendly fallback instead of white screen
 * - Logs error details for debugging
 * 
 * USAGE:
 * Wrap around components that might fail due to bad data:
 * 
 * <ErrorBoundary name="ProductGrid">
 *   <ProductGrid ... />
 * </ErrorBoundary>
 * 
 * For individual items in a list, wrap each item:
 * 
 * {products.map(p => (
 *   <ErrorBoundary key={p.id} name="ProductCard" level="section">
 *     <ProductCard product={p} />
 *   </ErrorBoundary>
 * ))}
 * 
 * LIMITATIONS:
 * - Only catches errors in render, lifecycle, and constructors
 * - Does NOT catch: event handlers, async code, SSR, errors in boundary itself
 * - For event handler errors, use try/catch within the handler
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to render fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    const boundaryName = this.props.name || 'Unknown';
    console.error(`[ErrorBoundary:${boundaryName}] Caught error:`, error);
    console.error(`[ErrorBoundary:${boundaryName}] Component stack:`, errorInfo.componentStack);
    
    // Call optional error callback (for analytics, error reporting, etc.)
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Allow user to retry by resetting error state.
   * This re-renders children, which may succeed if the error was transient.
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI - styled to match app design
      const isCritical = this.props.level === 'critical';
      
      return (
        <div 
          className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl ${
            isCritical 
              ? 'bg-red-50 border border-red-200 min-h-[200px]' 
              : 'bg-gray-50 border border-gray-200 min-h-[100px]'
          }`}
          role="alert"
        >
          <AlertTriangle className={`w-8 h-8 mb-3 ${isCritical ? 'text-red-400' : 'text-warmGray'}`} />
          <p className={`text-sm font-medium mb-2 ${isCritical ? 'text-red-700' : 'text-charcoal'}`}>
            {isCritical ? 'Something went wrong' : 'Unable to display this content'}
          </p>
          <p className="text-xs text-warmGray mb-4">
            {isCritical 
              ? 'We encountered an unexpected error. Please try again.'
              : 'This item couldn\'t be loaded.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-warmGray hover:text-charcoal bg-white rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight wrapper for list items.
 * Shows minimal fallback to avoid disrupting grid layout.
 */
export function ItemErrorBoundary({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ErrorBoundary 
      name={name} 
      level="section"
      fallback={
        <div className="bg-gray-50 rounded-2xl border border-gray-200 aspect-[3/4] flex items-center justify-center">
          <p className="text-xs text-warmGray text-center px-4">
            Unable to display
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
