import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const MIN_RATING = 1;
export const MAX_RATING = 5;

const STAR_CLASS = {
  active: 'text-amber-400 fill-amber-400',
  inactive: 'text-slate-600',
};

/**
 * Shows a rating as filled stars. `size` is the lucide icon size in pixels.
 */
export const RatingStars = ({ value = 0, size = 'h-4 w-4', showValue = false, reviewCount }) => {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5" aria-label={`${rounded} out of ${MAX_RATING} stars`}>
        {Array.from({ length: MAX_RATING }, (_, index) => (
          <Star
            key={index}
            className={`${size} ${index < rounded ? STAR_CLASS.active : STAR_CLASS.inactive}`}
            aria-hidden="true"
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm font-semibold text-white">
          {rounded > 0 ? rounded.toFixed(1) : '—'}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-500">
          {reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}
        </span>
      )}
    </span>
  );
};

/**
 * Star picker for writing a review. Hovering previews a value, and a half state is never offered -
 * the backend only stores whole stars.
 */
const RatingInput = ({ value, onChange, disabled = false, name = 'rating' }) => {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value || 0;

  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= shown;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            name={name}
            disabled={disabled}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(starValue)}
            onBlur={() => setHovered(0)}
            className={`rounded p-0.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? '' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Star className={`h-7 w-7 ${active ? STAR_CLASS.active : STAR_CLASS.inactive}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};

export default RatingInput;
