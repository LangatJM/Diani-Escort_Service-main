import { useEffect, useState } from 'react';
import {
  Plus, Trash2, Edit3, X, Loader2, ShieldCheck, Search,
ToggleLeft, ToggleRight, BadgeCheck, Star, BarChart3, Eye, RefreshCcw,
  LogOut, Lock, Mail, CalendarDays,
} from 'lucide-react';
import {
  supabase, isSupabaseConfigured, type Companion, type Booking,
  signInAdmin, signOutAdmin, getAdminSession, isCurrentUserAdmin,
} from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { demoCompanions } from '@/lib/demoData';
import { formatKES } from '@/lib/format';
import { getTapStats, resetTapStats, formatTapTime } from '@/lib/tapTracker';

const ADMIN_PASSWORD = 'diani-admin-2026';
const STORAGE_KEY = 'diani_admin_auth';

type EditData = Partial<Companion> & {
  languages_str?: string;
  interests_str?: string;
  gallery_str?: string;
};

function companionToEdit(c: Companion): EditData {
  return {
    ...c,
    languages_str: c.languages.join(', '),
    interests_str: c.interests.join(', '),
    gallery_str: c.gallery.join('\n'),
  };
}

function editToCompanion(e: EditData): Omit<Companion, 'id' | 'created_at'> {
  return {
    name: e.name || '',
    tagline: e.tagline || null,
    bio: e.bio || null,
    age: e.age || null,
    location: e.location || null,
    languages: (e.languages_str || '').split(',').map((s) => s.trim()).filter(Boolean),
    interests: (e.interests_str || '').split(',').map((s) => s.trim()).filter(Boolean),
    price_per_hour: e.price_per_hour || 0,
    rating: e.rating || 0,
    reviews: e.reviews || 0,
    verified: e.verified || false,
    available: e.available || false,
    phone: e.phone || null,
    image_url: e.image_url || null,
    gallery: (e.gallery_str || '').split('\n').map((s) => s.trim()).filter(Boolean),
  };
}

