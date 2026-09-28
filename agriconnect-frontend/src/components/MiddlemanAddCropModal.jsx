import React, { useState } from 'react';
import { X, Sprout, Upload, Image as ImageIcon, ShieldAlert, Loader2, Check } from 'lucide-react';
import { middlemanService } from '../services/api';

const MiddlemanAddCropModal = ({ farmer, onClose, onCropAdded }) => {
  const [formData, setFormData] = useState({
    cropName: farmer?.primaryCrop || '',
    category: 'Grains',
    description: '',
    quantity: farmer?.approximateProduction || '',
    unit: farmer?.productionUnit || 'Kg',
    pricePerUnit: '',
    location: farmer?.village ? `${farmer.village}${farmer.district ? ', ' + farmer.district : ''}` : '',
    imageUrl: '',
    available: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!farmer) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size & type
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds 5MB size limit.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const handleUploadImage = async () => {
    if (!imageFile) return formData.imageUrl;
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', imageFile);
      const res = await middlemanService.uploadCropImage(data);
      setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      return res.imageUrl;
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Failed to upload crop image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.cropName.trim()) {
      setError('Crop Name is required.');
      return;
    }
    if (!formData.category) {
      setError('Category is required.');
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) < 0) {
      setError('Price per unit must be greater than or equal to 0.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        finalImageUrl = await handleUploadImage();
      }

      const cropPayload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        imageUrl: finalImageUrl,
      };

      const newCrop = await middlemanService.createCropForFarmer(farmer.id, cropPayload);
      setSuccess(`Crop listing for "${newCrop.cropName}" created successfully on behalf of ${farmer.farmerName}!`);
      setTimeout(() => {
        onCropAdded(newCrop);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to add crop listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm selection:bg-emerald-500 selection:text-slate-900">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Add Crop Listing</h2>
              <p className="text-xs text-slate-400">
                Creating listing for collected farmer: <span className="text-emerald-400 font-bold">{farmer.farmerName}</span>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Seller Account Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-300">Seller / Farmer:</span>
            <span className="font-bold text-emerald-400">{farmer.farmerName} (Collected Farmer)</span>
          </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center space-x-3 text-emerald-400 text-xs">
                <Check className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Crop Name *
                </label>
                <input
                  type="text"
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleInputChange}
                  placeholder="e.g. Wheat, Basmati Rice, Mustard"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="Grains">Grains</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Oilseeds">Oilseeds</option>
                  <option value="Spices">Spices</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g. 50"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="Kg">Kg</option>
                  <option value="Quintal">Quintal</option>
                  <option value="Ton">Ton</option>
                </select>
              </div>

              {/* Price per unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Price Per Unit (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleInputChange}
                  placeholder="e.g. 40"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Sohna, Gurugram"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                placeholder="Optional harvest notes or quality description..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Image Upload Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Crop Image (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Available Toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="available"
                name="available"
                checked={formData.available}
                onChange={handleInputChange}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <label htmlFor="available" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Available for Marketplace Listing
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publishing Crop...</span>
                  </>
                ) : (
                  <>
                    <Sprout className="h-4 w-4" />
                    <span>Add Crop to Marketplace</span>
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default MiddlemanAddCropModal;
