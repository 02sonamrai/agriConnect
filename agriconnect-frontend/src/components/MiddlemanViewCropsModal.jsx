import React, { useState, useEffect } from 'react';
import { X, Sprout, Trash2, ShieldAlert, Loader2, Plus, Tag, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { middlemanService } from '../services/api';

const MiddlemanViewCropsModal = ({ farmer, onClose, onAddCropClick }) => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchCrops = async () => {
    if (!farmer) return;
    setLoading(true);
    setError('');
    try {
      const data = await middlemanService.getCropsForFarmer(farmer.id);
      setCrops(data);
    } catch (err) {
      console.error(err);
      setError('Could not load crops for this farmer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [farmer]);

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop listing?')) return;
    setDeletingId(cropId);
    try {
      await middlemanService.deleteCrop(cropId);
      setCrops((prev) => prev.filter((c) => c.id !== cropId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete crop.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!farmer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm selection:bg-emerald-500 selection:text-slate-900">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Crops for {farmer.farmerName}</h2>
              <p className="text-xs text-slate-400">
                Village: <span className="text-emerald-400 font-bold">{farmer.village || 'N/A'}</span>
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

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center space-x-3 text-rose-400 text-xs shrink-0">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar pr-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
          ) : crops.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 space-y-3">
              <Sprout className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-semibold">No crop listings found for this farmer.</p>
              <button
                onClick={() => {
                  onClose();
                  if (onAddCropClick) onAddCropClick(farmer);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Crop Listing</span>
              </button>
            </div>
          ) : (
            crops.map((crop) => (
              <div
                key={crop.id}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start space-x-3">
                  {crop.imageUrl ? (
                    <img
                      src={crop.imageUrl}
                      alt={crop.cropName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sprout className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-base">{crop.cropName}</h4>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-xs font-semibold">
                        {crop.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="font-bold text-emerald-300">₹{crop.pricePerUnit} / {crop.unit}</span>
                      <span>•</span>
                      <span>Stock: {crop.quantity} {crop.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{crop.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-xs">
                    {crop.available ? (
                      <span className="text-emerald-400 flex items-center space-x-1 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Available</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center space-x-1 font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Unavailable</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCrop(crop.id)}
                    disabled={deletingId === crop.id}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                  >
                    {deletingId === crop.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-between items-center shrink-0 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              if (onAddCropClick) onAddCropClick(farmer);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Crop</span>
          </button>
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

export default MiddlemanViewCropsModal;
