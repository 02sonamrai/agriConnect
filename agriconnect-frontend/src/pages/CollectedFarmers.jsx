import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { middlemanService } from '../services/api';
import FarmerDetailModal from '../components/FarmerDetailModal';
import MiddlemanAddCropModal from '../components/MiddlemanAddCropModal';
import MiddlemanViewCropsModal from '../components/MiddlemanViewCropsModal';
import { Users, UserPlus, Search, Eye, Edit, Trash2, ShieldAlert, Loader2, RefreshCw, Sprout, ListFilter } from 'lucide-react';

const CollectedFarmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected farmer for detail modal
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Modals state for coordinator assisted flow
  const [addCropTargetFarmer, setAddCropTargetFarmer] = useState(null);
  const [viewCropsTargetFarmer, setViewCropsTargetFarmer] = useState(null);

  // Selected farmer ID for delete confirmation modal
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await middlemanService.getCollectedFarmers();
      setFarmers(data);
      setFilteredFarmers(data);
    } catch (err) {
      console.error(err);
      setError('Could not load collected farmers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFarmers(farmers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = farmers.filter(
        (f) =>
          (f.farmerName && f.farmerName.toLowerCase().includes(term)) ||
          (f.village && f.village.toLowerCase().includes(term)) ||
          (f.primaryCrop && f.primaryCrop.toLowerCase().includes(term)) ||
          (f.phoneNumber && f.phoneNumber.includes(term))
      );
      setFilteredFarmers(filtered);
    }
  }, [searchTerm, farmers]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await middlemanService.deleteFarmer(deleteTargetId);
      setFarmers(farmers.filter((f) => f.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete farmer record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 selection:bg-emerald-500 selection:text-slate-900">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="h-7 w-7 text-emerald-400" />
            <span>Collected Farmers Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying field records collected by your coordinator profile. Add & manage crop listings for farmers.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchFarmers}
            title="Refresh List"
            className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/middleman/farmers/add"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-emerald-950/50 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Farmer</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by farmer name, village, primary crop, or phone..."
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-100 placeholder-slate-600 transition text-sm"
          />
        </div>
      </div>

      {/* Farmers Data Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="bg-emerald-500/10 p-4 rounded-full w-fit mx-auto border border-emerald-500/20 text-emerald-400">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Collected Farmers Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {searchTerm
              ? 'No farmer records match your search filter criteria.'
              : 'You have not registered any farmer records yet. Click "Add New Farmer" to collect real-world field data.'}
          </p>
          {!searchTerm && (
            <Link
              to="/middleman/farmers/add"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm mt-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Collect First Farmer</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Farmer Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Village</th>
                  <th className="px-6 py-4">Primary Crop</th>
                  <th className="px-6 py-4">Land Area</th>
                  <th className="px-6 py-4">Production</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFarmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {farmer.farmerName}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {farmer.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                        {farmer.village}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold whitespace-nowrap">
                      {farmer.primaryCrop}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {farmer.landArea !== null && farmer.landArea !== undefined
                        ? `${farmer.landArea} ${farmer.landAreaUnit || 'Acres'}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {farmer.approximateProduction !== null && farmer.approximateProduction !== undefined
                        ? `${farmer.approximateProduction} ${farmer.productionUnit || 'Quintal'}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedFarmer(farmer)}
                          title="View Details"
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Add Crop */}
                        <button
                          onClick={() => setAddCropTargetFarmer(farmer)}
                          title="Add Crop Listing"
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-md"
                        >
                          <Sprout className="h-4 w-4" />
                        </button>

                        {/* View Crops */}
                        <button
                          onClick={() => setViewCropsTargetFarmer(farmer)}
                          title="View Crops Listed"
                          className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl transition"
                        >
                          <ListFilter className="h-4 w-4" />
                        </button>

                        {/* Edit Record */}
                        <Link
                          to={`/middleman/farmers/edit/${farmer.id}`}
                          title="Edit Record"
                          className="p-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl transition"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* Delete Record */}
                        <button
                          onClick={() => setDeleteTargetId(farmer.id)}
                          title="Delete Record"
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {selectedFarmer && (
        <FarmerDetailModal
          farmer={selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
        />
      )}

      {/* Add Crop Modal */}
      {addCropTargetFarmer && (
        <MiddlemanAddCropModal
          farmer={addCropTargetFarmer}
          onClose={() => setAddCropTargetFarmer(null)}
          onCropAdded={() => {
            setAddCropTargetFarmer(null);
            fetchFarmers();
          }}
        />
      )}

      {/* View Crops Modal */}
      {viewCropsTargetFarmer && (
        <MiddlemanViewCropsModal
          farmer={viewCropsTargetFarmer}
          onClose={() => setViewCropsTargetFarmer(null)}
          onAddCropClick={(f) => setAddCropTargetFarmer(f)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="bg-rose-500/10 p-3 rounded-full w-fit mx-auto border border-rose-500/20 text-rose-400">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Delete Farmer Record</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to delete this field record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition text-sm flex items-center space-x-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Record</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectedFarmers;
