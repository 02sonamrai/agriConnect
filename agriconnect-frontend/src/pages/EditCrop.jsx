import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cropService } from '../services/api';
import { Leaf, ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react';

const EditCrop = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    cropName: '',
    category: '',
    description: '',
    quantity: '',
    unit: 'Kg',
    pricePerUnit: '',
    location: '',
    imageUrl: '',
    available: true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const categoriesList = ['Grains', 'Vegetables', 'Fruits', 'Spices', 'Dairy', 'Pulses', 'Other'];
  const unitsList = ['Kg', 'Quintal', 'Ton'];

  useEffect(() => {
    const loadCropDetails = async () => {
      try {
        const crop = await cropService.getCropById(id);
        setFormData({
          cropName: crop.cropName || '',
          category: crop.category || '',
          description: crop.description || '',
          quantity: crop.quantity ? crop.quantity.toString() : '',
          unit: crop.unit || 'Kg',
          pricePerUnit: crop.pricePerUnit ? crop.pricePerUnit.toString() : '',
          location: crop.location || '',
          imageUrl: crop.imageUrl || '',
          available: crop.available !== undefined ? crop.available : true,
        });
      } catch (err) {
        console.error(err);
        setApiError('Could not fetch crop listing details. It may not exist or you may not own it.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCropDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.cropName.trim()) {
      newErrors.cropName = 'Crop name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (parseFloat(formData.quantity) <= 0 || isNaN(formData.quantity)) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.pricePerUnit) {
      newErrors.pricePerUnit = 'Price per unit is required';
    } else if (parseFloat(formData.pricePerUnit) <= 0 || isNaN(formData.pricePerUnit)) {
      newErrors.pricePerUnit = 'Price must be greater than 0';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      await cropService.updateCrop(id, {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
      });
      navigate('/farmer/crops');
    } catch (err) {
      console.error(err);
      setApiError(
        err.response?.data?.message || 
        (err.response?.data?.errors ? Object.values(err.response.data.errors).join(', ') : null) ||
        'Failed to save updates. Please check inputs and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto selection:bg-lime-500 selection:text-slate-900">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <Link to="/farmer/crops" className="text-slate-500 hover:text-slate-300 text-sm flex items-center space-x-1 transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Crops</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-5">
          <div className="bg-lime-500/10 p-2.5 rounded-xl border border-lime-500/20 text-lime-400">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Edit Crop Details</h1>
            <p className="text-slate-500 text-xs mt-0.5">Modify properties of your harvest listing.</p>
          </div>
        </div>

        {apiError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* If loaded but profile fetching failed entirely, disable form */}
        {!apiError || formData.cropName ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Crop Name *
                </label>
                <input
                  type="text"
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  placeholder="Premium Basmati Rice"
                  className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 placeholder-slate-600 transition text-sm ${
                    errors.cropName ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                  }`}
                />
                {errors.cropName && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.cropName}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 transition text-sm ${
                    errors.category ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.category}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="150.00"
                  className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 placeholder-slate-600 transition text-sm ${
                    errors.quantity ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                  }`}
                />
                {errors.quantity && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.quantity}</p>}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 transition text-sm"
                >
                  {unitsList.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Per Unit */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Price Per Unit (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleChange}
                  placeholder="85.00"
                  className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 placeholder-slate-600 transition text-sm ${
                    errors.pricePerUnit ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                  }`}
                />
                {errors.pricePerUnit && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.pricePerUnit}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Harvest Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Amritsar, Punjab"
                  className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 placeholder-slate-600 transition text-sm ${
                    errors.location ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                  }`}
                />
                {errors.location && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.location}</p>}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-example"
                className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 text-slate-100 placeholder-slate-600 transition text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {formData.description.length} / 500 Chars
                </span>
              </div>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide crop details..."
                className={`block w-full px-4 py-3 bg-slate-950 border rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500/50 text-slate-100 placeholder-slate-600 transition text-sm ${
                  errors.description ? 'border-rose-500 focus:ring-rose-500/50' : 'border-slate-800 focus:border-lime-500'
                }`}
              ></textarea>
              {errors.description && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.description}</p>}
            </div>

            {/* Availability checkbox */}
            <div className="flex items-center space-x-3 bg-slate-950/60 p-4 border border-slate-850 rounded-2xl">
              <input
                id="available"
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                className="h-5 w-5 bg-slate-900 border-slate-800 rounded text-lime-600 focus:ring-lime-500 focus:ring-offset-slate-900 focus:ring-2 transition"
              />
              <label htmlFor="available" className="select-none text-sm text-slate-350 cursor-pointer">
                Mark this listing as <strong>Available for Purchase</strong> immediately.
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 border-t border-slate-800/80 pt-6">
              <Link
                to="/farmer/crops"
                className="bg-slate-950 hover:bg-slate-900 border border-slate-855 text-slate-400 font-semibold py-3 px-6 rounded-xl transition text-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-lime-900/30 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-6 text-center">
            <Link
              to="/farmer/crops"
              className="bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition inline-block text-sm"
            >
              Return to Listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCrop;
