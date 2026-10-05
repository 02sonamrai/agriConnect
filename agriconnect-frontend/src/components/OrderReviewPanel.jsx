import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquarePlus, Pencil, Star } from 'lucide-react';
import { reviewService, getErrorMessage } from '../services/api';
import RatingInput, { RatingStars } from './StarRating';

const formatDate = (value) => {
  if (!value) return '';
  const [datePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-');
  if (!day) return datePart;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(day)} ${months[Number(month) - 1] || ''} ${year}`;
};

/** One seller's review slot: either the form to write it, or the review already written. */
const TargetRow = ({ target, onChanged }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Seed the form from an existing review when the buyer switches into edit mode.
  useEffect(() => {
    if (editing && target.existing) {
      setRating(target.existing.rating || 0);
      setComment(target.existing.comment || '');
    }
  }, [editing, target.existing]);

  const submit = async (event) => {
    event.preventDefault();
    if (rating < 1) {
      setError('Please choose a rating between 1 and 5 stars.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (target.alreadyReviewed) {
        await reviewService.update(target.existing.id, { rating, comment });
      } else {
        await reviewService.create({ orderId: target.orderId, sellerKey: target.sellerKey, rating, comment });
      }
      setEditing(false);
      setComment('');
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your review.'));
    } finally {
      setBusy(false);
    }
  };

  const isCollected = target.sellerType === 'COLLECTED_FARMER';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-white">{target.sellerName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {isCollected ? 'Collected farmer' : 'Registered farmer'}
            {target.cropNames?.length > 0 && ` · ${target.cropNames.join(', ')}`}
          </p>
        </div>
        {target.alreadyReviewed && !editing && (
          <RatingStars value={target.existing?.rating} size="h-4 w-4" />
        )}
      </div>

      {target.alreadyReviewed && !editing ? (
        <div className="mt-3 space-y-2">
          {target.existing?.comment ? (
            <p className="text-sm leading-relaxed text-slate-300">{target.existing.comment}</p>
          ) : (
            <p className="text-sm italic text-slate-500">No comment left.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">
              Reviewed on {formatDate(target.existing?.createdAt)}
              {target.existing?.edited && ' · edited'}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 transition hover:text-lime-300"
            >
              <Pencil className="h-3 w-3" /> Edit review
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <RatingInput value={rating} onChange={setRating} disabled={busy} />

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={500}
            disabled={busy}
            placeholder="How was the produce? (optional)"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 transition focus:border-lime-500 focus:outline-none disabled:opacity-60"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-lime-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              {target.alreadyReviewed ? 'Save changes' : 'Submit review'}
            </button>

            {target.alreadyReviewed && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError('');
                }}
                disabled={busy}
                className="text-xs font-semibold text-slate-400 transition hover:text-slate-200"
              >
                Cancel
              </button>
            )}

            <span className="text-[11px] text-slate-600">{comment.length}/500</span>
          </div>
        </form>
      )}
    </div>
  );
};

/**
 * The buyer's review section for one order.
 *
 * <p>One box per seller, because an order can mix a registered farmer with a collected farmer.
 * The server decides who those sellers are, so the split can never be mislabelled here.
 */
const OrderReviewPanel = ({ orderId, orderStatus }) => {
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewService.getOrderTargets(orderId);
      setTargets(data);
      // Fold each submitted review into its target so the row can render it directly.
      const mine = await reviewService.getMine();
      const byId = new Map(mine.map((review) => [review.id, review]));
      setTargets({
        ...data,
        targets: (data.targets || []).map((target) =>
          target.reviewId
            ? { ...target, orderId, existing: byId.get(target.reviewId) || null }
            : { ...target, orderId, existing: null }
        ),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the review section.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // The server is the only authority on reviewability, but skip the request entirely for the
  // statuses that can never be reviewed so an undelivered order renders nothing.
  if (orderStatus && !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(orderStatus)) return null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-lime-400" />
        <h2 className="text-lg font-bold text-white">Rate the sellers</h2>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews...
        </div>
      )}

      {!loading && error && <p className="text-sm text-rose-400">{error}</p>}

      {!loading && !error && targets && !targets.reviewable && (
        <p className="text-sm text-slate-400">{targets.reason}</p>
      )}

      {!loading &&
        !error &&
        targets?.reviewable &&
        targets.targets.length > 0 && (
          <div className="space-y-4">
            {targets.targets.length > 1 && (
              <p className="text-xs text-slate-500">
                This order had {targets.targets.length} sellers, so rate each of them separately.
              </p>
            )}
            {targets.targets.map((target) => (
              <TargetRow key={target.sellerKey} target={target} onChanged={load} />
            ))}
          </div>
        )}
    </section>
  );
};

export default OrderReviewPanel;