const emptyCompanion: EditData = {
  name: '',
  tagline: '',
  bio: '',
  age: null,
  location: 'Diani Beach',
  languages_str: 'English, Swahili',
  interests_str: '',
  price_per_hour: 2500,
  rating: 0,
  reviews: 0,
  verified: false,
  available: true,
  phone: '+2547',
  image_url: '',
  gallery_str: '',
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminPage() {
  // Auth state: 'idle' | 'checking' | 'authed' | 'denied'
  const [authState, setAuthState] = useState<'idle' | 'checking' | 'authed' | 'denied'>('idle');
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // Hidden unlock: clients visiting #/admin see a generic "not found" screen.
  // The owner reveals the login with Ctrl+Shift+A (or Cmd+Shift+A on Mac).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setUnlocked(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [editing, setEditing] = useState<EditData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [statsTick, setStatsTick] = useState(0);

  const loadCompanions = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setCompanions([...demoCompanions]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('companions').select('*').order('created_at', { ascending: false });
    if (error) {
      setNotice('Could not load companions from the database.');
    } else {
      setCompanions((data as Companion[]) || []);
    }
    setLoading(false);
  };

  const loadBookings = async () => {
    if (!isSupabaseConfigured) return;
    setBookingsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setBookings((data as Booking[]) || []);
    setBookingsLoading(false);
  };

  // On mount: if Supabase is configured, check for an existing admin session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured) {
        // Demo mode uses the client-side password gate.
        if (sessionStorage.getItem(STORAGE_KEY) === 'yes') {
          setAuthState('authed');
          return;
        }
        setAuthState('idle');
        return;
      }
      setAuthState('checking');
      const session = await getAdminSession();
      if (cancelled) return;
      if (session?.user) {
        const admin = await isCurrentUserAdmin();
        if (cancelled) return;
        if (admin) {
          setAuthEmail(session.user.email || '');
          setAuthState('authed');
        } else {
          // Signed in as a non-admin user — sign them out and show the login.
          await signOutAdmin();
          if (!cancelled) setAuthState('idle');
        }
      } else {
        setAuthState('idle');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load companions + bookings once authenticated.
  useEffect(() => {
    if (authState === 'authed') {
      loadCompanions();
      loadBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  const tryAuth = async () => {
    setAuthError('');
    if (isSupabaseConfigured) {
      setAuthState('checking');
      if (!email.trim() || !password) {
        setAuthError('Enter your admin email and password.');
        setAuthState('idle');
        return;
      }
      const { error } = await signInAdmin(email.trim(), password);
      if (error) {
        setAuthError('Invalid email or password.');
        setAuthState('idle');
        return;
      }
      const admin = await isCurrentUserAdmin();
      if (admin) {
        setAuthEmail(email.trim());
        setAuthState('authed');
      } else {
        // Authenticated but not an admin — restrict access.
        await signOutAdmin();
        setAuthError('This account is not authorised to manage the site.');
        setAuthState('idle');
      }
      return;
    }
    // Demo mode password fallback.
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'yes');
      setAuthState('authed');
    } else {
      setAuthError('Incorrect password.');
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await signOutAdmin();
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setAuthState('idle');
    setEmail('');
    setPassword('');
    setAuthEmail('');
  };

  const startNew = () => {
    setIsNew(true);
    setEditing({ ...emptyCompanion });
    setSaveError('');
  };

  const startEdit = (c: Companion) => {
    setIsNew(false);
    setEditing(companionToEdit(c));
    setSaveError('');
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError('');
    const payload = editToCompanion(editing);
    if (!payload.name.trim()) {
      setSaveError('Name is required.');
      setSaving(false);
      return;
    }
    if (!isSupabaseConfigured) {
      // Demo mode: mutate in-memory array so the panel stays fully functional.
      if (isNew) {
        const created: Companion = {
          ...payload,
          id: makeId('demo'),
          created_at: new Date().toISOString(),
        };
        setCompanions((prev) => [created, ...prev]);
      } else if (editing.id) {
        setCompanions((prev) =>
          prev.map((c) => (c.id === editing.id ? { ...c, ...payload, id: editing.id! } : c))
        );
      }
      setSaving(false);
      setEditing(null);
      setNotice(isNew ? 'Companion registered (demo mode).' : 'Companion updated (demo mode).');
      return;
    }
    let result;
    if (isNew) {
      result = await supabase.from('companions').insert(payload).select('*').maybeSingle();
    } else {
      result = await supabase
        .from('companions')
        .update(payload)
        .eq('id', editing.id!)
        .select('*')
        .maybeSingle();
    }
    setSaving(false);
    if (result.error || !result.data) {
      setSaveError('Could not save. Check your permissions and try again.');
      return;
    }
    setEditing(null);
    setNotice(isNew ? 'Companion registered successfully.' : 'Companion updated successfully.');
    await loadCompanions();
  };

  const toggleAvailable = async (c: Companion) => {
    if (!isSupabaseConfigured) {
      setCompanions((prev) => prev.map((x) => (x.id === c.id ? { ...x, available: !x.available } : x)));
      return;
    }
    await supabase.from('companions').update({ available: !c.available }).eq('id', c.id);
    await loadCompanions();
  };

  const toggleVerified = async (c: Companion) => {
    if (!isSupabaseConfigured) {
      setCompanions((prev) => prev.map((x) => (x.id === c.id ? { ...x, verified: !x.verified } : x)));
      return;
    }
    await supabase.from('companions').update({ verified: !c.verified }).eq('id', c.id);
    await loadCompanions();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    if (!isSupabaseConfigured) {
      setCompanions((prev) => prev.filter((c) => c.id !== deletingId));
      setDeletingId(null);
      setNotice('Companion removed (demo mode).');
      return;
    }
    await supabase.from('companions').delete().eq('id', deletingId);
    setDeletingId(null);
    await loadCompanions();
  };

  const filtered = companions.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || [c.name, c.tagline || '', c.location || ''].join(' ').toLowerCase().includes(q);
  });

  const tapStats = getTapStats();
  const topPages = Object.entries(tapStats.byPage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const companionViewCounts = Object.entries(tapStats.byCompanion).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topViewedNames = companionViewCounts
    .map(([id, count]) => ({ name: companions.find((c) => c.id === id)?.name || 'Unknown', count }))
    .filter((x) => x.name !== 'Unknown');

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const todayStr = new Date().toDateString();

  if (authState === 'checking') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 pt-32">
        <div className="w-full text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-ocean-300" />
          <p className="mt-4 text-sm text-white/55">Verifying admin session…</p>
        </div>
      </main>
    );
  }

if (!unlocked && authState !== 'authed') {
    // Clients (and anyone without the unlock shortcut) see a generic not-found screen —
    // the admin login is never exposed to the public.
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 pt-32 text-center">
        <div className="w-full animate-fade-up">
          <p className="font-display text-7xl font-semibold text-white/25">404</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-white">Page not found</h1>
          <p className="mt-3 text-sm text-white/50">The page you are looking for does not exist or has been moved.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ocean-400 px-5 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  if (authState !== 'authed') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 pt-32">
        <div className="w-full animate-fade-up">
          <div className="mb-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ocean-500/15 text-ocean-300">
              <ShieldCheck size={26} />
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold text-white">Admin access</h1>
            <p className="mt-3 text-sm text-white/55">
              {isSupabaseConfigured
                ? 'Sign in with your admin account to manage the site.'
                : 'Enter the admin password to manage companions.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            {isSupabaseConfigured && (
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Admin email"
                    className="w-full rounded-xl border border-white/12 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && tryAuth()}
                    placeholder="Password"
                    className="w-full rounded-xl border border-white/12 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
                  />
                </div>
              </div>
            )}
            {!isSupabaseConfigured && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && tryAuth()}
                placeholder="Password"
                className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
              />
            )}
            {authError && <p className="mt-3 rounded-lg bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">{authError}</p>}
            <button
              onClick={tryAuth}
              className="mt-4 w-full rounded-xl bg-ocean-400 py-3.5 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-32 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-up">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ocean-300">Management</p>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">Admin panel</h1>
          <p className="mt-3 text-sm text-white/55">Add, edit, and manage your companion listings.</p>
        </div>
        <div className="flex items-center gap-2">
          {authEmail && (
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65 sm:inline-flex">
              <ShieldCheck size={13} className="text-ocean-300" /> {authEmail}
            </span>
          )}
          <button
            onClick={startNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-400 px-5 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300"
          >
            <Plus size={18} /> Register provider
          </button>
          <button
            onClick={logout}
            title="Sign out"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/12 text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-2xl border border-sand-400/25 bg-sand-400/10 p-4 text-sm text-white/75">
          You are running in <span className="font-bold text-sand-300">demo mode</span> — changes are kept in
          memory for this session only. Configure Supabase (see README) to persist data and use secure admin login.
        </div>
      )}

      {notice && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-white/60 hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Engagement / tap stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3" onClick={() => setStatsTick(statsTick + 1)}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45">
            <Eye size={14} className="text-ocean-300" /> Total taps
          </div>
          <p className="mt-3 font-display text-4xl font-semibold text-white">{tapStats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45">
            <BarChart3 size={14} className="text-ocean-300" /> Taps today
          </div>
          <p className="mt-3 font-display text-4xl font-semibold text-white">{tapStats.today.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/45">
            <RefreshCcw size={14} className="text-ocean-300" /> Last activity
          </div>
          <p className="mt-3 text-sm font-semibold text-white/80">{formatTapTime(tapStats.lastTapAt)}</p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {topPages.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/45">Most visited sections</p>
            <div className="flex flex-wrap gap-2">
              {topPages.map(([page, count]) => (
                <span key={page} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  <span className="font-bold text-ocean-300">{page}</span> {count} taps
                </span>
              ))}
            </div>
            <button
              onClick={() => { resetTapStats(); setStatsTick(statsTick + 1); }}
              className="mt-4 text-xs font-semibold text-white/40 hover:text-coral-400"
            >
              Reset tap stats
            </button>
          </div>
        )}
        {topViewedNames.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/45">Most viewed companions</p>
            <div className="flex flex-col gap-2.5">
              {topViewedNames.map(({ name, count }) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-white/75">{name}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ocean-300">
                    <Eye size={13} /> {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking monitoring (Supabase only) */}
      {isSupabaseConfigured && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-ocean-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/45">Recent booking requests</p>
            </div>
            <button onClick={loadBookings} className="text-xs font-semibold text-white/40 hover:text-ocean-300">
              Refresh
            </button>
          </div>
          {bookingsLoading ? (
            <div className="flex items-center gap-3 py-6 text-white/50">
              <Loader2 size={18} className="animate-spin" /> Loading bookings…
            </div>
          ) : bookings.length === 0 ? (
            <p className="py-6 text-sm text-white/50">No bookings yet. New requests will appear here.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex flex-col gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {b.client_name} <span className="font-normal text-white/40">· {b.client_phone}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-white/55">
                      Per {todayStr} · {b.booking_date} at {b.start_time} · {b.duration_hours}h · {formatKES(b.total_price)}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    b.status === 'pending' ? 'bg-sand-400/15 text-sand-300' :
                    b.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-300' :
                    b.status === 'completed' ? 'bg-ocean-500/15 text-ocean-300' :
                    'bg-white/8 text-white/40'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          {pendingBookings > 0 && (
            <p className="mt-4 text-xs text-sand-300">
              {pendingBookings} pending request{pendingBookings === 1 ? '' : 's'} awaiting confirmation.
            </p>
          )}
        </section>
      )}

      <div className="mt-8 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companions…"
          className="w-full rounded-xl border border-white/12 bg-white/6 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
        />
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-3 text-white/50">
          <Loader2 size={20} className="animate-spin" /> Loading companions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <p className="font-display text-xl text-white">No companions found</p>
          <p className="mt-2 text-sm text-white/50">Try adding a new companion or adjusting your search.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
            >
              <img
                src={c.image_url || ''}
                alt={c.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-white">{c.name}</h3>
                  {c.verified && <BadgeCheck size={16} className="text-ocean-300" />}
                </div>
                <p className="text-sm text-white/55">{c.tagline || 'No tagline'}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                  <span className="inline-flex items-center gap-1">
                    <Star size={12} className="fill-sand-400 text-sand-400" /> {c.rating.toFixed(1)} ({c.reviews})
                  </span>
                  <span>{formatKES(c.price_per_hour)}/hr</span>
                  <span>{c.location}</span>
                  {c.phone && <span>{c.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAvailable(c)}
                  title={c.available ? 'Available' : 'Busy'}
                  className="grid h-10 w-10 place-items-center rounded-xl text-white/60 hover:bg-white/8 hover:text-white"
                >
                  {c.available ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} />}
                </button>
                <button
                  onClick={() => toggleVerified(c)}
                  title={c.verified ? 'Verified' : 'Unverified'}
                  className="grid h-10 w-10 place-items-center rounded-xl text-white/60 hover:bg-white/8 hover:text-white"
                >
                  <BadgeCheck size={20} className={c.verified ? 'text-ocean-300' : 'text-white/25'} />
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-white/60 hover:bg-white/8 hover:text-white"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => setDeletingId(c.id)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-white/60 hover:bg-coral-500/10 hover:text-coral-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ocean-950/80 p-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-ocean-900 p-6 animate-scale-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-white">
                {isNew ? 'Register service provider' : 'Edit companion'}
              </h2>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/8">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Age">
                <input type="number" value={editing.age || ''} onChange={(e) => setEditing({ ...editing, age: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} />
              </Field>
              <Field label="Tagline">
                <input value={editing.tagline || ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Location">
                <input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Price per hour (KES)">
                <input type="number" value={editing.price_per_hour || 0} onChange={(e) => setEditing({ ...editing, price_per_hour: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
              <Field label="Phone (for Call / WhatsApp)">
                <input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+254 712 345 678" className={inputCls} />
              </Field>
              <Field label="Image URL">
                <input value={editing.image_url || ''} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Languages (comma separated)">
                <input value={editing.languages_str || ''} onChange={(e) => setEditing({ ...editing, languages_str: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Interests (comma separated)">
                <input value={editing.interests_str || ''} onChange={(e) => setEditing({ ...editing, interests_str: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Gallery URLs (one per line)">
                <textarea value={editing.gallery_str || ''} onChange={(e) => setEditing({ ...editing, gallery_str: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
              </Field>
              <Field label="Bio" full>
                <textarea value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>

            <div className="mt-4 flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={editing.available || false} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} className="h-4 w-4 accent-ocean-400" /> Available
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={editing.verified || false} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} className="h-4 w-4 accent-ocean-400" /> Verified
              </label>
            </div>

            {saveError && <p className="mt-4 rounded-lg bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">{saveError}</p>}

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-ocean-400 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 disabled:opacity-50">
                {saving ? 'Saving…' : isNew ? 'Register provider' : 'Save changes'}
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/8">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ocean-900 p-6 text-center animate-scale-in">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-coral-500/15 text-coral-400">
              <Trash2 size={22} />
            </div>
            <h3 className="font-display text-xl font-semibold text-white">Delete companion?</h3>
            <p className="mt-2 text-sm text-white/55">This will permanently remove the companion and all their reviews. This cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-coral-500 py-3 text-sm font-bold text-white hover:bg-coral-600">Delete</button>
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:bg-white/8">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60';

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-xs font-semibold text-white/55">{label}</label>
      {children}
    </div>
  );
}
