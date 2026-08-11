import { ArrowLeft, BadgeCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Copy, Languages, MapPin, MessageCircle, Phone, ShieldCheck, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, type Companion, type NewBooking } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatKES } from '@/lib/format';
import { RatingStars } from '@/components/RatingStars';
import { ReviewsSection } from '@/components/ReviewsSection';
import { saveLocalBooking } from '@/lib/bookingsStore';
import { findDemoCompanion, demoInsertBooking } from '@/lib/demoData';
import { useToast } from '@/components/Toast';

export function DetailPage({ id }: { id: string }) {
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

useEffect(() => {
    setActiveImage(0);
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        const demo = findDemoCompanion(id);
        if (!cancelled) {
          if (demo) setCompanion(demo);
          else setError('This companion could not be found.');
          setLoading(false);
        }
        return;
      }
      const { data, error: queryError } = await supabase
        .from('companions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (queryError) setError('We could not load this companion. Please try again.');
      else if (!data) setError('This companion could not be found.');
      else setCompanion(data as Companion);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-5 pt-32 lg:px-8">
        <div className="skeleton mb-6 h-6 w-32 rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="skeleton aspect-[4/5] rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-10 w-2/3 rounded-lg" />
            <div className="skeleton h-5 w-1/2 rounded-lg" />
            <div className="skeleton h-32 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !companion) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 text-center lg:px-8">
        <p className="font-display text-3xl text-white">{error || 'Companion not found'}</p>
        <button onClick={() => navigate('/browse')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ocean-300">
          <ArrowLeft size={16} /> Back to all companions
        </button>
      </main>
    );
  }

  const gallery = ([companion.image_url, ...companion.gallery].filter(Boolean) as string[]).length > 0
    ? ([companion.image_url, ...companion.gallery].filter(Boolean) as string[])
    : ['https://images.pexels.com/photos/1476356/pexels-photo-1476356.jpeg?auto=compress&cs=tinysrgb&w=800'];

  const { showToast } = useToast();

  const copyContact = () => {
    if (companion.phone) {
      navigator.clipboard.writeText(companion.phone);
      showToast(`Phone number ${companion.phone} copied to clipboard!`, 'info');
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-20 pt-28 lg:px-8">
      <button onClick={() => navigate('/browse')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white">
        <ChevronLeft size={17} /> All companions
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <img src={gallery[activeImage]} alt={companion.name} className="aspect-[4/5] w-full object-cover" />
            {companion.verified && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ocean-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                <BadgeCheck size={14} /> Verified
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === activeImage ? 'border-ocean-400' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">{companion.name}, {companion.age}</h1>
            {companion.available ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-ring" /> Available
              </span>
            ) : (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white/70">Currently busy</span>
            )}
          </div>
          <p className="mt-2 text-lg text-white/70">{companion.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
            <RatingStars rating={companion.rating} reviews={companion.reviews} size={16} />
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-ocean-300" /> {companion.location}</span>
            <span className="inline-flex items-center gap-1.5"><Languages size={15} className="text-ocean-300" /> {companion.languages.join(', ')}</span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm leading-7 text-white/70">{companion.bio}</p>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Interests</p>
            <div className="flex flex-wrap gap-2">
              {companion.interests.map((tag) => (
                <span key={tag} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75">{tag}</span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between rounded-2xl border border-ocean-400/20 bg-ocean-500/8 p-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-ocean-300">Rate</p>
              <p className="mt-1 font-display text-3xl font-semibold text-white">{formatKES(companion.price_per_hour)}<span className="text-base font-normal text-white/50">/hour</span></p>
            </div>
            <button
              onClick={() => setBookingOpen(true)}
              disabled={!companion.available}
              className="rounded-xl bg-ocean-400 px-6 py-3.5 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {companion.available ? 'Book a date' : 'Not available'}
            </button>
          </div>

          {companion.phone && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <a
                href={`tel:${companion.phone.replace(/[^+\d]/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ocean-400/30 bg-ocean-500/10 px-4 py-3.5 text-sm font-bold text-ocean-200 transition hover:bg-ocean-500/20"
              >
                <Phone size={16} /> Call
              </a>
              <a
                href={`https://wa.me/${(companion.phone || '').replace(/[^+\d]/g, '').replace(/^\+/, '')}?text=${encodeURIComponent(`Hello ${companion.name}! I found your profile on Diani Companion and would love to arrange a session.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-500/10"
              >
                <MessageCircle size={16} /> Direct WhatsApp
              </a>
              <button
                type="button"
                onClick={copyContact}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold text-white/80 transition hover:bg-white/10"
              >
                <Copy size={16} /> Copy Contact
              </button>
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm text-white/50">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ocean-300" />
            Every booking is reviewed before confirmation. Be respectful, agree on expectations upfront, and enjoy your Diani day.
          </div>
        </div>
      </div>

      {bookingOpen && (
        <BookingModal companion={companion} onClose={() => setBookingOpen(false)} />
      )}

      <ReviewsSection companionId={companion.id} companionName={companion.name} />
    </main>
  );
}

function BookingModal({ companion, onClose }: { companion: Companion; onClose: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<NewBooking>({
    companion_id: companion.id,
    client_name: '',
    client_phone: '',
    client_email: '',
    booking_date: '',
    start_time: '14:00',
    duration_hours: 2,
    meeting_point: '',
    notes: '',
    total_price: companion.price_per_hour * 2,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const update = (field: keyof NewBooking, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      next.total_price = companion.price_per_hour * next.duration_hours;
      return next;
    });
  };

  const submit = async () => {
    setError('');
    if (!form.client_name.trim() || !form.client_phone.trim() || !form.booking_date || !form.start_time) {
      setError('Please fill in your name, phone, date, and time.');
      return;
    }
    const selectedDate = new Date(`${form.booking_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
      setError('Please choose a date from today onwards.');
      return;
    }
setSubmitting(true);
    let newId: string;
    if (isSupabaseConfigured) {
      const res = await supabase.from('bookings').insert(form).select('id').maybeSingle();
      const created = res.data as { id: string } | null;
      if (res.error || !created) {
        setError('We could not submit your booking right now. Please try again.');
        setSubmitting(false);
        return;
      }
      newId = created.id;
    } else {
      newId = demoInsertBooking(form).id;
    }
    setSubmitting(false);
    setBookingId(newId);
    saveLocalBooking({
      id: newId,
      companion_id: companion.id,
      companion_name: companion.name,
      companion_image: companion.image_url,
      booking_date: form.booking_date,
      start_time: form.start_time,
      duration_hours: form.duration_hours,
      total_price: form.total_price,
      status: 'pending',
    });
    setSuccess(true);
    showToast(`Booking request submitted for ${companion.name}!`, 'success');

    // Fire-and-forget notification to admin via edge function
    const fnBase = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const fnKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (fnBase && fnKey) {
      try {
        const fnUrl = `${fnBase}/functions/v1/notify-booking`;
        fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${fnKey}`,
          },
          body: JSON.stringify({
            companion_name: companion.name,
            client_name: form.client_name,
            client_phone: form.client_phone,
            client_email: form.client_email,
            booking_date: form.booking_date,
            start_time: form.start_time,
            duration_hours: form.duration_hours,
            meeting_point: form.meeting_point,
            total_price: form.total_price,
            notes: form.notes,
          }),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-950/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-ocean-900 p-6 shadow-2xl animate-scale-in sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={32} />
            </span>
            <h2 className="mt-6 font-display text-3xl font-semibold text-white">Booking requested!</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/60">
              We have your request for {companion.name}. We will confirm the details shortly. Your booking is saved on this device.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm">
              <div className="flex items-center justify-between"><span className="text-white/50">Reference</span><span className="font-mono text-white/80">{bookingId.slice(0, 8)}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-white/50">Date</span><span className="text-white/80">{form.booking_date} at {form.start_time}</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-white/50">Duration</span><span className="text-white/80">{form.duration_hours} hours</span></div>
              <div className="mt-2 flex items-center justify-between"><span className="text-white/50">Total</span><span className="font-semibold text-sand-300">{formatKES(form.total_price)}</span></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => navigate('/bookings')} className="flex-1 rounded-xl bg-ocean-400 py-3 text-sm font-bold text-ocean-950">View my bookings</button>
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/75">Close</button>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Hello ${companion.name}! I have just submitted a booking request on Diani Companion.\n\n` +
                `Reference: ${bookingId.slice(0, 8)}\n` +
                `Name: ${form.client_name}\n` +
                `Date: ${form.booking_date} at ${form.start_time}\n` +
                `Duration: ${form.duration_hours} hours\n` +
                `Meeting point: ${form.meeting_point || 'TBD'}\n` +
                `Total: ${formatKES(form.total_price)}\n` +
                (form.notes ? `Notes: ${form.notes}` : '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/90 py-3 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              <MessageCircle size={16} /> Confirm via WhatsApp
            </a>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ocean-300">Book {companion.name}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-white">Plan your Diani day</h2>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <input value={form.client_name} onChange={(e) => update('client_name', e.target.value)} placeholder="Jane Doe" className={inputClass} />
                </Field>
                <Field label="Phone" required>
                  <input value={form.client_phone} onChange={(e) => update('client_phone', e.target.value)} placeholder="+254 712 345 678" className={inputClass} />
                </Field>
              </div>
              <Field label="Email (optional)">
                <input value={form.client_email || ''} onChange={(e) => update('client_email', e.target.value)} placeholder="you@email.com" className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date" required>
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={form.booking_date} onChange={(e) => update('booking_date', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Start time" required>
                  <input type="time" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className={inputClass} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Duration (hours)">
                  <select value={form.duration_hours} onChange={(e) => update('duration_hours', Number(e.target.value))} className={inputClass}>
                    {[1, 2, 3, 4, 6, 8].map((h) => <option key={h} value={h} className="bg-ocean-900">{h} hours</option>)}
                  </select>
                </Field>
                <Field label="Meeting point">
                  <input value={form.meeting_point || ''} onChange={(e) => update('meeting_point', e.target.value)} placeholder="Hotel name / beach gate" className={inputClass} />
                </Field>
              </div>
              <Field label="Notes (optional)">
                <textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} placeholder="Anything that would make the day better" rows={3} className={`${inputClass} resize-none`} />
              </Field>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-ocean-400/20 bg-ocean-500/8 px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm text-white/70"><Clock size={15} className="text-ocean-300" /> {form.duration_hours} hours</span>
              <span className="font-display text-2xl font-semibold text-sand-300">{formatKES(form.total_price)}</span>
            </div>

            {error && <p className="mt-4 rounded-lg bg-coral-500/10 px-4 py-3 text-sm text-coral-400">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-ocean-400 py-4 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 disabled:opacity-50"
            >
              {submitting ? 'Sending request…' : 'Request booking'}
            </button>
            <p className="mt-3 text-center text-xs text-white/35">No payment required now — we confirm before the date.</p>
          </>
        )}
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-white/55">{label}{required && <span className="text-coral-400"> *</span>}</span>
      {children}
    </label>
  );
}
