import React, { useCallback, useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { farmerDashboardService, reviewService, getErrorMessage } from '../services/api';
import SellerReviews from '../components/SellerReviews';
import {
  Plus,
  Eye,
  Leaf,
  Tag,
  ShieldAlert,
  Loader2,
  Wallet,
  Receipt,
  Clock,
  CheckCircle2,
  IndianRupee,
  Package,
  TrendingUp,
} from 'lucide-react';

const rupees = (value) =>
  '₹' +
  Number(value ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
};

/** Same status colouring the Orders Received list uses, so the two screens read identically. */
const STATUS_STYLES = {
  PLACED: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  PENDING: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  CONFIRMED: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  DELIVERED: 'bg-lime-500/10 text-lime-300 border-lime-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

const StatCard = ({ icon: Icon, label, value, hint, tone = 'slate' }) => {
  const accent =
    tone === 'lime'
      ? 'bg-lime-500/10 text-lime-400 border-lime-500/20'
      : 'bg-slate-850 text-slate-400 border-slate-800';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className={`mb-4 w-fit rounded-xl border p-3 ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-4xl font-black tracking-tight text-white">{value}</p>
      {hint && <p className="mt-3 text-xs leading-relaxed text-slate-400">{hint}</p>}
    </div>
  );
};

/**
 * Farmer sales and earnings overview.
 *
 * <p>
 * Every figure comes from the /api/farmer/dashboard/sales endpoint, which derives them from this
 * farmer's own crop listings and order lines. Nothing is aggregated from other sellers, and a
 * collected farmer's listings are never counted as this farmer's sales.
 */
const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scorecard, setScorecard] = useState(null);
  const [scorecardLoading, setScorecardLoading] = useState(true);
  const [scorecardError, setScorecardError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSales(await farmerDashboardService.getSales());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your sales dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ratings are loaded separately so a failure here never hides the sales figures.
  const loadScorecard = useCallback(async () => {
    setScorecardLoading(true);
    setScorecardError('');
    try {
      setScorecard(await reviewService.getMyScorecard());
    } catch (err) {
      setScorecardError(getErrorMessage(err, 'Could not load your rating.'));
    } finally {
      setScorecardLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadScorecard();
  }, [load, loadScorecard]);

  // Mixed units cannot be added into one number, so each unit is shown as its own figure.
  const quantityEntries = sales ? Object.entries(sales.quantitySoldByUnit ?? {}) : [];

  return (
    <div className="space-y-8 selection:bg-lime-500 selection:text-slate-900">
      <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-lime-900/40 to-slate-900 p-6 md:flex-row md:items-center md:p-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              {user?.firstName}
            </span>
            !
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your sales, earnings and recent orders, calculated from your own listings and orders.
          </p>
        </div>
        <Link
          to="/farmer/crops/add"
          className="flex shrink-0 items-center space-x-2 rounded-xl bg-lime-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-lime-900/30 transition hover:bg-lime-500"
        >
          <Plus className="h-5 w-5" />
          <span>Add Crop Listing</span>
        </Link>
      </div>

      {error && (
        <div className="flex items-start space-x-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
        </div>
      ) : (
        sales && (
          <>
            {/* Headline earnings. Delivered is the number that is actually money in hand. */}
            <section className="grid gap-6 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl border border-lime-500/20 bg-gradient-to-br from-lime-900/50 to-slate-900 p-6 md:p-8">
                <div className="bg-lime-500/10 mb-4 w-fit rounded-2xl border border-lime-500/20 p-3 text-lime-400">
                  <Wallet className="h-7 w-7" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-lime-300/80">
                  Delivered earnings
                </p>
                <p className="mt-1 text-4xl font-black tracking-tight text-white md:text-5xl">
                  {rupees(sales.deliveredEarnings)}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  From {sales.completedOrders} completed{' '}
                  {sales.completedOrders === 1 ? 'order' : 'orders'}. This is money from orders
                  that have actually been delivered.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
                <div className="mb-4 w-fit rounded-2xl border border-slate-800 bg-slate-850 p-3 text-slate-400">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Estimated total earnings
                </p>
                <p className="mt-1 text-4xl font-black tracking-tight text-white md:text-5xl">
                  {rupees(sales.totalEarnings)}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Every order that has not been cancelled or rejected, including the{' '}
                  {sales.pendingOrders} still pending.
                </p>
              </div>
            </section>

            {/* Counts */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Receipt}
                label="Total orders received"
                value={sales.totalOrdersReceived}
                hint="Orders containing at least one of your crops."
              />
              <StatCard
                icon={Clock}
                label="Pending orders"
                value={sales.pendingOrders}
                hint="Placed, confirmed or shipped and not yet delivered."
              />
              <StatCard
                icon={CheckCircle2}
                tone="lime"
                label="Completed orders"
                value={sales.completedOrders}
                hint="Delivered orders. Cancelled and rejected are excluded."
              />
              <StatCard
                icon={Leaf}
                label="Total crops listed"
                value={sales.totalCropsListed}
                hint={`${sales.availableCrops} currently available to buyers.`}
              />
            </section>

            {/* Quantity and status split */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-850 p-2.5 text-slate-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Total quantity sold</h2>
                </div>

                {quantityEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nothing sold yet. Quantity appears here once a buyer orders one of your crops.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {quantityEntries.map(([unit, quantity]) => (
                        <li
                          key={unit}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                        >
                          <span className="text-sm text-slate-300">{unit}</span>
                          <span className="text-lg font-black text-white">
                            {Number(quantity).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {quantityEntries.length > 1 && (
                      <p className="mt-3 text-xs text-slate-500">
                        Shown per unit because quantities in different units cannot be added
                        together.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-850 p-2.5 text-slate-400">
                    <Tag className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Order breakdown</h2>
                </div>
                <ul className="space-y-2">
                  {[
                    ['Pending', sales.pendingOrders, 'text-amber-300'],
                    ['Completed', sales.completedOrders, 'text-lime-300'],
                    ['Cancelled / rejected', sales.cancelledOrders, 'text-rose-300'],
                    ['Total crops listed', sales.totalCropsListed, 'text-slate-200'],
                    ['Available listings', sales.availableCrops, 'text-slate-200'],
                  ].map(([label, value, tone]) => (
                    <li
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                    >
                      <span className="text-sm text-slate-300">{label}</span>
                      <span className={`text-lg font-black ${tone}`}>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Recent sales */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">Recent sales</h2>
                <Link
                  to="/farmer/orders"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-lime-400 transition hover:text-lime-300"
                >
                  View all orders <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {sales.recentSales.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No orders yet. Your most recent sales will appear here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="pb-3">Order</th>
                        <th className="pb-3">Crop</th>
                        <th className="pb-3">Buyer</th>
                        <th className="pb-3">Quantity</th>
                        <th className="pb-3">Your total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.recentSales.map((sale) => (
                        <tr
                          key={`${sale.orderId}-${sale.cropName}-${sale.orderDate}`}
                          className="border-t border-slate-800 text-slate-300 transition hover:bg-slate-800/40"
                        >
                          <td className="py-3 font-semibold text-slate-100">{sale.orderNumber}</td>
                          <td className="py-3">{sale.cropName}</td>
                          <td className="py-3">{sale.buyerName}</td>
                          <td className="py-3">
                            {Number(sale.quantity).toLocaleString('en-IN')} {sale.unit}
                          </td>
                          <td className="py-3 font-bold text-lime-400">
                            <span className="inline-flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
                              {Number(sale.totalPrice).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                                STATUS_STYLES[sale.orderStatus] ??
                                'border-slate-800 bg-slate-850 text-slate-300'
                              }`}
                            >
                              {sale.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{formatDate(sale.orderDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
      )}

      {/* Quick Management Controls */}
      <div className="border-t border-slate-800/80 pt-8">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-white">Quick Management Controls</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/farmer/crops"
            className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:bg-slate-850"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-slate-850 p-2.5 text-slate-400 transition group-hover:text-white">
                <Eye className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">View My Crops</p>
                <p className="text-xs text-slate-500">Edit, update status or delete listings</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-500 transition group-hover:text-lime-400">
              &rarr;
            </span>
          </Link>

          <Link
            to="/farmer/crops/add"
            className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:bg-slate-850"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-slate-850 p-2.5 text-slate-400 transition group-hover:text-white">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Add New Listing</p>
                <p className="text-xs text-slate-500">Post new crop harvest listings</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-500 transition group-hover:text-lime-400">
              &rarr;
            </span>
          </Link>

          <Link
            to="/farmer/market-prices"
            className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:bg-slate-850"
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-slate-850 p-2.5 text-slate-400 transition group-hover:text-white">
                <Tag className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Market Prices</p>
                <p className="text-xs text-slate-500">See today&apos;s mandi rates</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-500 transition group-hover:text-lime-400">
              &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* Ratings buyers have left. Its own request and error state, so a failure here never
          hides the sales figures above. */}
      <SellerReviews
        summary={scorecard}
        loading={scorecardLoading}
        error={scorecardError}
        emptyHint="No reviews yet. Buyers can rate you once one of your orders is delivered."
      />
    </div>
  );
};

export default FarmerDashboard;