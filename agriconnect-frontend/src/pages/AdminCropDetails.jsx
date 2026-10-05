import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import {
  ArrowLeft,
  AlertCircle,
  Sprout,
  MapPin,
  Boxes,
  IndianRupee,
  Tag,
  User,
  CalendarDays,
  ImageOff,
} from 'lucide-react';

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : 'Not recorded';

/**
 * Read-only detail view for a single crop listing. Sourced from the existing
 * admin crops endpoint to avoid adding a new backend route.
 */
const AdminCropDetails = () => {
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const crops = await adminService.getCrops();
        if (cancelled) return;
        const match = crops.find((candidate) => String(candidate.id) === String(id));
        if (!match) {
          setError('That crop listing could not be found.');
        } else {
          setCrop(match);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Could not load this crop listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const ownerLabel = crop?.isCollectedFarmer ? 'Collected farmer record' : 'Registered farmer';

  const details = crop
    ? [
        { label: 'Category', value: crop.category || 'Not recorded', icon: Tag },
        { label: 'Location', value: crop.location || 'Not recorded', icon: MapPin },
        {
          label: 'Quantity',
          value: `${crop.quantity} ${crop.unit || ''}`.trim(),
          icon: Boxes,
        },
        { label: 'Price per unit', value: `₹${crop.pricePerUnit}`, icon: IndianRupee },
        { label: ownerLabel, value: crop.farmerName || 'Unknown', icon: User },
        { label: 'Availability', value: crop.available ? 'Available' : 'Unavailable', icon: Sprout },
        { label: 'Listed', value: formatDate(crop.createdAt), icon: CalendarDays },
        { label: 'Last updated', value: formatDate(crop.updatedAt), icon: CalendarDays },
      ]
    : [];

  return (
    <div className="space-y-8">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-lime-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to overview
      </Link>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading listing…</p>}

      {!loading && crop && (
        <>
          <header>
            <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">Administration</p>
            <h1 className="mt-2 text-3xl font-black text-white">{crop.cropName}</h1>
            <p className="mt-2 text-sm text-slate-400">Listing record #{crop.id}</p>
          </header>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              {crop.imageUrl ? (
                <img
                  src={crop.imageUrl}
                  alt={crop.cropName}
                  className="h-56 w-full rounded-2xl border border-slate-800 object-cover"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {details.map(({ label, value, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icon className="h-4 w-4 text-lime-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="mt-3 break-words text-sm font-bold text-white">{value}</p>
                </article>
              ))}
            </div>
          </section>

          {crop.description && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-3 text-lg font-bold text-white">Description</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {crop.description}
              </p>
            </section>
          )}

          <p className="text-xs text-slate-500">Read-only view. Listings are managed by their owner.</p>
        </>
      )}
    </div>
  );
};

export default AdminCropDetails;
