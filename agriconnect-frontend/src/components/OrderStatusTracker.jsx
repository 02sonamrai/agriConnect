import React, { useState } from 'react';
import { Check, Clock, Truck, PackageCheck, XCircle, Loader2 } from 'lucide-react';
import { orderService, getErrorMessage } from '../services/api';

/**
 * The delivery progress an order walks through, in order. Keys match the Order.STATUS_*
 * constants on the backend so this is a mirror of the server, not a second source of truth.
 *
 * The first stage accepts both PENDING and PLACED: checkout writes PLACED, while PENDING is
 * the order's own default. indexOfStage() collapses the two.
 */
export const ORDER_STAGES = [
  { key: 'PENDING', label: 'Pending', Icon: Clock, hint: 'Waiting for the seller to confirm.' },
  { key: 'CONFIRMED', label: 'Confirmed', Icon: Check, hint: 'The seller confirmed this order.' },
  { key: 'SHIPPED', label: 'Shipped', Icon: Truck, hint: 'The order is on the way.' },
  { key: 'DELIVERED', label: 'Delivered', Icon: PackageCheck, hint: 'This order is complete.' },
];

/** Order statuses that end the timeline instead of advancing it. */
const OFF_TRACK = {
  CANCELLED: 'This order was cancelled and will not be delivered.',
  REJECTED: 'The seller declined this order.',
};

const LAST = ORDER_STAGES.length - 1;

/** Position of a status on the timeline. Unknown values fall back to the first stage. */
export function indexOfStage(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDING' || s === 'PLACED') return 0;
  const i = ORDER_STAGES.findIndex((stage) => stage.key === s);
  return i === -1 ? 0 : i;
}

/** The stage a seller can advance to next, or null when there is none. */
export function nextOrderStage(status) {
  const i = indexOfStage(status);
  return i < LAST ? ORDER_STAGES[i + 1] : null;
}

export function isOffTrack(status) {
  return Boolean(OFF_TRACK[String(status || '').toUpperCase()]);
}

/**
 * Read-only progress timeline for an order. Derives everything from `order.status`, so it
 * works unchanged for a buyer's own order, a farmer's received order, and a coordinator's
 * assisted order.
 */
const OrderStatusTracker = ({ status, compact = false, className = '' }) => {
  const raw = String(status || '').toUpperCase();
  const offTrack = OFF_TRACK[raw];

  // The backend only stores the current status, so there is no history to replay for a
  // halted order. Show the outcome instead of a stepper that would imply false progress.
  if (offTrack) {
    return (
      <div className={`rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 flex items-start gap-3 ${className}`}>
        <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-rose-400">
            {raw.charAt(0) + raw.slice(1).toLowerCase()}
          </span>
          <span className="block text-sm text-rose-300/80 mt-0.5">{offTrack}</span>
        </div>
      </div>
    );
  }

  const current = indexOfStage(status);
  const active = ORDER_STAGES[current];

  // Icons sit at the centre of their grid column (12.5% and 87.5% of the width), so the
  // connector track is inset to match instead of running edge to edge.
  const first = 100 / (ORDER_STAGES.length * 2);
  const span = 100 - first * 2;
  const filled = (current / LAST) * span;

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950/40 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Order progress
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
          {active.label}
        </span>
      </div>

      <div className="relative">
        {/* Connector track, then the completed portion drawn over it. */}
        <div
          className="absolute top-4 h-0.5 -translate-y-1/2 rounded-full bg-slate-800"
          style={{ left: `${first}%`, right: `${first}%` }}
        />
        <div
          className="absolute top-4 h-0.5 -translate-y-1/2 rounded-full bg-lime-500 transition-all duration-500"
          style={{ left: `${first}%`, width: `${filled}%` }}
        />

        <ol className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${ORDER_STAGES.length}, minmax(0, 1fr))` }}>
          {ORDER_STAGES.map((stage, i) => {
            const done = i < current;
            const isActive = i === current;
            const Icon = stage.Icon;

            return (
              <li key={stage.key} className="flex flex-col items-center text-center">
                <span
                  className={[
                    'h-8 w-8 rounded-full grid place-items-center border transition-colors',
                    done ? 'bg-lime-500 border-lime-500 text-slate-900'
                      : isActive ? 'bg-slate-900 border-2 border-lime-500 text-lime-400 shadow-[0_0_0_3px_rgba(163,230,53,0.12)]'
                        : 'bg-slate-950 border-slate-800 text-slate-600',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span
                  className={[
                    'mt-2 font-bold leading-tight',
                    compact ? 'text-[10px]' : 'text-xs',
                    isActive ? 'text-white' : done ? 'text-lime-400' : 'text-slate-600',
                  ].join(' ')}
                >
                  {stage.label}
                </span>

                {isActive && !compact && (
                  <span className="mt-1 text-[10px] text-slate-500 leading-snug">{active.hint}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

/**
 * "Advance to the next stage" control for sellers. Shown only where the backend allows a
 * status change (farmer / coordinator / admin) and hidden once an order is delivered or
 * halted, since neither has a next stage.
 */
export const AdvanceOrderStatus = ({ orderId, status, onUpdated, className = '' }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const next = nextOrderStage(status);

  // Halted orders stay halted: indexOfStage() cannot place CANCELLED/REJECTED on the
  // timeline, so without this guard a cancelled order would offer to restart at Confirmed.
  if (!next || isOffTrack(status)) return null;
  const NextIcon = next.Icon;

  const advance = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await orderService.updateOrderStatus(orderId, next.key);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the order status.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={advance}
        disabled={busy}
        className="inline-flex items-center space-x-2 bg-lime-600 hover:bg-lime-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl transition text-xs"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <NextIcon className="h-3.5 w-3.5" />
        )}
        <span>Mark as {next.label}</span>
      </button>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
};

export default OrderStatusTracker;