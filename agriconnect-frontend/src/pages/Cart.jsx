import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { cartService, orderService, getErrorMessage } from '../services/api';
import {
  ShoppingCart, Leaf, ShieldAlert, Loader2, Trash2, Plus, Minus, Tag, MapPin, Package, ArrowRight
} from 'lucide-react';

const Cart = () => {
  const { cart, refreshCart } = useOutletContext() || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await refreshCart();
      } catch (err) {
        if (active) setError(getErrorMessage(err, 'Could not load your cart.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [refreshCart]);

  const items = cart?.items || [];
  const orderable = (cart?.items || []).filter((item) => item.available);

  const changeQuantity = async (item, nextQuantity) => {
    const value = Number(nextQuantity);
    if (Number.isNaN(value) || value <= 0) return;
    setBusyItemId(item.id);
    setError('');
    try {
      await cartService.updateItem(item.id, value);
      await refreshCart();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update that item.'));
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (item) => {
    setBusyItemId(item.id);
    setError('');
    try {
      await cartService.removeItem(item.id);
      await refreshCart();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove that item.'));
    } finally {
      setBusyItemId(null);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setOrderError('');
    try {
      const order = await orderService.placeOrder(null);
      await refreshCart();
      navigate(`/marketplace/orders/${order.id}`);
    } catch (err) {
      setOrderError(getErrorMessage(err, 'Could not place your order. Please review your cart.'));
      // Stock may have moved underneath us, so re-read the cart before showing the retry.
      await refreshCart();
    } finally {
      setPlacing(false);
    }
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Cart</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {items.length === 0
              ? 'Nothing in your cart yet.'
              : `${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} ready to review.`}
          </p>
        </div>
        {items.length > 0 && (
          <Link
            to="/marketplace"
            className="flex items-center space-x-2 text-sm text-lime-400 hover:text-lime-300 font-semibold transition"
          >
            <Leaf className="h-4 w-4" />
            <span>Continue shopping</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start space-x-3 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <div className="bg-slate-950 p-4 rounded-full w-fit mx-auto mb-4 border border-slate-800 text-slate-500">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Browse the marketplace and add crops you would like to purchase.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center space-x-2 bg-lime-600 hover:bg-lime-500 text-white font-bold py-2.5 px-6 rounded-xl transition text-sm"
          >
            <span>Browse Marketplace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Line items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-4 flex gap-4 shadow-xl transition ${
                  item.available ? 'border-slate-800' : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                {/* Thumbnail */}
                <div className="h-24 w-24 bg-slate-950 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.cropName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Leaf className="h-7 w-7 text-slate-800" />
                  )}
                </div>

                <div className="flex-grow min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-lime-500">
                        <Tag className="h-3 w-3" />
                        <span>{item.category}</span>
                      </div>
                      <h3 className="text-base font-bold text-white truncate mt-1">{item.cropName}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {item.isCollectedFarmer ? 'Collected Farmer' : 'Farmer'}:{' '}
                        <span className="text-slate-300 font-semibold">{item.farmerName}</span>
                      </p>
                      {item.location && (
                        <p className="text-xs text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item)}
                      disabled={busyItemId === item.id}
                      title="Remove"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition flex-shrink-0 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {!item.available && (
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start space-x-2">
                      <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">{item.unavailableReason} Please remove it to continue.</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    {/* Quantity stepper */}
                    <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                      <button
                        onClick={() => changeQuantity(item, Number(item.quantity) - 1)}
                        disabled={!item.available || busyItemId === item.id || Number(item.quantity) <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        disabled={!item.available || busyItemId === item.id}
                        onChange={(e) => changeQuantity(item, e.target.value)}
                        className="w-14 bg-transparent text-center text-sm font-bold text-white focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => changeQuantity(item, Number(item.quantity) + 1)}
                        disabled={!item.available || busyItemId === item.id || Number(item.quantity) >= Number(item.stockQuantity)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">Line total</span>
                      <span className="text-lg font-black text-white">
                        ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        ₹{Number(item.pricePerUnit).toLocaleString('en-IN')} / {item.unit}
                        {item.stockQuantity != null && ` · ${item.stockQuantity} ${item.unit} in stock`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-white mb-5">Order summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items</span>
                <span className="font-semibold text-slate-200">{cart.itemCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Orderable items</span>
                <span className="font-semibold text-slate-200">{cart.orderableItemCount}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-white">Total</span>
                <span className="text-2xl font-black text-lime-400">
                  ₹{Number(cart.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {orderError && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{orderError}</p>
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={placing || cart.orderableItemCount === 0}
              className="mt-5 w-full flex items-center justify-center space-x-2 bg-lime-600 hover:bg-lime-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-xl transition text-sm shadow-lg shadow-lime-900/30 disabled:shadow-none"
            >
              {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              <span>
                {placing
                  ? 'Placing order...'
                  : cart.orderableItemCount === 0
                  ? 'Remove unavailable items'
                  : 'Place Order'}
              </span>
            </button>

            <p className="mt-3 text-[11px] text-slate-500 text-center leading-relaxed">
              Placing an order sends your request to the seller. Contact them from the crop page to
              arrange delivery and payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
