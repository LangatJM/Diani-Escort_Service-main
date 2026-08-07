import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, type Review, type NewReview } from '@/lib/supabase';
import { demoReviews, demoInsertReview } from '@/lib/demoData';
import { RatingStars } from './RatingStars';

type Props = { companionId: string; companionName: string };

export function ReviewsSection({ companionId, companionName }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<NewReview>({
    companion_id: companionId,
    reviewer_name: '',
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, companion_id: companionId }));
  }, [companionId]);

useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setReviews(demoReviews[companionId] || []);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('companion_id', companionId)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setReviews((data as Review[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companionId]);

  const submit = async () => {
    setError('');
    if (!form.reviewer_name.trim()) {
      setError('Please enter your name.');
      return;
    }
setSubmitting(true);
    let data: Review | null = null;
    if (isSupabaseConfigured) {
      const res = await supabase
        .from('reviews')
        .insert(form)
        .select('*')
        .maybeSingle();
      data = (res.data as Review) || null;
      if (res.error || !data) {
        setError('Could not submit your review. Please try again.');
        setSubmitting(false);
        return;
      }
    } else {
      data = demoInsertReview(form);
    }
    setSubmitting(false);
    setReviews([data, ...reviews]);
    setShowForm(false);
    setForm({ companion_id: companionId, reviewer_name: '', rating: 5, comment: '' });
  };

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-3xl font-semibold text-white">Reviews</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl border border-ocean-400/30 bg-ocean-500/10 px-4 py-2.5 text-sm font-semibold text-ocean-200 transition hover:bg-ocean-500/20"
        >
          <MessageSquare size={16} /> Write a review
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 animate-scale-in">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/55">Your name</label>
              <input
                value={form.reviewer_name}
                onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/55">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setForm({ ...form, rating: i })}
                    className="transition hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={i <= form.rating ? 'fill-sand-400 text-sand-400' : 'fill-none text-white/25'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-white/70">{form.rating}.0</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/55">Comment (optional)</label>
              <textarea
                value={form.comment || ''}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder={`Share your experience with ${companionName}…`}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
              />
            </div>
            {error && <p className="rounded-lg bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-ocean-400 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Post review'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/8"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-white/50">
          <Loader2 size={20} className="animate-spin" /> Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
          <p className="font-display text-xl text-white">No reviews yet</p>
          <p className="mt-2 text-sm text-white/50">Be the first to share your experience.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 animate-fade-up">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{review.reviewer_name}</p>
                  <RatingStars rating={review.rating} size={14} className="mt-1" />
                </div>
                <span className="text-xs text-white/40">
                  {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {review.comment && <p className="mt-3 text-sm leading-6 text-white/70">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
