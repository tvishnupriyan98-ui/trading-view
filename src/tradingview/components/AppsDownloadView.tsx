import { CheckCircle2, Download, Laptop, Monitor, Smartphone, Terminal } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function AppsDownloadView() {
  const { isInstallable, isInstalled, os, install } = usePWAInstall();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';

  const handleInstallPWA = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) setStatusMsg('TradingView India installed as a standalone native app!');
      return;
    }
    setStatusMsg(
      'Open your browser address bar Install icon (Windows/Linux Chrome or Edge) or tap Chrome Menu → Install app (Android) to install immediately.',
    );
  };

  const triggerDownload = (endpoint: string, label: string) => {
    const url = `${endpoint}?origin=${encodeURIComponent(originUrl)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatusMsg(`${label} download started.`);
  };

  const osLabel =
    os === 'windows'
      ? 'Windows'
      : os === 'linux'
        ? 'Linux'
        : os === 'android'
          ? 'Android'
          : os === 'ios'
            ? 'iOS'
            : os === 'macos'
              ? 'macOS'
              : 'Desktop / Mobile';

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 lg:px-8">
      <div className="max-w-[1220px] mx-auto space-y-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400">
            <span>DETECTED PLATFORM: {osLabel.toUpperCase()}</span>
            <span>·</span>
            <span>OFFLINE SERVICE WORKER ACTIVE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            TradingView Desktop &amp; Android Apps
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Run TradingView India natively across <strong>Windows</strong>, <strong>Linux</strong>, and{' '}
            <strong>Android</strong> with standalone window mode, offline Workbox caching, persistent watchlists, and a ready-to-build Android TWA/Capacitor APK project kit.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isInstalled ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Installed &amp; Running in Standalone App Mode</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="tv-cta-btn px-7 py-3.5 bg-white text-slate-950 font-display font-bold text-sm rounded-l-xl hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{isInstallable ? `Install App on ${osLabel}` : 'Install Standalone PWA'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => triggerDownload('/api/download/android-apk-kit', 'Android APK Project Kit (.tar.gz)')}
              className="px-6 py-3.5 rounded-xl bg-[#2962FF] hover:bg-blue-600 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" aria-hidden="true" />
              <span>Download Android APK Kit (.tar.gz)</span>
            </button>
          </div>

          {statusMsg && (
            <div role="status" className="max-w-xl mx-auto p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-100">
              {statusMsg}
            </div>
          )}
        </div>

        {/* 3 Platform Cards: Windows, Linux, Android */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* WINDOWS */}
          <div className="rounded-2xl border border-white/15 bg-[#131722] p-6 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Monitor className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">Windows 10 / 11 Desktop</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Install directly via Chrome/Edge PWA or download the standalone launcher script that opens TradingView India in a borderless multi-monitor desktop window.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• Frameless standalone app window (Edge / Chrome)</li>
                <li>• Start Menu &amp; Taskbar pin support</li>
                <li>• Offline Supercharts &amp; local portfolio sync</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/api/download/windows-launcher', 'Windows Launcher (.cmd)')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-200 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download Windows Launcher (.cmd)</span>
            </button>
          </div>

          {/* LINUX */}
          <div className="rounded-2xl border border-white/15 bg-[#131722] p-6 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Terminal className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">Linux (Ubuntu, Debian, Arch, Fedora)</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                One-command shell installer creating a native <code className="font-mono text-emerald-300">~/.local/share/applications/tradingview-india.desktop</code> entry with Chromium/Chrome/Brave app mode.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• Native GNOME / KDE / Hyprland launcher icon</li>
                <li>• Works with Chromium, Google Chrome &amp; Brave</li>
                <li>• Zero Electron RAM bloat — instant startup</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/api/download/linux-installer', 'Linux Desktop Installer (.sh)')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-200 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download Linux Installer (.sh)</span>
            </button>
          </div>

          {/* ANDROID */}
          <div className="rounded-2xl border border-blue-500/40 bg-[#131722] p-6 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#2962FF]/25 text-blue-400 flex items-center justify-center">
                <Smartphone className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">Android (Instant PWA + APK Kit)</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Install immediately on Android Chrome with 1 tap (maskable adaptive icon + standalone full-screen UI), OR download the complete <strong>Android TWA / Capacitor APK Project Kit</strong> to compile a signed <code className="font-mono text-blue-300">.apk</code>.
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                <li>• Includes <code className="font-mono">twa-manifest.json</code> (Bubblewrap)</li>
                <li>• Includes <code className="font-mono">capacitor.config.json</code> &amp; <code className="font-mono">AndroidManifest.xml</code></li>
                <li>• Includes <code className="font-mono">build-apk.sh</code> + 192px/512px adaptive icons</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/api/download/android-apk-kit', 'Android APK Project Kit (.tar.gz)')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2962FF] text-white font-semibold text-xs hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download Android APK Kit (.tar.gz)</span>
            </button>
          </div>
        </div>

        {/* Technical Transparency & Quick Build Commands */}
        <div className="rounded-2xl border border-white/15 bg-[#0D1017] p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-white">
              Quick Commands: Linux Install &amp; Android Signed APK Compilation
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-black border border-white/10 space-y-2">
              <div className="text-emerald-400 font-semibold"># Linux Native Desktop App Install</div>
              <pre className="text-slate-300 overflow-x-auto leading-relaxed">{`chmod +x install-tradingview-linux.sh
./install-tradingview-linux.sh`}</pre>
            </div>
            <div className="p-4 rounded-xl bg-black border border-white/10 space-y-2">
              <div className="text-blue-400 font-semibold"># Android Signed .apk Build (Bubblewrap / Java 17)</div>
              <pre className="text-slate-300 overflow-x-auto leading-relaxed">{`tar -xzf tradingview-india-android-apk-kit.tar.gz
cd tradingview-india-android-apk-kit && ./build-apk.sh`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
