import { Star } from 'lucide-react';

type Props = {
  rating: number;
  reviews?: number;
  size?: number;
  className?: string;
};

export function RatingStars({ rating, reviews, size = 14, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= Math.round(rating)
                ? 'fill-sand-400 text-sand-400'
                : 'fill-none text-white/25'
            }
          />
        ))}
      </div>
      <span className="text-xs font-medium text-white/70">
        {rating.toFixed(1)}
        {reviews !== undefined && ` (${reviews})`}
      </span>
    </div>
  );
}
