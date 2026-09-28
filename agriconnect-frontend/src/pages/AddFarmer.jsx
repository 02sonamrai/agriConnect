import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { middlemanService } from '../services/api';
import { UserPlus, ArrowLeft, RotateCcw, ShieldAlert, CheckCircle2, Loader2, Save } from 'lucide-react';

const AddFarmer = () => {
  const navigate = useNavigate();

  const initialFormState = {
    farmerName: '',
    phoneNumber: '',
    village: '',
    district: '',
    state: '',
    farmingType: 'Organic',
    primaryCrop: '',
    landArea: '',
    landAreaUnit: 'Acres',
    approximateProduction: '',
    productionUnit: 'Quintal',
    preferredMarket: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validations
    if (!formData.farmerName.trim()) {
      setError('Farmer Name is required.');
      return;
    }
    if (!formData.phoneNumber.trim() || !/^[0-9]{10,15}$/.test(formData.phoneNumber.trim())) {
      setError('A valid Phone Number (10-15 digits) is required.');
      return;
    }
    if (!formData.village.trim()) {
      setError('Village is required.');
      return;
    }
    if (!formData.primaryCrop.trim()) {
      setError('Primary Crop is required.');
      return;
    }
    if (formData.landArea && parseFloat(formData.landArea) < 0) {
      setError('Land Area must be a positive number if provided.');
      return;
    }
    if (formData.approximateProduction && parseFloat(formData.approximateProduction) < 0) {
      setError('Approximate Production must be a positive number if provided.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        landArea: formData.landArea ? parseFloat(formData.landArea) : null,
        approximateProduction: formData.approximateProduction ? parseFloat(formData.approximateProduction) : null,
      };

      await middlemanService.createFarmer(payload);
      setSuccess('Farmer information collected successfully!');

      setTimeout(() => {
        navigate('/middleman/farmers');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Failed to submit farmer information. Please verify input data.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 selection:bg-emerald-500 selection:text-slate-900">
      {/* Top Breadcrumb Header */}
      <div className="flex justify-between items-center">
        <Link
          to="/middleman/farmers"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Collected Farmers</span>
        </Link>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-300 transition bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Form</span>
        </button>
      </div>

      {/* Main Form Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-800">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Add Farmer Record</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Collect field metrics for community farmers during field/village visits.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start space-x-3 text-emerald-400 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">
              1. Identity & Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Farmer Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="farmerName"
                  required
                  value={formData.farmerName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location Information */}
          <div className="pt-2 border-t border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">
              2. Geographical Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Village <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="village"
                  required
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="e.g. Rampur"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Karnal"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Haryana"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Agriculture & Yield Metrics */}
          <div className="pt-2 border-t border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">
              3. Farming & Yield Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Farming Type
                </label>
                <select
                  name="farmingType"
                  value={formData.farmingType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                >
                  <option value="Organic">Organic</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Subsistence">Subsistence</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Primary Crop <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="primaryCrop"
                  required
                  value={formData.primaryCrop}
                  onChange={handleChange}
                  placeholder="e.g. Wheat / Rice"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Land Area
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="landArea"
                  value={formData.landArea}
                  onChange={handleChange}
                  placeholder="e.g. 5.5"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Land Unit
                </label>
                <select
                  name="landAreaUnit"
                  value={formData.landAreaUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                >
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                  <option value="Bigha">Bigha</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Approx. Production
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="approximateProduction"
                  value={formData.approximateProduction}
                  onChange={handleChange}
                  placeholder="e.g. 120"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Production Unit
                </label>
                <select
                  name="productionUnit"
                  value={formData.productionUnit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                >
                  <option value="Quintal">Quintal</option>
                  <option value="Ton">Ton</option>
                  <option value="Kg">Kg</option>
                  <option value="Bags">Bags</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Preferred Market
                </label>
                <input
                  type="text"
                  name="preferredMarket"
                  value={formData.preferredMarket}
                  onChange={handleChange}
                  placeholder="e.g. Local Mandi / Direct Buyer"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Additional Observations / Field Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Farmer interested in organic certification, needs soil test assistance..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm font-semibold disabled:opacity-50"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Farmer Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFarmer;
