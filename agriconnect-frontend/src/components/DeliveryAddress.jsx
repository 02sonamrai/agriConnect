import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Delivery address panel for an order. Renders nothing when the order carries no address,
 * so orders placed before the address existed simply show no panel rather than an empty box.
 *
 * Only the address is ever rendered - no buyer email, phone or account data.
 */
const DeliveryAddress = ({
  address,
  city,
  state,
  pincode,
  title = 'Delivery address',
  className = '',
}) => {
  const region = [city, state, pincode].filter(Boolean).join(', ');
  if (!address && !region) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/40 p-4 flex items-start gap-3 ${className}`}
    >
      <div className="bg-lime-500/10 p-2 rounded-xl border border-lime-500/20 text-lime-400 flex-shrink-0">
        <MapPin className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {title}
        </span>
        {address && <p className="text-sm font-semibold text-white mt-1">{address}</p>}
        {region && <p className="text-sm text-slate-400">{region}</p>}
      </div>
    </div>
  );
};

export default DeliveryAddress;