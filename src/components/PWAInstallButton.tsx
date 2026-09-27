import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 border border-white/25"
        title="Install DairyFlow App on Device"
      >
        <Download size={14} className="text-white drop-shadow-sm" />
        <span className="tracking-tight">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 border border-white/25"
        >
          <Share size={14} className="text-white drop-shadow-sm" />
          <span className="tracking-tight">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/60 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-white/95 backdrop-blur-2xl p-6 shadow-2xl border border-brand-900/10 text-brand-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-brand-900">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-brand-900/60 hover:bg-cream-100"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-brand-900/75 leading-relaxed mb-4">
                Enjoy offline access and fast launches directly from your home screen:
              </p>
              <div className="space-y-2 bg-cream-50 p-4 rounded-xl text-xs font-medium text-brand-900/80 mb-4">
                <p>1. Tap the <strong className="text-brand-900">Share</strong> icon in the Safari toolbar.</p>
                <p>2. Scroll down and tap <strong className="text-brand-900">Add to Home Screen</strong>.</p>
                <p>3. Tap <strong className="text-brand-900">Add</strong> in the top right corner.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow hover:bg-brand-700 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
