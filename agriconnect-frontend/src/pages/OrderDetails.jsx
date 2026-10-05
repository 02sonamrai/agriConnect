import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService, getErrorMessage } from '../services/api';
import { ArrowLeft, Leaf, ShieldAlert, Loader2, Tag, MapPin, Receipt } from 'lucide-react';
import OrderStatusTracker from '../components/OrderStatusTracker';
import OrderReviewPanel from '../components/OrderReviewPanel';
import DeliveryAddress from '../components/DeliveryAddress';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await orderService.getOrderById(id);
        if (active) setOrder(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Order not found.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 text-lime-500 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-6">
        <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto text-rose-500 border border-rose-500/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Order Not Found</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{error || 'This order is unavailable.'}</p>
        </div>
        <Link
          to="/marketplace/orders"
          className="inline-block bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition text-sm"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto selection:bg-lime-500 selection:text-slate-900">
      <Link
        to="/marketplace/orders"
        className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-300 text-sm transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to My Orders</span>
      </Link>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center space-x-3">
          <div className="bg-lime-500/10 p-2.5 rounded-xl border border-lime-500/20 text-lime-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Order number</span>
            <span className="text-2xl font-black text-white">{order.orderNumber}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Placed on</span>
            <span className="text-sm font-semibold text-slate-300">
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Status</span>
            <span className="inline-flex items-center bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
              {order.status}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Total</span>
            <span className="text-2xl font-black text-lime-400">
              ₹{Number(order.totalAmount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <OrderStatusTracker status={order.status} />

      {/* Delivery address */}
      <DeliveryAddress
        address={order.deliveryAddress}
        city={order.deliveryCity}
        state={order.deliveryState}
        pincode={order.deliveryPincode}
      />

      {/* Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-5">
          Items <span className="text-slate-500 font-normal text-sm">({order.itemCount})</span>
        </h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 bg-slate-950/40 border border-slate-850 rounded-2xl p-4">
              <div className="h-20 w-20 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-800">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.cropName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Leaf className="h-6 w-6 text-slate-800" />
                )}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-lime-500">
                  <Tag className="h-3 w-3" />
                  <span>{item.category}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{item.cropName}</h3>
                <p className="text-xs text-slate-500">
                  {item.collectedFarmerListing ? 'Collected Farmer' : 'Farmer'}:{' '}
                  <span className="text-slate-300 font-semibold">{item.sellerName}</span>
                </p>
                {item.location && (
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <span className="block text-sm font-black text-white">
                  {Number(item.quantity)} {item.unit}
                </span>
                <span className="block text-xs text-slate-500">
                  ₹{Number(item.pricePerUnit).toLocaleString('en-IN')} / {item.unit}
                </span>
                <span className="block text-base font-black text-lime-400 mt-1">
                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {order.note && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Note</span>
          <p className="text-sm text-slate-300">{order.note}</p>
        </div>
      )}

      {/* Rating. Renders nothing until the order is delivered, and one box per seller when an
          order mixed a registered farmer with a collected farmer. */}
      <OrderReviewPanel orderId={order.id} orderStatus={order.status} />
    </div>
  );
};

export default OrderDetails;
