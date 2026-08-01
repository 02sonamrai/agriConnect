import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { cropService } from '../services/api';
import { Plus, Eye, Leaf, Tag, ShieldAlert, Loader2 } from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalCrops: 0, availableCrops: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cropsList = await cropService.getMyCrops();
        const available = cropsList.filter((crop) => crop.available).length;
        setStats({
          totalCrops: cropsList.length,
          availableCrops: available,
        });
      } catch (err) {
        console.error(err);
        setError('Could not load statistics dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 selection:bg-lime-500 selection:text-slate-900">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-lime-900/40 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">{user?.firstName}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your crop listings, view stock statuses, and list crops directly to buyers.
          </p>
        </div>
        <Link
          to="/farmer/crops/add"
          className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-3 px-5 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-lime-900/30 text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>Add Crop Listing</span>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <Leaf className="h-32 w-32" />
            </div>
            <div className="bg-lime-500/10 p-3 rounded-xl w-fit text-lime-400 border border-lime-500/20 mb-4">
              <Leaf className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Crops Listed</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.totalCrops}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Crops currently registered on your catalog profile.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <Tag className="h-32 w-32" />
            </div>
            <div className="bg-lime-500/10 p-3 rounded-xl w-fit text-lime-400 border border-lime-500/20 mb-4">
              <Tag className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Available Crops</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.availableCrops}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Active listings visible to consumer markets.
            </p>
          </div>
        </div>
      )}

      {/* Quick Buttons Grid */}
      <div className="border-t border-slate-800/80 pt-8">
        <h2 className="text-lg font-bold text-white tracking-tight mb-4">Quick Management Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/farmer/crops"
            className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-slate-850 p-2.5 rounded-xl text-slate-400 group-hover:text-white transition">
                <Eye className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">View My Crops</p>
                <p className="text-xs text-slate-500">Edit, update status or delete listings</p>
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-lime-400 transition font-bold text-sm">&rarr;</span>
          </Link>

          <Link
            to="/farmer/crops/add"
            className="flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-slate-850 p-2.5 rounded-xl text-slate-400 group-hover:text-white transition">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Add New Listing</p>
                <p className="text-xs text-slate-500">Post new crop harvest listings</p>
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-lime-400 transition font-bold text-sm">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
