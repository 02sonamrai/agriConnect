import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { middlemanService } from '../services/api';
import { Users, Calendar, MapPin, Sprout, UserPlus, ListOrdered, ShieldAlert, Loader2 } from 'lucide-react';

const MiddlemanDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalFarmersCollected: 0,
    farmersAddedToday: 0,
    villagesCovered: 0,
    mainCropsRecorded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await middlemanService.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('Could not load field coordinator statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 selection:bg-emerald-500 selection:text-slate-900">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <span>Community Field Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome, Coordinator <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{user?.firstName}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Gather and manage verified real-world farmer field information across rural communities.
          </p>
        </div>
        <Link
          to="/middleman/farmers/add"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-5 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-emerald-950/50 text-sm"
        >
          <UserPlus className="h-5 w-5" />
          <span>Collect New Farmer</span>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-9 w-9 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Farmers Collected */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <Users className="h-28 w-28" />
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl w-fit text-emerald-400 border border-emerald-500/20 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Farmers Collected</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.totalFarmersCollected}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Verified community records collected in field trips.
            </p>
          </div>

          {/* Card 2: Farmers Added Today */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <Calendar className="h-28 w-28" />
            </div>
            <div className="bg-teal-500/10 p-3 rounded-xl w-fit text-teal-400 border border-teal-500/20 mb-4">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Farmers Added Today</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.farmersAddedToday}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Recent farmer registrations collected today.
            </p>
          </div>

          {/* Card 3: Villages Covered */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <MapPin className="h-28 w-28" />
            </div>
            <div className="bg-cyan-500/10 p-3 rounded-xl w-fit text-cyan-400 border border-cyan-500/20 mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Villages Covered</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.villagesCovered}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Unique village sectors surveyed and mapped.
            </p>
          </div>

          {/* Card 4: Main Crops Recorded */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-slate-800/10 group-hover:scale-110 transition duration-300 pointer-events-none">
              <Sprout className="h-28 w-28" />
            </div>
            <div className="bg-lime-500/10 p-3 rounded-xl w-fit text-lime-400 border border-lime-500/20 mb-4">
              <Sprout className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Crops Recorded</p>
            <p className="text-4xl font-black text-white tracking-tight mt-1">{stats.mainCropsRecorded}</p>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Distinct agricultural crops cataloged.
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Buttons */}
      <div className="border-t border-slate-800/80 pt-8">
        <h2 className="text-lg font-bold text-white tracking-tight mb-4">Field Operations Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/middleman/farmers/add"
            className="flex items-center justify-between p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl transition group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Add New Farmer Record</p>
                <p className="text-xs text-slate-500">Collect & save real-world farmer field data</p>
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-emerald-400 transition font-bold text-base">&rarr;</span>
          </Link>

          <Link
            to="/middleman/farmers"
            className="flex items-center justify-between p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl transition group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-teal-500/10 p-3 rounded-xl text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition">
                <ListOrdered className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">View Collected Farmers</p>
                <p className="text-xs text-slate-500">Search, edit, or manage submitted farmer profiles</p>
              </div>
            </div>
            <span className="text-slate-500 group-hover:text-teal-400 transition font-bold text-base">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MiddlemanDashboard;
