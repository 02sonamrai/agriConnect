import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '../services/api';
import { Leaf, Search, Tag, MapPin, CheckCircle2, Eye, ShieldAlert, Loader2, Sparkles } from 'lucide-react';

const Marketplace = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Client-side filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    const fetchMarketplaceCrops = async () => {
      try {
        const data = await marketplaceService.getAvailableCrops();
        setCrops(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load marketplace listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplaceCrops();
  }, []);

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(crops.map((crop) => crop.category))).filter(Boolean);

  // Filter logic
  const filteredCrops = crops.filter((crop) => {
    const matchesSearch = crop.cropName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? crop.category === selectedCategory : true;
    const matchesLocation = locationFilter ? crop.location.toLowerCase().includes(locationFilter.toLowerCase()) : true;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6 selection:bg-lime-500 selection:text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Marketplace</h1>
        <p className="text-slate-500 text-xs mt-0.5">Browse and source fresh crops directly from farmers.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm animate-shake">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xl">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by crop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
          />
        </div>

        {/* Category select */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Location input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <MapPin className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
          />
        </div>
      </div>

      {/* Crop Listings */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <div className="bg-slate-950 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-800 text-slate-500">
            <Sparkles className="h-8 w-8 text-lime-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Listings Found</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            We couldn't find any available crops matching your search criteria. Try modifying your filters or search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
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
                      e.target.src = '';
                      e.target.onerror = null;
                    }}
                  />
                ) : null}
                {(!crop.imageUrl) && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-700">
                    <Leaf className="h-12 w-12 text-slate-800 mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">AgriConnect</span>
                  </div>
                )}

                {/* Status tag */}
                <div className="absolute top-4 right-4 animate-pulse">
                  <span className="inline-flex items-center space-x-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Available</span>
                  </span>
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

                {/* Details Button */}
                <div className="border-t border-slate-800/80 pt-4 mt-auto">
                  <Link
                    to={`/marketplace/crops/${crop.id}`}
                    className="flex items-center justify-center space-x-2 bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-lg shadow-lime-900/25 w-full"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
