import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { marketplaceService, cartService, getErrorMessage } from '../services/api';
import ContactFarmerModal from '../components/ContactFarmerModal';
import {
  Leaf, ArrowLeft, Calendar, MapPin, Tag, ShieldAlert, Loader2, DollarSign, Archive, CheckCircle, User,
  ShoppingCart, Phone, Minus, Plus
} from 'lucide-react';

const MarketplaceCropDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, refreshCart } = useOutletContext() || {};

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Purchase / contact state
  const [quantity, setQuantity] = useState(1);
  const [actionError, setActionError] = useState('');
  const [adding, setAdding] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const fetchCropDetails = async () => {
      try {
        const data = await marketplaceService.getCropDetails(id);
        setCrop(data);
      } catch (err) {
        console.error(err);
        setError('Listing details not found. It may have been sold out, deactivated, or you might not be authorized.');
      } finally {
        setLoading(false);
      }
    };
    fetchCropDetails();
  }, [id]);

  const maxQuantity = crop ? Number(crop.quantity) : 1;

  const adjustQuantity = (next) => {
    const value = Math.floor(Number(next));
    if (Number.isNaN(value)) return;
    setQuantity(Math.min(Math.max(value, 1), Math.max(maxQuantity, 1)));
  };

  const handleAddToCart = async (thenCheckout) => {
    setAdding(true);
    setActionError('');
    try {
      if (addToCart) {
        await addToCart(Number(id), quantity);
      } else {
        await cartService.addItem(Number(id), quantity);
        await refreshCart?.();
      }
      if (thenCheckout) {
        navigate('/marketplace/cart');
      }
    } catch (err) {
      setActionError(getErrorMessage(err, `Could not add ${crop?.cropName || 'this crop'} to your cart.`));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6 selection:bg-rose-500 selection:text-slate-900 animate-fade-in">
        <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto text-rose-500 border border-rose-500/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Listing</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{error || 'An unexpected error occurred.'}</p>
        </div>
        <Link
          to="/marketplace"
          className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition inline-block text-sm"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto selection:bg-lime-500 selection:text-slate-900 animate-fade-in">
      {/* Back link */}
      <div className="flex items-center space-x-2">
        <Link to="/marketplace" className="text-slate-500 hover:text-slate-300 text-sm flex items-center space-x-1 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
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
                <span className="inline-flex items-center space-x-1.5 bg-lime-500/15 text-lime-400 border border-lime-500/30 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Available Offer</span>
                </span>
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
                {/* Farmer Info */}
                {crop.farmerName && (
                  <div className="flex items-center space-x-3 text-slate-400 text-sm">
                    <User className="h-5 w-5 text-slate-500" />
                    <span className="font-medium">
                      Farmer: <strong className="text-white">{crop.farmerName}</strong>
                    </span>
                  </div>
                )}

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
            <div className="border-t border-slate-800/80 pt-6 mt-8 space-y-3">
              {actionError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300">{actionError}</p>
                </div>
              )}

              {/* Quantity stepper */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Quantity</span>
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => adjustQuantity(quantity - 1)}
                    disabled={quantity <= 1 || adding}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => adjustQuantity(e.target.value)}
                    disabled={adding}
                    className="w-16 bg-transparent text-center text-sm font-bold text-white focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => adjustQuantity(quantity + 1)}
                    disabled={quantity >= maxQuantity || adding}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-slate-500 pr-2 pl-1">{crop.unit}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated total</span>
                <span className="text-xl font-black text-lime-400">
                  ₹{(Number(crop.pricePerUnit) * quantity).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={adding}
                  className="flex-grow bg-lime-600 hover:bg-lime-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-lg shadow-lime-900/30 disabled:shadow-none"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  <span>{adding ? 'Adding...' : 'Purchase Crop'}</span>
                </button>

                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={adding}
                  className="flex-grow bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={() => setContactOpen(true)}
                  className="flex-grow bg-transparent hover:bg-slate-800/60 border border-slate-800 text-slate-200 font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 text-sm"
                >
                  <Phone className="h-4 w-4" />
                  <span>Contact Farmer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {contactOpen && (
        <ContactFarmerModal
          cropId={Number(id)}
          cropName={crop.cropName}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
};

export default MarketplaceCropDetails;
