import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Search, TrendingUp, Scale } from 'lucide-react';
import { marketPriceService } from '../services/api';

/**
 * "Today's Market Prices" - approximate mandi rates maintained by an administrator.
 *
 * <p>
 * These are reference rates for a crop in general, not the price any one seller is asking for.
 * A seller's own listing price lives on the crop listing and is deliberately never touched by
 * anything on this screen.
 */
const MarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPrices = useCallback(async (term) => {
    setLoading(true);
    setError('');
    try {
      setPrices(await marketPriceService.getPrices(term));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load market prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices('');
  }, [loadPrices]);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadPrices(search.trim());
  };

  const clearSearch = () => {
    setSearch('');
    loadPrices('');
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
  };

  const ROW_HOVER = 'transition hover:bg-slate-800/40';

  return (
    <div className="space-y-8 selection:bg-lime-500 selection:text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
            Reference rates
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Market Prices</h1>
          <p className="mt-2 text-sm text-slate-400">
            Approximate mandi rates, maintained manually by an administrator. These are market
            reference figures and are not the price of any individual crop listing.
          </p>
        </div>
        <button
          onClick={() => loadPrices(search.trim())}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by crop or market, e.g. Wheat or Pune"
            aria-label="Filter market prices"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-lime-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-lime-500"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading market prices…</p>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Scale className="h-5 w-5 text-lime-400" />
            {prices.length} {prices.length === 1 ? 'price' : 'prices'}
          </h2>

          {prices.length === 0 ? (
            <p className="text-sm text-slate-500">
              No market prices recorded yet. An administrator can add them from the admin panel.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3">Crop</th>
                    <th className="pb-3">Market rate</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Market</th>
                    <th className="pb-3">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((price) => (
                    <tr
                      key={price.id}
                      className={`border-t border-slate-800 text-slate-300 ${ROW_HOVER}`}
                    >
                      <td className="py-3 font-semibold text-slate-100">{price.cropName}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 font-bold text-lime-400">
                          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />₹
                          {Number(price.pricePerUnit).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">per {price.unit}</td>
                      <td className="py-3">{price.marketName}</td>
                      <td className="py-3 text-slate-400">{formatDate(price.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MarketPrices;