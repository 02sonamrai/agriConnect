import React from 'react';
import { X, User, Phone, MapPin, Sprout, Layers, Calendar, ShoppingBag, FileText, UserCheck } from 'lucide-react';

const FarmerDetailModal = ({ farmer, onClose }) => {
  if (!farmer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm selection:bg-emerald-500 selection:text-slate-900">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{farmer.farmerName}</h2>
              <p className="text-xs text-slate-400">Collected Farmer Field Dossier #{farmer.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Phone */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <Phone className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
              <p className="font-bold text-white mt-0.5">{farmer.phoneNumber}</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Village / District / State</p>
              <p className="font-bold text-white mt-0.5">
                {farmer.village}
                {farmer.district ? `, ${farmer.district}` : ''}
                {farmer.state ? `, ${farmer.state}` : ''}
              </p>
            </div>
          </div>

          {/* Primary Crop */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <Sprout className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Crop</p>
              <p className="font-bold text-white mt-0.5">{farmer.primaryCrop}</p>
            </div>
          </div>

          {/* Farming Type */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <Layers className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Farming Type</p>
              <p className="font-bold text-white mt-0.5">{farmer.farmingType || 'Not specified'}</p>
            </div>
          </div>

          {/* Land Area */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <FileText className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Land Area</p>
              <p className="font-bold text-white mt-0.5">
                {farmer.landArea !== null && farmer.landArea !== undefined
                  ? `${farmer.landArea} ${farmer.landAreaUnit || 'Acres'}`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Approx Production */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <Sprout className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approximate Production</p>
              <p className="font-bold text-white mt-0.5">
                {farmer.approximateProduction !== null && farmer.approximateProduction !== undefined
                  ? `${farmer.approximateProduction} ${farmer.productionUnit || 'Quintal'}`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Preferred Market */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <ShoppingBag className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferred Market</p>
              <p className="font-bold text-white mt-0.5">{farmer.preferredMarket || 'Not specified'}</p>
            </div>
          </div>

          {/* Date Collected */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Date</p>
              <p className="font-bold text-white mt-0.5">
                {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Collected By Field Coordinator */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Collected By Field Coordinator</p>
              <p className="text-sm font-bold text-white">{farmer.collectedByName || 'Field Coordinator'}</p>
            </div>
          </div>
          {farmer.collectedByEmail && (
            <span className="text-xs text-slate-400">{farmer.collectedByEmail}</span>
          )}
        </div>

        {/* Notes */}
        {farmer.notes && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Additional Observations / Notes</p>
            <p className="text-slate-300 text-sm leading-relaxed">{farmer.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerDetailModal;
