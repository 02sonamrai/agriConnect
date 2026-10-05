import React, { useEffect, useState } from 'react';
import { contactService, getErrorMessage } from '../services/api';
import { X, Phone, MapPin, User, ShieldAlert, Loader2, Package, Copy, Check } from 'lucide-react';

/**
 * Seller contact details for a listing. Deliberately shows only what the backend's
 * FarmerContactResponse exposes - name, phone and location. No credentials are ever
 * requested or displayed here.
 */
const ContactFarmerModal = ({ cropId, cropName, onClose }) => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await contactService.getCropContact(cropId);
        if (active) setContact(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Contact details are not available for this listing.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [cropId]);

  const copyPhone = async () => {
    if (!contact?.phone) return;
    try {
      await navigator.clipboard.writeText(contact.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-lime-500/10 p-2 rounded-xl border border-lime-500/20 text-lime-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Contact Seller</h3>
              <p className="text-xs text-slate-500 truncate">{cropName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-7 w-7 text-lime-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Seller</span>
                <p className="text-lg font-black text-white">{contact.contactName}</p>
                {contact.contactType && (
                  <span
                    className={`inline-flex items-center mt-2 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      contact.collectedFarmerListing
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-lime-500/10 text-lime-400 border-lime-500/20'
                    }`}
                  >
                    {contact.contactType}
                  </span>
                )}
              </div>

              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <Phone className="h-5 w-5 text-lime-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Phone</span>
                    <span className="text-base font-bold text-white truncate block">
                      {contact.phone || 'Not provided'}
                    </span>
                  </div>
                </div>
                {contact.phone && (
                  <button
                    onClick={copyPhone}
                    title="Copy number"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-lime-400 hover:border-lime-500/30 transition flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-lime-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {contact.location && (
                <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Location</span>
                    <span className="text-sm text-slate-300">{contact.location}</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 flex items-center space-x-3">
                <Package className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Available</span>
                  <span className="text-sm text-slate-300 font-semibold">
                    {contact.stockQuantity} {contact.unit}
                  </span>
                </div>
              </div>

              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="w-full flex items-center justify-center space-x-2 bg-lime-600 hover:bg-lime-500 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-lime-900/30"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call {contact.contactName}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactFarmerModal;
