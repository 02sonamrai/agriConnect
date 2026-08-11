import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cropService } from '../services/api';
import { Eye, Edit, Trash2, MapPin, Tag, ShieldAlert, Loader2, Plus, Sparkles, CheckCircle2, XCircle, Leaf } from 'lucide-react';

const MyCrops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCrops = async () => {
    try {
      const data = await cropService.getMyCrops();
      setCrops(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve your crop listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await cropService.deleteCrop(deleteConfirmId);
      setCrops(crops.filter((crop) => crop.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete the crop listing.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 selection:bg-lime-500 selection:text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Crops</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage and review all your harvest listings.</p>
        </div>
        <Link
          to="/farmer/crops/add"
          className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-lime-900/30 text-sm"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Crop Listing</span>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
        </div>
      ) : crops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto">
          <div className="bg-slate-950 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-800 text-slate-500">
            <Sparkles className="h-8 w-8 text-lime-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Crops Listed Yet</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            You haven't added any crop offerings to the marketplace. Let's create your first listing!
          </p>
          <Link
            to="/farmer/crops/add"
            className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-3 px-6 rounded-xl transition text-sm shadow-lg shadow-lime-900/30"
          >
            Create First Offer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col group hover:border-lime-500/30 transition duration-300 shadow-xl"
            >
              {/* Product Image */}
              <div className="h-48 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {crop.imageUrl ? (
                  <img
                    src={crop.imageUrl}
                    alt={crop.cropName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = ''; // Clear source to trigger fallback icon
                      e.target.onerror = null;
                    }}
                  />
                ) : null}
                {/* Fallback layout */}
                {(!crop.imageUrl) && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-700">
                    <Leaf className="h-12 w-12 text-slate-800 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">AgriConnect</span>
                  </div>
                )}

                {/* Availability status tag absolute */}
                <div className="absolute top-4 right-4">
                  {crop.available ? (
                    <span className="inline-flex items-center space-x-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Available</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 bg-slate-950/80 text-slate-400 border border-slate-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">
                      <XCircle className="h-3 w-3" />
                      <span>Out of Stock</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-grow flex flex-col">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-lime-500 mb-2">
                  <Tag className="h-3.5 w-3.5" />
                  <span>{crop.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-lime-400 transition truncate mb-2">
                  {crop.cropName}
                </h3>
                {crop.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {crop.description}
                  </p>
                )}

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850/80 mb-5 mt-auto">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Price</span>
                    <span className="text-sm font-extrabold text-white">₹{crop.pricePerUnit} / {crop.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Quantity</span>
                    <span className="text-sm font-extrabold text-white">{crop.quantity} {crop.unit}</span>
                  </div>
                </div>

                {/* Location indicator */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-5">
                  <MapPin className="h-4.5 w-4.5 text-slate-500" />
                  <span className="truncate">{crop.location}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 mt-auto">
                  <Link
                    to={`/farmer/crops/${crop.id}`}
                    className="flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 font-semibold py-2 rounded-xl transition text-xs"
                    title="View Details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>
                  <Link
                    to={`/farmer/crops/edit/${crop.id}`}
                    className="flex items-center justify-center space-x-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 font-semibold py-2 rounded-xl transition text-xs"
                    title="Edit Offer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(crop.id)}
                    className="flex items-center justify-center space-x-1.5 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/30 hover:border-rose-900/50 text-rose-400 font-semibold py-2 rounded-xl transition text-xs"
                    title="Delete listing"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <div className="bg-rose-500/10 p-3 rounded-full w-fit mx-auto mb-4 text-rose-500 border border-rose-500/20">
              <Trash2 className="h-6 w-6 animate-pulse" />
            </div>
            <h4 className="text-lg font-extrabold text-white text-center mb-2">Delete Crop Listing?</h4>
            <p className="text-slate-400 text-xs text-center leading-relaxed mb-6">
              Are you sure you want to permanently delete this listing from the marketplace? This operation cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCancelDelete}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 font-semibold py-2.5 rounded-xl transition text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center space-x-1"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCrops;
