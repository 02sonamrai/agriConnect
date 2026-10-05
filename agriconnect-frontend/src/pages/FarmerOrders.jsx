import React, { useEffect, useState } from 'react';
import { orderService, getErrorMessage } from '../services/api';
import { Receipt, ShieldAlert, Loader2, Leaf, MapPin, User } from 'lucide-react';
import OrderStatusTracker, { AdvanceOrderStatus } from '../components/OrderStatusTracker';
import DeliveryAddress from '../components/DeliveryAddress';

/**
 * Farmer-facing view of orders received. The backend returns only this farmer's own order
 * lines, so no other seller's items are ever sent to this page.
 */
const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await orderService.getReceivedOrders();
        if (active) setOrders(data || []);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Could not load received orders.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  /** Swap a single order in place after its status was advanced, leaving the list untouched. */
  const applyStatusUpdate = (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 selection:bg-lime-500 selection:text-slate-900">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Orders Received</h1>
        <p className="text-slate-500 text-xs mt-0.5">Purchase requests buyers have placed for your crops.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <div className="bg-slate-950 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-800 text-slate-500">
            <Receipt className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No orders received yet</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            When a buyer orders one of your crops it will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="bg-lime-500/10 p-2 rounded-xl border border-lime-500/20 text-lime-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Buyer</span>
                    <span className="text-sm font-bold text-white">{order.buyerName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Order</span>
                  <span className="text-sm font-black text-white">{order.orderNumber}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Date</span>
                  <span className="text-sm font-semibold text-slate-300">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Your total</span>
                  <span className="text-xl font-black text-lime-400">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Delivery address + progress */}
              <div className="p-5 border-b border-slate-800 space-y-4">
                <DeliveryAddress
                  address={order.deliveryAddress}
                  city={order.deliveryCity}
                  state={order.deliveryState}
                  pincode={order.deliveryPincode}
                  title="Deliver to"
                />

                <OrderStatusTracker status={order.status} />

                <AdvanceOrderStatus
                  orderId={order.id}
                  status={order.status}
                  onUpdated={applyStatusUpdate}
                  className="flex justify-end"
                />
              </div>

              <div className="p-5 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center bg-slate-950/40 border border-slate-850 rounded-2xl p-3">
                    <div className="h-16 w-16 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-800">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.cropName}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Leaf className="h-5 w-5 text-slate-800" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{item.cropName}</h3>
                      <p className="text-xs text-slate-500">
                        ₹{Number(item.pricePerUnit).toLocaleString('en-IN')} / {item.unit}
                      </p>
                      {item.location && (
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="block text-sm font-black text-white">
                        {Number(item.quantity)} {item.unit}
                      </span>
                      <span className="block text-sm font-black text-lime-400">
                        ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
