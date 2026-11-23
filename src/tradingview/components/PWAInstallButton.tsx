import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useState } from 'react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  darkSurface?: boolean;
  onOpenAppsHub?: () => void;
  compact?: boolean;
}

export function PWAInstallButton({ darkSurface = true, onOpenAppsHub, compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    if (isIOS) {
      setShowGuide(true);
      return;
    }
    if (onOpenAppsHub) {
      onOpenAppsHub();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Install TradingView India app"
        className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        } ${
          isInstallable
            ? 'bg-[#2962FF] text-white hover:bg-blue-600'
            : darkSurface
              ? 'bg-white/12 text-white hover:bg-white/20'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        }`}
      >
        {isIOS ? (
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        )}
        <span>{isInstallable ? 'Install App' : isIOS ? 'Install iOS' : 'Get App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Install TradingView App Guide"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white text-slate-950 border border-slate-200 p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                {isIOS ? 'Install on iPhone / iPad' : 'Install on Windows, Linux & Android'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
                <li>Tap the <strong>Share</strong> icon in Safari&apos;s bottom toolbar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> to launch TradingView India full-screen.</li>
              </ol>
            ) : (
              <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
                <li><strong>Android Chrome</strong>: Tap menu (⋮) → <strong>Install app</strong> for a full-screen standalone app.</li>
                <li><strong>Windows / Linux Chrome or Edge</strong>: Click the install icon in the address bar or download the desktop launcher from the Apps hub.</li>
              </ol>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Offline Mode — Cached charts &amp; paper portfolio active</span>
    </div>
  );
}
