import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BarChart3, RefreshCw, Users, Sprout } from 'lucide-react';
import { adminService } from '../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState({ stats: null, users: [], crops: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [stats, users, crops] = await Promise.all([
        adminService.getDashboard(), adminService.getUsers(), adminService.getCrops(),
      ]);
      setData({ stats, users, crops });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the administration overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const cards = data.stats ? [
    ['Users', data.stats.totalUsers, Users],
    ['Farmers', data.stats.farmers, Sprout],
    ['Buyers', data.stats.buyers, Users],
    ['Field coordinators', data.stats.coordinators, Users],
    ['Crop listings', data.stats.totalCrops, BarChart3],
    ['Available listings', data.stats.availableCrops, Sprout],
  ] : [];

  const ROW_HOVER = 'transition hover:bg-slate-800/40';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">Administration</p>
          <h1 className="mt-2 text-3xl font-black text-white">Project overview</h1>
          <p className="mt-2 text-sm text-slate-400">Read-only account and crop listing summary.</p>
        </div>
        <button onClick={loadDashboard} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"><AlertCircle className="h-5 w-5" />{error}</div>}
      {loading && <p className="text-sm text-slate-400">Loading overview…</p>}

      {!loading && !error && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between text-slate-400"><span className="text-sm">{label}</span><Icon className="h-5 w-5 text-lime-400" /></div>
            <p className="mt-3 text-3xl font-black text-white">{value}</p>
          </article>)}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">Accounts</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Status</th><th className="pb-3 text-right">Details</th></tr></thead>
            <tbody>{data.users.map(user => <tr key={user.id} className={`border-t border-slate-800 text-slate-300 ${ROW_HOVER}`}><td className="py-3"><Link to={`/admin/users/${user.id}`} className="font-semibold text-slate-100 transition hover:text-lime-400">{user.firstName} {user.lastName}</Link></td><td className="py-3">{user.email}</td><td className="py-3">{user.role?.replace(/^ROLE_/, '')}</td><td className="py-3">{user.isActive ? 'Active' : 'Inactive'}</td><td className="py-3 text-right"><Link to={`/admin/users/${user.id}`} className="font-semibold text-lime-400 transition hover:text-lime-300">View</Link></td></tr>)}</tbody>
          </table>{data.users.length === 0 && <p className="text-sm text-slate-500">No accounts found.</p>}</div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">Crop listings</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Crop</th><th className="pb-3">Farmer</th><th className="pb-3">Location</th><th className="pb-3">Quantity</th><th className="pb-3">Price / unit</th><th className="pb-3">Availability</th><th className="pb-3 text-right">Details</th></tr></thead>
            <tbody>{data.crops.map(crop => <tr key={crop.id} className={`border-t border-slate-800 text-slate-300 ${ROW_HOVER}`}><td className="py-3"><Link to={`/admin/crops/${crop.id}`} className="font-semibold text-slate-100 transition hover:text-lime-400">{crop.cropName}</Link></td><td className="py-3">{crop.farmerName}</td><td className="py-3">{crop.location}</td><td className="py-3">{crop.quantity} {crop.unit}</td><td className="py-3">₹{crop.pricePerUnit}</td><td className="py-3">{crop.available ? 'Available' : 'Unavailable'}</td><td className="py-3 text-right"><Link to={`/admin/crops/${crop.id}`} className="font-semibold text-lime-400 transition hover:text-lime-300">View</Link></td></tr>)}</tbody>
          </table>{data.crops.length === 0 && <p className="text-sm text-slate-500">No listings found.</p>}</div>
        </section>
      </>}
    </div>
  );
};

export default AdminDashboard;
