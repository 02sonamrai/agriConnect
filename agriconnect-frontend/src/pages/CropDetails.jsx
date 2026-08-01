import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cropService } from '../services/api';
import { Leaf, ArrowLeft, Edit, Calendar, MapPin, Tag, ShieldAlert, Loader2, DollarSign, Archive, CheckCircle, AlertTriangle } from 'lucide-react';

const CropDetails = () => {
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCropDetails = async () => {
      try {
        const data = await cropService.getCropById(id);
        setCrop(data);
      } catch (err) {
        console.error(err);
        setError('Listing details not found. It may have been deleted, or you might not be authorized.');
      } finally {
        setLoading(false);
      }
    };
    fetchCropDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 selection:bg-rose-500 selection:text-slate-900">
        <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto text-rose-500 border border-rose-500/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Listing</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{error || 'An unexpected error occurred.'}</p>
        </div>
        <Link
          to="/farmer/crops"
          className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition inline-block text-sm"
        >
          Return to My Crops
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto selection:bg-lime-500 selection:text-slate-900">
      {/* Back link */}
      <div className="flex items-center space-x-2">
        <Link to="/farmer/crops" className="text-slate-500 hover:text-slate-300 text-sm flex items-center space-x-1 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Crops</span>
        </Link>
      </div>

      {/* Main Details Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Visual Crop Image */}
          <div className="md:w-1/2 bg-slate-950 min-h-[300px] flex items-center justify-center relative overflow-hidden">
            {crop.imageUrl ? (
              <img
                src={crop.imageUrl}
                alt={crop.cropName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '';
                  e.target.onerror = null;
                }}
              />
            ) : null}
            {(!crop.imageUrl) && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-700">
                <Leaf className="h-16 w-16 text-slate-800 mb-2" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-600">AgriConnect</span>
              </div>
            )}
            
            {/* Tag overlay */}
            <div className="absolute top-6 left-6">
              <span className="inline-flex items-center space-x-1.5 bg-slate-950/80 border border-slate-850 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-lime-400 backdrop-blur-md">
                <Tag className="h-3.5 w-3.5" />
                <span>{crop.category}</span>
              </span>
            </div>
          </div>

          {/* Text Metrics Body */}
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                {crop.available ? (
                  <span className="inline-flex items-center space-x-1.5 bg-lime-500/15 text-lime-400 border border-lime-500/30 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Active Listing</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Out of Stock / Inactive</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-4">
                {crop.cropName}
              </h1>

              {crop.description && (
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Description</span>
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    {crop.description}
                  </p>
                </div>
              )}

              {/* Param cards grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Selling Price</span>
                  <span className="text-lg font-black text-white flex items-center">
                    <DollarSign className="h-4.5 w-4.5 text-lime-400 mr-0.5" />
                    <span>₹{crop.pricePerUnit}</span>
                    <span className="text-slate-500 text-xs font-semibold ml-1">/ {crop.unit}</span>
                  </span>
                </div>

                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Available Stock</span>
                  <span className="text-lg font-black text-white flex items-center">
                    <Archive className="h-4.5 w-4.5 text-lime-400 mr-1" />
                    <span>{crop.quantity}</span>
                    <span className="text-slate-500 text-xs font-semibold ml-1">{crop.unit}</span>
                  </span>
                </div>
              </div>

              {/* Extra parameters lists */}
              <div className="space-y-3.5 border-t border-slate-800/80 pt-6">
                <div className="flex items-center space-x-3 text-slate-400 text-sm">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <span className="font-medium">{crop.location}</span>
                </div>

                <div className="flex items-center space-x-3 text-slate-400 text-sm">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <span className="font-medium">
                    Listed on: {new Date(crop.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="flex space-x-3 border-t border-slate-800/80 pt-6 mt-8">
              <Link
                to={`/farmer/crops/edit/${crop.id}`}
                className="flex-grow bg-lime-600 hover:bg-lime-500 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-lg shadow-lime-900/30"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Offer details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetails;
