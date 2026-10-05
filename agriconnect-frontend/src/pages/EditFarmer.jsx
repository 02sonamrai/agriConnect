import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { middlemanService, reviewService, getErrorMessage } from '../services/api';
import SellerReviews from '../components/SellerReviews';
import { Edit3, ArrowLeft, ShieldAlert, CheckCircle2, Loader2, Save } from 'lucide-react';

const EditFarmer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
  });

  const [fetchLoading, setFetchLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scorecard, setScorecard] = useState(null);
  const [scorecardLoading, setScorecardLoading] = useState(true);
  const [scorecardError, setScorecardError] = useState('');

  // Reviews for this collected farmer. Scoped to one collected farmer server-side, so a
  // coordinator can only ever load their own. A failure here must not block editing.
  const loadScorecard = useCallback(async () => {
    setScorecardLoading(true);
    setScorecardError('');
    try {
      setScorecard(await reviewService.getCollectedFarmerScorecard(id));
    } catch (err) {
      setScorecardError(getErrorMessage(err, 'Could not load reviews for this farmer.'));
    } finally {
      setScorecardLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadScorecard();
  }, [loadScorecard]);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const data = await middlemanService.getFarmerById(id);
        setFormData({
          farmerName: data.farmerName || '',
          phoneNumber: data.phoneNumber || '',
          village: data.village || '',
          district: data.district || '',
          state: data.state || '',
          farmingType: data.farmingType || 'Organic',
          primaryCrop: data.primaryCrop || '',
          landArea: data.landArea !== null && data.landArea !== undefined ? data.landArea.toString() : '',
          landAreaUnit: data.landAreaUnit || 'Acres',
          approximateProduction: data.approximateProduction !== null && data.approximateProduction !== undefined ? data.approximateProduction.toString() : '',
          productionUnit: data.productionUnit || 'Quintal',
          preferredMarket: data.preferredMarket || '',
          notes: data.notes || '',
        });
      } catch (err) {
        console.error(err);
        setError('Failed to fetch farmer record or record does not exist.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchFarmer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
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

    setSaveLoading(true);

    try {
      const payload = {
        ...formData,
        landArea: formData.landArea ? parseFloat(formData.landArea) : null,
        approximateProduction: formData.approximateProduction ? parseFloat(formData.approximateProduction) : null,
      };

      await middlemanService.updateFarmer(id, payload);
      setSuccess('Farmer record updated successfully!');

      setTimeout(() => {
        navigate('/middleman/farmers');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Failed to update farmer record.'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 selection:bg-emerald-500 selection:text-slate-900">
      <div className="flex justify-between items-center">
        <Link
          to="/middleman/farmers"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Collected Farmers</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-800">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
            <Edit3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Edit Farmer Record #{id}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Update collected field information for farmer {formData.farmerName}.
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
          {/* Identity */}
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
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Location */}
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
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Metrics */}
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
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Additional Observations / Field Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-4">
            <Link
              to="/middleman/farmers"
              className="px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saveLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 text-sm"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* What buyers have said about this collected farmer. Kept outside the form so editing
          details never disturbs it, and loaded independently of the save. */}
      <SellerReviews
        summary={scorecard}
        loading={scorecardLoading}
        error={scorecardError}
        emptyHint={`No reviews yet for ${formData.farmerName || 'this farmer'}. Buyers can rate them once an order is delivered.`}
      />
    </div>
  );
};

export default EditFarmer;
