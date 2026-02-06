import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canInstall: boolean;
  isPWASupported: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook to detect PWA state and provide install functionality
 */
export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isStandalone: false,
    isIOS: false,
    isAndroid: false,
    canInstall: false,
    isPWASupported: false
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Detect standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    
    // Check PWA support
    const isPWASupported = 'serviceWorker' in navigator;
    
    setState(prev => ({
      ...prev,
      isStandalone,
      isIOS,
      isAndroid,
      isPWASupported
    }));

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(prev => ({ ...prev, canInstall: false, isStandalone: true }));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isStandalone: e.matches }));
    };
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Trigger Android/Chrome install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setState(prev => ({ ...prev, canInstall: false }));
      return true;
    }
    
    return false;
  }, [deferredPrompt]);

  return {
    ...state,
    promptInstall
  };
}

/**
 * Check if user has dismissed the install prompt before
 */
export function useInstallDismissed() {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('pwa-install-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem('pwa-install-dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const reset = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem('pwa-install-dismissed');
    } catch {
      // Ignore storage errors
    }
  }, []);

  return { isDismissed, dismiss, reset };
}
