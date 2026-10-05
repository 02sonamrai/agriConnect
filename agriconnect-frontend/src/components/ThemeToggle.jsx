import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`group relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl
        border border-slate-200 bg-white/80 text-slate-600 shadow-sm
        transition-all duration-300 ease-out hover:scale-105 hover:border-lime-400 hover:text-lime-600
        hover:shadow-lg hover:shadow-lime-500/20 focus:outline-none focus-visible:ring-2
        focus-visible:ring-lime-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50
        active:scale-95
        dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300
        dark:hover:border-lime-500 dark:hover:text-lime-400
        dark:focus-visible:ring-offset-slate-950 ${className}`}
    >
      {/* Sliding highlight that tracks the active mode. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -z-0 bg-gradient-to-br from-amber-300/25 to-orange-400/25
          transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isDark ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-0 -z-0 bg-gradient-to-br from-lime-400/25 to-emerald-500/25
          transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isDark ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      />

      <Sun
        aria-hidden="true"
        className={`relative h-5 w-5 transition-all duration-500 ease-out
          ${isDark
            ? 'translate-y-0 rotate-0 scale-100 opacity-100'
            : '-translate-y-6 rotate-90 scale-50 opacity-0'}`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute h-5 w-5 transition-all duration-500 ease-out
          ${isDark
            ? 'translate-y-6 -rotate-90 scale-50 opacity-0'
            : 'translate-y-0 rotate-0 scale-100 opacity-100'}`}
      />
    </button>
  );
};

export default ThemeToggle;
