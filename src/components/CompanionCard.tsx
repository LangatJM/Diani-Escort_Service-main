import { BadgeCheck, MapPin, Languages } from 'lucide-react';
import type { Companion } from '@/lib/supabase';
import { formatKES } from '@/lib/format';
import { navigate } from '@/lib/router';
import { RatingStars } from './RatingStars';

export function CompanionCard({ companion, index = 0 }: { companion: Companion; index?: number }) {
  return (
    <button
      onClick={() => navigate(`/companion/${companion.id}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-ocean-800/60 ring-1 ring-white/10 text-left transition-all duration-300 hover:ring-ocean-400/60 hover:shadow-2xl hover:shadow-ocean-950/50 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={companion.image_url || ''}
          alt={companion.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950 via-ocean-950/30 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {companion.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ocean-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <BadgeCheck size={13} /> Verified
            </span>
          )}
          {companion.available ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-ring" /> Available
            </span>
          ) : (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
              Busy
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3.5 right-3.5">
          <h3 className="font-display text-xl font-semibold text-white">{companion.name}, {companion.age}</h3>
          <p className="text-sm text-white/75">{companion.tagline}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <RatingStars rating={companion.rating} reviews={companion.reviews} />
          <span className="font-semibold text-sand-300">{formatKES(companion.price_per_hour)}/hr</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {companion.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Languages size={12} /> {companion.languages.join(', ')}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {companion.interests.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-white/8 px-2 py-0.5 text-xs text-white/70">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
