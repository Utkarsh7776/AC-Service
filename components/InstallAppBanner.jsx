'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, X, PlusSquare } from 'lucide-react';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default true until checked
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone (PWA installed & opened from home screen)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Check if user dismissed the banner recently (last 24 hours)
    const lastDismissed = localStorage.getItem('nextgen_install_dismissed');
    if (lastDismissed) {
      const hoursAgo = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
      if (hoursAgo < 24) return;
    }

    setDismissed(false);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    setIsIOS(isAppleDevice && isSafari);

    // 4. Capture Chromium/Android install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIosGuide((prev) => !prev);
    } else {
      alert('To install this app on your phone: Tap browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('nextgen_install_dismissed', Date.now().toString());
  };

  if (isStandalone || dismissed) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 text-white shadow-md border-b border-sky-800/40 px-3.5 py-2.5 sm:px-6 transition-all duration-300">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Left: App icon & description */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-400 shadow-inner">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold tracking-tight text-white text-xs">Install NextGen Field App</span>
              <span className="bg-sky-500/30 text-sky-200 text-[10px] px-1.5 py-0.2 rounded font-medium">Mobile App</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              One-tap home screen access. No re-logging in or searching for links.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm text-xs transition active:scale-95 cursor-pointer"
          >
            {isIOS ? (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Add to Home Screen</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Dropdown */}
      {showIosGuide && (
        <div className="mt-2.5 pt-2.5 border-t border-sky-800/40 text-[11px] text-sky-100 flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg">
          <PlusSquare className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">To install on iPhone / iPad:</strong>
            <ol className="list-decimal list-inside space-y-0.5 mt-0.5 text-slate-300">
              <li>Tap the <span className="font-semibold text-white">Share</span> button at the bottom of Safari (<Share2 className="w-3 h-3 inline mx-0.5 text-sky-400" /> icon).</li>
              <li>Scroll down and tap <span className="font-semibold text-white">&apos;Add to Home Screen&apos;</span>.</li>
              <li>Tap <span className="font-semibold text-white">&apos;Add&apos;</span> in top right corner. The app will appear on your home screen!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

