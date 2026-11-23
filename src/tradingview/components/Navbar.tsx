import { Globe, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { AppView } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSearch: () => void;
  onOpenSupercharts: () => void;
  darkSurface: boolean;
}

export function TradingViewLogo({ lightText }: { lightText: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold text-lg tracking-tight whitespace-nowrap shrink-0 ${lightText ? 'text-white' : 'text-slate-950'}`}>
      <svg width="28" height="18" viewBox="0 0 36 22" fill="none" aria-hidden="true">
        <path d="M1 3h13v16H8.5V8.5H1V3Z" fill="currentColor" />
        <circle cx="19.5" cy="6.2" r="3.2" fill="currentColor" />
        <path d="M23.5 19L30.5 3H35L28 19H23.5Z" fill="currentColor" />
      </svg>
      <span>TradingView</span>
    </span>
  );
}

const LOCALES = ['IN · EN', 'IN · हिं', 'IN · த'] as const;

export function Navbar({
  activeView,
  onNavigate,
  onOpenSearch,
  onOpenSupercharts,
  darkSurface,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localeIdx, setLocaleIdx] = useState(0);

  const navLinks: Array<{ id: AppView; label: string }> = [
    { id: 'chart', label: 'Supercharts' },
    { id: 'markets', label: 'Markets' },
    { id: 'news', label: 'News' },
    { id: 'community', label: 'Community' },
    { id: 'brokers', label: 'Brokers' },
    { id: 'apps', label: 'Apps' },
  ];

  const handleNav = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 h-14 transition-colors duration-200 ${
        darkSurface
          ? 'bg-black/90 backdrop-blur-md text-white border-b border-white/10'
          : 'bg-white/95 backdrop-blur-md text-slate-950 border-b border-slate-200'
      }`}
    >
      <div className="max-w-[1440px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark + Search */}
        <div className="flex items-center gap-3.5 shrink-0">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNav('home');
            }}
            aria-label="TradingView main page"
            className="focus-visible:outline-2 focus-visible:outline-blue-500 rounded"
          >
            <TradingViewLogo lightText={darkSurface} />
          </a>

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search markets (Ctrl+K)"
            className={`hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500 ${
              darkSurface
                ? 'bg-white/12 text-white/75 hover:bg-white/20 hover:text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Search (Ctrl+K)</span>
          </button>
        </div>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  darkSurface
                    ? isActive
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-white/80 hover:text-white'
                    : isActive
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Region IN + In-App PWA Install + Primary Angled CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Open symbol search"
            className={`md:hidden p-2 rounded-md ${
              darkSurface ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setLocaleIdx((i) => (i + 1) % LOCALES.length)}
            aria-label="Switch India display language"
            className={`hidden xl:inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap px-2 py-1 rounded-md transition-colors ${
              darkSurface ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{LOCALES[localeIdx]}</span>
          </button>

          <div className="hidden sm:block">
            <PWAInstallButton
              darkSurface={darkSurface}
              onOpenAppsHub={() => handleNav('apps')}
              compact
            />
          </div>

          <button
            type="button"
            onClick={() => handleNav('pricing')}
            className={`tv-cta-btn px-4 sm:px-5 py-2 text-xs font-semibold rounded-l-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500 ${
              darkSurface
                ? 'bg-white text-slate-950 hover:bg-slate-200'
                : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            Get started
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`lg:hidden p-2 rounded-md ${
              darkSurface ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div
          className={`lg:hidden border-b px-4 py-3 space-y-1 ${
            darkSurface ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md hover:bg-blue-600/10"
          >
            Home (India)
          </button>
          {navLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md hover:bg-blue-600/10"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenSupercharts}
            className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-blue-500 rounded-md hover:bg-blue-600/10"
          >
            Launch Supercharts Terminal
          </button>
        </div>
      )}
    </header>
  );
}
