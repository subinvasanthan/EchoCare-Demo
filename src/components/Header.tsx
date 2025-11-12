import React, { useEffect, useState } from 'react';
import { Heart, Moon, Sun } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  user?: any; // <-- added
}

export default function Header({ darkMode, toggleDarkMode, user }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header
      className={`sticky top-0 z-50 py-4 px-4 sm:px-6 lg:px-8 transition-all duration-200 ${
        scrolled
          ? 'backdrop-blur supports-[backdrop-filter]:bg-slate-900/90 dark:supports-[backdrop-filter]:bg-gray-950/85 border-b border-slate-700/60 dark:border-gray-800/70 shadow-sm'
          : 'supports-[backdrop-filter]:backdrop-blur bg-gradient-to-b from-teal-900/90 via-sky-900/80 to-indigo-900/70'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Heart 
              className="w-10 h-10 text-teal-400 fill-current drop-shadow" 
              aria-label="EchoCare heart logo"
            />
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-2xl font-bold text-white font-nunito drop-shadow-sm">
            EchoCare
          </span>
        </div>

        {/* Right: Auth or Profile + Dark mode */}
        <div className="flex items-center space-x-3">
          {!user ? (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={() => go('/signin')}
                  className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-900 min-h-[44px] flex items-center"
                >
                  Sign In
                </button>
              </div>
              {/* Mobile */}
              <div className="sm:hidden flex items-center space-x-2">
                <button
                  onClick={() => go('/signin')}
                  className="px-3 py-2 text-xs font-semibold text-gray-900 bg-white hover:bg-gray-100 rounded-lg shadow-sm"
                >
                  Sign In
                </button>
              </div>
            </>
          ) : (
            // Show compact profile menu on the right when logged in
            <ProfileMenu
              user={user}
              onNavigateToDashboard={() => {
                go('/dashboard');
              }}
            />
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
