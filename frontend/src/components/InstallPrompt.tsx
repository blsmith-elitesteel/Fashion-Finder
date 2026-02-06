import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, Smartphone, ArrowDown } from 'lucide-react';
import { usePWA, useInstallDismissed } from '../hooks/usePWA';

export function InstallPrompt() {
  const { isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const { isDismissed, dismiss } = useInstallDismissed();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Don't show if already standalone, dismissed, or not applicable
  if (isStandalone || isDismissed) return null;
  if (!isIOS && !canInstall) return null;

  // Android/Chrome - use native prompt
  if (canInstall && !isIOS) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-white rounded-2xl shadow-hover border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-charcoal">
                Install Fashion Finder
              </h3>
              <p className="text-sm text-warmGray mt-0.5">
                Add to home screen for quick access
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-warmGray hover:text-charcoal p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={promptInstall}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              Install App
            </button>
            <button
              onClick={dismiss}
              className="btn-secondary py-2.5 text-sm"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // iOS - show instructions
  if (isIOS) {
    return (
      <>
        {/* Floating button to show instructions */}
        {!showIOSInstructions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowIOSInstructions(true)}
            className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow-hover border border-gray-100 p-3 flex items-center gap-2"
          >
            <PlusSquare className="w-5 h-5 text-rose" />
            <span className="text-sm font-medium text-charcoal pr-1">Add to Home</span>
          </motion.button>
        )}

        {/* iOS Instructions Modal */}
        <AnimatePresence>
          {showIOSInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4"
              onClick={() => setShowIOSInstructions(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-blush to-rose p-6 text-center relative">
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="absolute top-4 right-4 text-white/80 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👗</span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white">
                    Add to Home Screen
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    Get the full app experience
                  </p>
                </div>

                {/* Instructions */}
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Share className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        1. Tap the Share button
                      </p>
                      <p className="text-sm text-warmGray mt-0.5">
                        At the bottom of Safari (square with arrow pointing up)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-rose/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowDown className="w-5 h-5 text-rose" />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        2. Scroll down in the menu
                      </p>
                      <p className="text-sm text-warmGray mt-0.5">
                        Find "Add to Home Screen" option
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <PlusSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">
                        3. Tap "Add to Home Screen"
                      </p>
                      <p className="text-sm text-warmGray mt-0.5">
                        Then tap "Add" in the top right
                      </p>
                    </div>
                  </div>

                  <div className="bg-blush/30 rounded-xl p-4 text-center">
                    <p className="text-sm text-charcoal">
                      ✨ Fashion Finder will open in full-screen mode, just like a real app!
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowIOSInstructions(false);
                      dismiss();
                    }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Don't show again
                  </button>
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="btn-primary flex-1 py-3"
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
}
