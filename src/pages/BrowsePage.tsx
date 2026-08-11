import { useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { useCompanions } from '@/hooks/useCompanions';
import { CompanionCard } from '@/components/CompanionCard';

const interestOptions = ['Beach walks', 'Nightlife', 'Safari', 'Wellness', 'Dining', 'Water sports'];

export type SortOption = 'rating' | 'reviews' | 'price_asc' | 'price_desc' | 'newest';

export function BrowsePage({ initialQuery }: { initialQuery?: string }) {
  const { companions, loading, error } = useCompanions();
  const [query, setQuery] = useState(initialQuery || '');
  const [interest, setInterest] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  const filtered = useMemo(() => {
    const list = companions.filter((c) => {
      const q = query.trim().toLowerCase();
      return (
        (!q || [c.name, c.tagline || '', c.location || '', ...c.interests].join(' ').toLowerCase().includes(q)) &&
        (!interest || c.interests.includes(interest)) &&
        (!availableOnly || c.available)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_per_hour - b.price_per_hour;
      if (sortBy === 'price_desc') return b.price_per_hour - a.price_per_hour;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return b.rating - a.rating;
    });
  }, [companions, query, interest, availableOnly, sortBy]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 pb-20 pt-32 lg:px-8">
      <div className="animate-fade-up">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-ocean-300">Discover your Diani</p>
        <h1 className="font-display text-5xl font-semibold text-white sm:text-6xl">Explore companions</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/60">
          Find someone who matches the way you want to spend your time on the coast.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, mood, or activity"
            className="w-full rounded-xl border border-white/12 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-xs text-white/70">
            <ArrowUpDown size={14} className="text-ocean-300" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
            >
              <option value="rating" className="bg-ocean-900 text-white">Highest Rated</option>
              <option value="reviews" className="bg-ocean-900 text-white">Most Reviewed</option>
              <option value="price_asc" className="bg-ocean-900 text-white">Price: Low to High</option>
              <option value="price_desc" className="bg-ocean-900 text-white">Price: High to Low</option>
              <option value="newest" className="bg-ocean-900 text-white">Recently Added</option>
            </select>
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-semibold text-white/75 hover:bg-white/10 transition"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>

          {(interest || availableOnly) && (
            <button
              onClick={() => {
                setInterest('');
                setAvailableOnly(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-ocean-400/30 bg-ocean-500/10 px-4 py-3 text-sm font-semibold text-ocean-200"
            >
              Clear <X size={15} />
            </button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-ocean-900/80 p-5 animate-scale-in">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/45">What are you in the mood for?</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setInterest(interest === option ? '' : option)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                      interest === option
                        ? 'border-ocean-300 bg-ocean-400 text-ocean-950'
                        : 'border-white/12 text-white/65 hover:border-ocean-300/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 accent-ocean-400"
              />
              Available today
            </label>
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between border-b border-white/10 pb-4">
        <p className="text-sm text-white/50">
          {loading ? 'Finding your matches…' : `${filtered.length} companion${filtered.length === 1 ? '' : 's'} found`}
        </p>
        <span className="hidden items-center gap-2 text-xs text-white/35 sm:flex">
          <Filter size={13} /> Curated locally
        </span>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-coral-500/30 bg-coral-500/10 p-6 text-white/75">
          We couldn’t load companions right now. Please try again.
        </div>
      ) : loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-14 text-center">
          <p className="font-display text-2xl text-white">No exact matches yet</p>
          <p className="mt-2 text-sm text-white/50">Try a different name, interest, or turn off the availability filter.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <CompanionCard key={c.id} companion={c} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
