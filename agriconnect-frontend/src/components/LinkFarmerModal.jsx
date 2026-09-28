import React, { useState, useEffect } from 'react';
import { X, Search, Link2, Unlink, UserCheck, ShieldAlert, Loader2, Check } from 'lucide-react';
import { middlemanService } from '../services/api';

const LinkFarmerModal = ({ farmer, onClose, onLinkedSuccess }) => {
  const [query, setQuery] = useState('');
  const [farmersList, setFarmersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState(null);
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const searchFarmers = async (searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const results = await middlemanService.searchFarmers(searchTerm);
      setFarmersList(results);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch farmer user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchFarmers('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchFarmers(query);
  };

  const handleLink = async (farmerUserId) => {
    setLinkingId(farmerUserId);
    setError('');
    setSuccessMsg('');
    try {
      const updatedFarmer = await middlemanService.linkFarmer(farmer.id, farmerUserId);
      setSuccessMsg(`Successfully linked ${farmer.farmerName} to ${updatedFarmer.linkedFarmerName}!`);
      setTimeout(() => {
        onLinkedSuccess(updatedFarmer);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to link farmer account.');
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    setError('');
    setSuccessMsg('');
    try {
      const updatedFarmer = await middlemanService.unlinkFarmer(farmer.id);
      setSuccessMsg(`Unlinked farmer account for ${farmer.farmerName}.`);
      setTimeout(() => {
        onLinkedSuccess(updatedFarmer);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to unlink farmer account.');
    } finally {
      setUnlinking(false);
    }
  };

  if (!farmer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm selection:bg-emerald-500 selection:text-slate-900">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Link Farmer Account</h2>
              <p className="text-xs text-slate-400">
                Connecting field record: <span className="text-emerald-400 font-bold">{farmer.farmerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Linked Status */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Link Status</p>
          {farmer.linkedFarmerId ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">{farmer.linkedFarmerName}</p>
                  <p className="text-xs text-slate-400">{farmer.linkedFarmerEmail} • {farmer.linkedFarmerPhone}</p>
                </div>
              </div>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
              >
                {unlinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                <span>Unlink Account</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-400 flex items-center justify-between">
              <span>Status: <strong className="text-amber-400">Not Linked</strong></span>
              <span className="text-slate-500">Search registered FARMER users below to link</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm shrink-0">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center space-x-3 text-emerald-400 text-sm shrink-0">
            <Check className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 shrink-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by farmer name, email, or phone..."
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-100 placeholder-slate-600 transition text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-sm"
          >
            Search
          </button>
        </form>

        {/* Farmers Account List */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          ) : farmersList.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">
              No active FARMER user accounts found matching query.
            </p>
          ) : (
            farmersList.map((fUser) => {
              const isCurrentlyLinked = farmer.linkedFarmerId === fUser.id;
              return (
                <div
                  key={fUser.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                    isCurrentlyLinked
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {fUser.firstName} {fUser.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{fUser.email} • {fUser.phoneNumber}</p>
                  </div>
                  {isCurrentlyLinked ? (
                    <span className="text-xs text-emerald-400 font-bold px-3 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      Linked
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLink(fUser.id)}
                      disabled={linkingId === fUser.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      {linkingId === fUser.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span>Link Account</span>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end shrink-0 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkFarmerModal;
