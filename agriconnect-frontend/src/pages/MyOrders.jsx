import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService, getErrorMessage } from '../services/api';
import { Receipt, ShieldAlert, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import OrderStatusTracker from '../components/OrderStatusTracker';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await orderService.getMyOrders();
        if (active) setOrders(data || []);
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Could not load your orders.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Orders</h1>
        <p className="text-slate-500 text-xs mt-0.5">Every order you have placed through the marketplace.</p>
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
          <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            When you place an order from your cart it will appear here.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center space-x-2 bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition text-sm"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Browse Marketplace</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/marketplace/orders/${order.id}`}
              className="block bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-lime-500/30 transition duration-300 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Order</span>
                  <span className="text-lg font-black text-white">{order.orderNumber}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Placed</span>
                  <span className="text-sm font-semibold text-slate-300">
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Items</span>
                  <span className="text-sm font-semibold text-slate-300">{order.itemCount}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Total</span>
                  <span className="text-xl font-black text-lime-400">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>

                <span className="inline-flex items-center space-x-1.5 bg-lime-500/10 text-lime-400 border border-lime-500/20 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {order.status}
                </span>
              </div>

              <OrderStatusTracker status={order.status} compact className="mt-4" />

              <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold text-lime-400 group-hover:text-lime-300 transition inline-flex items-center gap-1">
                  View details
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
