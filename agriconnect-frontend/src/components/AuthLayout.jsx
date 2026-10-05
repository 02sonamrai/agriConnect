import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/**
 * Shared shell for the login and register screens: animated backdrop, the
 * AgriConnect wordmark, and the theme toggle. Keeping it in one place means the
 * two pages stay visually identical apart from their form content.
 */
const AuthLayout = ({ title, subtitle, children, width = 'max-w-md' }) => (
  <div className="auth-canvas flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
    {/* ---- Ambient background ------------------------------------------ */}
    <div className="auth-grid" aria-hidden="true" />

    <div
      className="auth-orb h-[26rem] w-[26rem] -left-24 -top-24 animate-float-slow bg-lime-400/25 dark:bg-lime-600/15"
      aria-hidden="true"
    />
    <div
      className="auth-orb h-[22rem] w-[22rem] -right-20 top-1/3 animate-drift bg-emerald-400/20 dark:bg-emerald-600/12"
      aria-hidden="true"
    />
    <div
      className="auth-orb h-[18rem] w-[18rem] bottom-0 left-1/4 animate-float-slow bg-amber-300/20 dark:bg-amber-500/10"
      style={{ animationDelay: '-6s' }}
      aria-hidden="true"
    />

    <div className="relative mx-auto w-full">
      {/* ---- Header ---------------------------------------------------- */}
      <div className="animate-fade-down text-center">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="relative inline-flex">
            {/* Expanding halo behind the logo mark. */}
            <span
              className="absolute inset-0 animate-pulse-ring rounded-2xl bg-lime-500/30"
              aria-hidden="true"
            />
            <span
              className="relative inline-flex rounded-2xl border border-lime-500/30 bg-lime-500/10 p-3 text-lime-600 shadow-lg shadow-lime-500/10
                transition-all duration-500 ease-out hover:scale-110 hover:rotate-3 hover:border-lime-500/60 hover:shadow-xl hover:shadow-lime-500/25
                dark:border-lime-500/25 dark:bg-lime-500/10 dark:text-lime-400"
            >
              <Leaf className="h-7 w-7" />
            </span>
          </span>

          <Link
            to="/"
            className="text-left transition-transform duration-300 hover:translate-x-0.5"
          >
            <span className="block text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              Agri<span className="text-lime-600 dark:text-lime-400">Connect</span>
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Farmer Marketplace
            </span>
          </Link>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>

      {/* ---- Card ------------------------------------------------------ */}
      <div className={`auth-card mt-8 animate-scale-in ${width}`}>
        {children}
      </div>
    </div>

    {/* ---- Theme toggle (fixed to the corner on small screens) ---------- */}
    <div className="fixed right-4 top-4 z-20 sm:right-6 sm:top-6">
      <ThemeToggle />
    </div>
  </div>
);

export default AuthLayout;
