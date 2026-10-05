import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { adminService, marketPriceService } from '../services/api';

const EMPTY_FORM = { cropName: '', pricePerUnit: '', unit: 'Quintal', marketName: '' };

/**
 * Admin-only management of the market price reference data.
 *
 * <p>
 * Backed entirely by POST/PUT/DELETE on /api/admin/market-prices, which SecurityConfig already
 * restricts to ROLE_ADMIN. Nothing here can touch a crop listing - the two price concepts stay
 * independent.
 */
const AdminMarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Read through the same marketplace endpoint the farmer and buyer views use, so the admin
  // table and the public price list can never disagree about what is stored.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPrices(await marketPriceService.getPrices());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load market prices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (price) => {
    setForm({
      cropName: price.cropName,
      pricePerUnit: String(price.pricePerUnit),
      unit: price.unit || 'Quintal',
      marketName: price.marketName,
    });
    setEditingId(price.id);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      cropName: form.cropName.trim(),
      pricePerUnit: form.pricePerUnit === '' ? '' : Number(form.pricePerUnit),
      unit: form.unit.trim(),
      marketName: form.marketName.trim(),
    };

    try {
      if (editingId) {
        await adminService.updateMarketPrice(editingId, payload);
        setSuccess('Market price updated.');
      } else {
        await adminService.createMarketPrice(payload);
        setSuccess('Market price added.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : err.response?.data?.message || 'Could not save the market price.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await adminService.deleteMarketPrice(id);
      setPrices((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
      setSuccess('Market price deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the market price.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
  };

  const inputClass =
    'w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400';
  const ROW_HOVER = 'transition hover:bg-slate-800/40';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Market Prices</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage the approximate mandi rates farmers and buyers can read. Rates are stored
            separately from every crop listing price.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 text-sm text-lime-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">
          {editingId ? 'Edit market price' : 'Add a market price'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="cropName" className={labelClass}>
              Crop
            </label>
            <input
              id="cropName"
              name="cropName"
              value={form.cropName}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="Wheat"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="pricePerUnit" className={labelClass}>
              Price
            </label>
            <input
              id="pricePerUnit"
              name="pricePerUnit"
              type="number"
              step="0.01"
              min="0.01"
              value={form.pricePerUnit}
              onChange={handleChange}
              required
              placeholder="2450.00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="unit" className={labelClass}>
              Unit
            </label>
            <input
              id="unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              maxLength={20}
              placeholder="Quintal"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="marketName" className={labelClass}>
              Market
            </label>
            <input
              id="marketName"
              name="marketName"
              value={form.marketName}
              onChange={handleChange}
              required
              maxLength={150}
              placeholder="Pune Market Yard"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-lime-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-lime-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add price'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                <X className="h-4 w-4" /> Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">Recorded rates</h2>

        {loading ? (
          <p className="text-sm text-slate-400">Loading market prices…</p>
        ) : prices.length === 0 ? (
          <p className="text-sm text-slate-500">
            No market prices recorded yet. Add the first one using the form above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3">Crop</th>
                  <th className="pb-3">Rate</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3">Market</th>
                  <th className="pb-3">Last updated</th>
                  <th className="pb-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr
                    key={price.id}
                    className={`border-t border-slate-800 text-slate-300 ${ROW_HOVER}`}
                  >
                    <td className="py-3 font-semibold text-slate-100">{price.cropName}</td>
                    <td className="py-3 font-bold text-lime-400">₹{price.pricePerUnit}</td>
                    <td className="py-3 text-slate-400">{price.unit}</td>
                    <td className="py-3">{price.marketName}</td>
                    <td className="py-3 text-slate-400">{formatDate(price.updatedAt)}</td>
                    <td className="py-3 text-right">
                      {deleteConfirmId === price.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(price.id)}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500"
                          >
                            Confirm delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          <button
                            onClick={() => startEdit(price)}
                            className="inline-flex items-center gap-1 font-semibold text-lime-400 transition hover:text-lime-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(price.id)}
                            className="inline-flex items-center gap-1 font-semibold text-rose-400 transition hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminMarketPrices;
