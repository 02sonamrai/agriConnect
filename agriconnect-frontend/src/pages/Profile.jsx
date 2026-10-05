import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  MapPin,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Save,
  UserCog,
  Info,
} from 'lucide-react';

const EMPTY_ADDRESS = { addressLine: '', city: '', state: '', pincode: '' };

const Profile = () => {
  const { user } = useContext(AuthContext);

  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Re-read the profile every time the page opens so the form always shows what is actually
  // stored, not a cached copy from an earlier visit.
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const data = await authService.getProfile();
        if (cancelled) return;
        setAddress({
          addressLine: data.addressLine || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
        });
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || 'Could not load your profile. Please try again.'
        );
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const pincode = address.pincode.trim();
    if (pincode && !/^[0-9]+$/.test(pincode)) {
      setError('Pincode must contain digits only.');
      return;
    }

    setSaveLoading(true);
    try {
      const data = await authService.updateProfile({
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode,
      });

      // Echo back exactly what the server stored, so the form matches the saved record even
      // if the backend trimmed whitespace.
      setAddress({
        addressLine: data.addressLine || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
      });
      setSuccess('Delivery address saved.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors).join(', ')
            : null) ||
          'Could not save your address. Please try again.'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 text-lime-500 animate-spin" />
      </div>
    );
  }

  const hasAddress = Object.values(address).some((v) => v.trim());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/marketplace"
        className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-lime-400 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-800">
          <div className="bg-lime-500/10 p-3 rounded-2xl border border-lime-500/20 text-lime-400">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Edit Profile</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Update the delivery address farmers use to fulfil your orders.
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
          <div className="mb-6 bg-lime-500/10 border border-lime-500/20 p-4 rounded-xl flex items-start space-x-3 text-lime-400 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Account identity is read-only here: this screen exists to edit the delivery
            address, not to change who you are. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 pb-8 border-b border-slate-800">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Name
            </span>
            <p className="text-sm font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Email
            </span>
            <p className="text-sm text-slate-300 truncate">{user?.email}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Phone
            </span>
            <p className="text-sm text-slate-300">{user?.phoneNumber}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-lime-400">
            Delivery Address
          </h2>

          {!hasAddress && (
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-start space-x-3 text-slate-400 text-sm">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                You have not saved a delivery address yet. Until you do, sellers will not see
                where to deliver your orders.
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="addressLine"
              className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
            >
              Address
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-500"
                aria-hidden="true"
              />
              <input
                id="addressLine"
                name="addressLine"
                type="text"
                autoComplete="street-address"
                maxLength={200}
                value={address.addressLine}
                onChange={handleChange}
                placeholder="Flat 3, Shivaji Nagar"
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                maxLength={60}
                value={address.city}
                onChange={handleChange}
                placeholder="Pune"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                autoComplete="address-level1"
                maxLength={60}
                value={address.state}
                onChange={handleChange}
                placeholder="Maharashtra"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="pincode"
                className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >
                Pincode
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={10}
                value={address.pincode}
                onChange={handleChange}
                placeholder="411005"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-lime-600 hover:bg-lime-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition shadow-lg shadow-lime-900/20"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saveLoading ? 'Saving...' : 'Save Address'}</span>
            </button>

            <p className="text-xs text-slate-500">
              Applies to orders you place from now on. Orders already placed keep the address
              they were shipped to.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
