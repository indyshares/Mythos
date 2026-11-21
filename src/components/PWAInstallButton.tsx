import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'dropdown-item';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
  onInstalled,
}) => {
  const { canInstall, hasNativePrompt, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    if (variant === 'dropdown-item') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400">
          <CheckCircle2 size={14} />
          <span>Installed as App</span>
        </div>
      );
    }
    return null;
  }

  // If browser doesn't support install prompt and not iOS, don't show or show info
  if (!canInstall) {
    return null;
  }

  const handleClick = async () => {
    if (hasNativePrompt) {
      const accepted = await promptInstall();
      if (accepted) {
        setJustInstalled(true);
        onInstalled?.();
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleClick}
          title="Install Mythos App (PWA)"
          aria-label="Install Mythos App"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors shadow-xs ${className}`}
        >
          <Download size={13} className="animate-pulse" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      ) : variant === 'dropdown-item' ? (
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-sky-400 hover:bg-neutral-800 transition-colors text-left ${className}`}
        >
          <Download size={14} />
          <span>Install Mythos (PWA)</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-sky-500 text-neutral-950 hover:bg-sky-400 active:scale-[0.98] transition-all shadow-md ${className}`}
        >
          <Download size={16} />
          <span>Install Mythos App</span>
        </button>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700/80 p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/pwa-192x192.png" alt="Mythos" className="w-9 h-9 rounded-xl shadow" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Install Mythos on iOS</h3>
                  <p className="text-xs text-neutral-400">Add to Home Screen for the full experience</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-1 text-xs text-neutral-300">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
                <div className="p-2 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
                  <Share size={18} />
                </div>
                <div>
                  <div className="font-medium text-neutral-200">1. Tap the Share button</div>
                  <div className="text-neutral-400 text-[11px]">Located at the bottom of Safari browser</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700/50">
                <div className="p-2 rounded-md bg-sky-500/10 text-sky-400 shrink-0">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <div className="font-medium text-neutral-200">2. Tap 'Add to Home Screen'</div>
                  <div className="text-neutral-400 text-[11px]">Scroll down the share sheet to find this option</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
