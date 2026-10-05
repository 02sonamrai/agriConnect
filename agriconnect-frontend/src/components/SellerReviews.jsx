import React from 'react';
import { Loader2, Star, StarOff } from 'lucide-react';
import { RatingStars } from './StarRating';

const formatDate = (value) => {
  if (!value) return '';
  const [datePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-');
  if (!day) return datePart;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(day)} ${months[Number(month) - 1] || ''} ${year}`;
};

/**
 * A seller's own rating scorecard: their average, how many reviews it rests on, the star
 * distribution, and the reviews themselves.
 *
 * <p>Purely presentational. Whoever renders it fetches the summary, so the same component serves
 * a registered farmer's dashboard and a coordinator's view of a collected farmer.
 */
const SellerReviews = ({ summary, loading, error, emptyHint }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ratings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-300">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const total = summary.totalReviews || 0;
  const breakdown = summary.ratingBreakdown || {};

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Your rating</h2>
      </div>

      {total === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <StarOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
          <p className="text-sm text-slate-400">
            {emptyHint || 'No reviews yet. Buyers can rate you once an order is delivered.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="text-center">
              <p className="text-4xl font-black text-white">
                {(summary.averageRating || 0).toFixed(1)}
              </p>
              <div className="mt-1.5 flex justify-center">
                <RatingStars value={summary.averageRating} size="h-4 w-4" />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {total === 1 ? '1 review' : `${total} reviews`}
              </p>
            </div>

            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = breakdown[stars] || 0;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-right text-xs text-slate-500">{stars}</span>
                    <Star className="h-3 w-3 shrink-0 text-amber-400 fill-amber-400" aria-hidden="true" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400/80"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {summary.reviews?.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars value={review.rating} size="h-4 w-4" />
                  <span className="text-xs text-slate-500">
                    {review.orderNumber} · {formatDate(review.createdAt)}
                    {review.edited && ' · edited'}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{review.comment}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-slate-500">No comment left.</p>
                )}
                {review.buyerName && (
                  <p className="mt-2 text-xs text-slate-500">Bought by {review.buyerName}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SellerReviews;
