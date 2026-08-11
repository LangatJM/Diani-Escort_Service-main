import { useEffect, useState } from 'react';
import {
  Plus, Trash2, Edit3, X, Loader2, ShieldCheck, Search,
  ToggleLeft, ToggleRight, BadgeCheck, Star, BarChart3, Eye, RefreshCcw,
  LogOut, Lock, Mail, CalendarDays, UploadCloud, ImagePlus, CheckCircle,
} from 'lucide-react';
import {
  supabase, isSupabaseConfigured, type Companion, type Booking,
  signInAdmin, signOutAdmin, getAdminSession, isCurrentUserAdmin,
  deleteCompanionImage,
} from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { demoCompanions, getStoredCompanions, saveStoredCompanions } from '@/lib/demoData';
import { formatKES } from '@/lib/format';
import { getTapStats, resetTapStats, formatTapTime } from '@/lib/tapTracker';
import { ImageUploader } from '@/components/ImageUploader';

const ADMIN_PASSWORD = 'diani-admin-2026';
const STORAGE_KEY = 'diani_admin_auth';

type EditData = Partial<Companion> & {
  languages_str?: string;
  interests_str?: string;
  gallery_arr?: string[];
};

function companionToEdit(c: Companion): EditData {
  return {
    ...c,
    languages_str: c.languages.join(', '),
    interests_str: c.interests.join(', '),
    gallery_arr: [...c.gallery],
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
    rating: typeof e.rating === 'number' ? e.rating : 5.0,
    reviews: typeof e.reviews === 'number' ? e.reviews : 0,
    verified: e.verified || false,
    available: e.available !== undefined ? e.available : true,
    phone: e.phone || null,
    image_url: e.image_url || null,
    gallery: (e.gallery_arr || []).filter(Boolean),
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
  rating: 5.0,
  reviews: 1,
  verified: true,
  available: true,
  phone: '+2547',
  image_url: '',
  gallery_arr: [],
};

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

function ProfileImageDropzone({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="block text-xs font-semibold text-white/55">Main Profile Image (Drag & Drop or Upload)</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition ${
          dragging ? 'border-ocean-400 bg-ocean-400/10' : 'border-white/15 bg-white/5 hover:border-white/30'
        }`}
      >
        {value ? (
          <div className="flex w-full items-center justify-between gap-3">
            <img src={value} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-white/10" />
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle size={14} /> Image loaded
              </p>
              <p className="mt-0.5 truncate text-[11px] text-white/40">
                {value.startsWith('data:') ? 'Local file uploaded (base64)' : value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-lg bg-coral-500/20 px-3 py-1.5 text-xs font-medium text-coral-400 hover:bg-coral-500/30 transition"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 text-center w-full py-3">
            <UploadCloud size={28} className="text-ocean-300" />
            <span className="text-xs font-medium text-white/80">
              Drag & drop profile image here or <span className="text-ocean-300 underline">browse</span>
            </span>
            <span className="text-[11px] text-white/40">Supports PNG, JPG, WEBP</span>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        )}
      </div>
      <input
        type="text"
        placeholder="Or paste direct image URL (https://...)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  );
}

function GalleryDropzone({
  galleryStr,
  onChange,
}: {
  galleryStr: string;
  onChange: (newStr: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const urls = (galleryStr || '').split('\n').map((s) => s.trim()).filter(Boolean);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const readPromises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((newBase64s) => {
      const valid = newBase64s.filter(Boolean);
      const combined = [...urls, ...valid];
      onChange(combined.join('\n'));
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeUrl = (index: number) => {
    const updated = [...urls];
    updated.splice(index, 1);
    onChange(updated.join('\n'));
  };

  return (
    <div className="space-y-2 sm:col-span-2">
      <label className="block text-xs font-semibold text-white/55">Gallery Photos (Drag & Drop Multiple Files)</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition ${
          dragging ? 'border-ocean-400 bg-ocean-400/10' : 'border-white/15 bg-white/5 hover:border-white/30'
        }`}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 text-center w-full py-2">
          <ImagePlus size={26} className="text-ocean-300" />
          <span className="text-xs font-medium text-white/80">
            Drag & drop multiple gallery images or <span className="text-ocean-300 underline">browse</span>
          </span>
          <span className="text-[11px] text-white/40">Select multiple photos at once</span>
          <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
        </label>
      </div>

      {urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-1 sm:grid-cols-6">
          {urls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="absolute top-1 right-1 rounded-full bg-black/75 p-1 text-white hover:bg-coral-500 transition"
                title="Remove photo"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={galleryStr}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or enter gallery photo URLs (one per line)"
        rows={2}
        className={`${inputCls} resize-none`}
      />
    </div>
  );
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
      setCompanions(getStoredCompanions());
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured) {
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
          await signOutAdmin();
          if (!cancelled) setAuthState('idle');
        }
      } else {
        setAuthState('idle');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authState === 'authed') {
      loadCompanions();
      loadBookings();
    }
  }, [authState]);

  const tryAuth = async () => {
    setAuthError('');
    // 1. Try master site password first for instant access
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'yes');
      setAuthState('authed');
      return;
    }

    // 2. Try Supabase Auth
    if (isSupabaseConfigured) {
      setAuthState('checking');
      if (!email.trim() || !password) {
        setAuthError('Enter your admin email & password, or use master access password.');
        setAuthState('idle');
        return;
      }
      const { error } = await signInAdmin(email.trim(), password);
      if (error) {
        const msg = typeof error === 'string' ? error : (error as { message?: string })?.message || 'Sign in failed';
        setAuthError(`Sign in failed: ${msg}`);
        setAuthState('idle');
        return;
      }
      const admin = await isCurrentUserAdmin();
      if (admin) {
        setAuthEmail(email.trim());
        setAuthState('authed');
      } else {
        // Authenticated in Supabase auth, enable access
        setAuthEmail(email.trim());
        sessionStorage.setItem(STORAGE_KEY, 'yes');
        setAuthState('authed');
      }
      return;
    }

    setAuthError('Incorrect password.');
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await signOutAdmin();
    }
    sessionStorage.removeItem(STORAGE_KEY);
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

    // Always update local state & localStorage for immediate UI reactivity
    let localUpdated: Companion[];
    if (isNew) {
      const created: Companion = {
        ...payload,
        id: editing.id || makeId('comp'),
        created_at: new Date().toISOString(),
      };
      localUpdated = [created, ...companions];
    } else if (editing.id) {
      localUpdated = companions.map((c) => (c.id === editing.id ? { ...c, ...payload, id: editing.id! } : c));
    } else {
      localUpdated = [...companions];
    }
    setCompanions(localUpdated);
    saveStoredCompanions(localUpdated);

    if (!isSupabaseConfigured) {
      setSaving(false);
      setEditing(null);
      setNotice(isNew ? 'Local companion registered successfully.' : 'Local companion updated successfully.');
      return;
    }

    // Perform live Supabase DB write
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

    if (result.error) {
      console.warn('Supabase DB write error:', result.error);
      setNotice(`Saved locally. Note: Supabase DB update had warning (${result.error.message}).`);
    } else {
      setNotice(isNew ? 'Companion registered & saved to Supabase DB.' : 'Companion updated & saved to Supabase DB.');
      await loadCompanions();
    }
    setEditing(null);
  };

  const toggleAvailable = async (c: Companion) => {
    const updated = companions.map((x) => (x.id === c.id ? { ...x, available: !x.available } : x));
    setCompanions(updated);
    saveStoredCompanions(updated);

    if (!isSupabaseConfigured) return;

    const { error } = await supabase.from('companions').update({ available: !c.available }).eq('id', c.id);
    if (error) {
      setNotice(`Updated locally. Supabase DB warning: ${error.message}`);
    } else {
      await loadCompanions();
    }
  };

  const toggleVerified = async (c: Companion) => {
    const updated = companions.map((x) => (x.id === c.id ? { ...x, verified: !x.verified } : x));
    setCompanions(updated);
    saveStoredCompanions(updated);

    if (!isSupabaseConfigured) return;

    const { error } = await supabase.from('companions').update({ verified: !c.verified }).eq('id', c.id);
    if (error) {
      setNotice(`Updated locally. Supabase DB warning: ${error.message}`);
    } else {
      await loadCompanions();
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const updated = companions.filter((c) => c.id !== deletingId);
    setCompanions(updated);
    saveStoredCompanions(updated);

    if (!isSupabaseConfigured) {
      setDeletingId(null);
      setNotice('Companion removed successfully.');
      return;
    }

    const { error } = await supabase.from('companions').delete().eq('id', deletingId);
    setDeletingId(null);
    if (error) {
      setNotice(`Removed locally. Supabase DB warning: ${error.message}`);
    } else {
      setNotice('Companion permanently deleted from Supabase DB.');
      await loadCompanions();
    }
  };

  // ===== Image handlers for the edit/create form =====
  const setPrimaryImage = (url: string) => {
    if (!editing) return;
    setEditing({ ...editing, image_url: url });
  };

  const removePrimaryImage = async () => {
    if (!editing) return;
    if (editing.image_url) await deleteCompanionImage(editing.image_url);
    setEditing({ ...editing, image_url: null });
  };

  const addGalleryImage = (url: string) => {
    if (!editing) return;
    const arr = editing.gallery_arr || [];
    if (arr.length < 8) {
      setEditing({ ...editing, gallery_arr: [...arr, url] });
    }
  };

  const removeGalleryImage = async (index: number) => {
    if (!editing) return;
    const arr = editing.gallery_arr || [];
    const removed = arr[index];
    if (removed) await deleteCompanionImage(removed);
    setEditing({ ...editing, gallery_arr: arr.filter((_, i) => i !== index) });
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

  if (authState !== 'authed' && !unlocked) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
          <p className="font-display text-4xl font-bold text-white/20">404</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-white">Page not found</h1>
          <p className="mt-2 text-sm text-white/45">The section you are looking for does not exist or has been moved.</p>
          <button
            onClick={() => navigate('#/')}
            className="mt-6 rounded-xl bg-ocean-400 px-5 py-2.5 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300"
          >
            Return home
          </button>
        </div>
      </main>
    );
  }

  if (authState !== 'authed') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-5 pt-32 pb-20">
        <div className="w-full rounded-2xl border border-white/10 bg-ocean-900/90 p-8 backdrop-blur-md shadow-2xl animate-fade-up">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-400/10 text-ocean-300 border border-ocean-400/20">
              <Lock size={26} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-white">Admin authentication</h1>
            <p className="mt-1 text-xs text-white/50">
              {isSupabaseConfigured ? 'Sign in with your admin credentials' : 'Enter admin access code'}
            </p>
          </div>

          <div className="mt-6">
            {isSupabaseConfigured && (
              <div className="space-y-3">
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
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-ocean-300">Management Dashboard</p>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">Admin panel</h1>
          <p className="mt-3 text-sm text-white/55">Add, edit, drag & drop photos, and manage all local companion profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          {authEmail && (
            <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65 sm:inline-flex">
              <ShieldCheck size={13} className="text-ocean-300" /> {authEmail}
            </span>
          )}
          <button
            onClick={startNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-400 px-5 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 shadow-lg shadow-ocean-400/10"
          >
            <Plus size={18} /> Add Local Companion
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
        <div className="mt-6 rounded-2xl border border-sand-400/25 bg-sand-400/10 p-4 text-sm text-white/75 flex items-center justify-between">
          <span>
            Running in <span className="font-bold text-sand-300">Demo mode</span> — changes are stored locally in your browser storage and persist across sessions.
          </span>
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
              className="mt-4 text-xs font-semibold text-white/40 hover:text-coral-400 transition"
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

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search local companions by name, location, tagline…"
            className="w-full rounded-xl border border-white/12 bg-white/6 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-ocean-400/60"
          />
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-400/15 border border-ocean-400/30 px-4 py-3 text-sm font-semibold text-ocean-300 hover:bg-ocean-400 hover:text-ocean-950 transition"
        >
          <Plus size={16} /> Add Local Companion
        </button>
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-3 text-white/50">
          <Loader2 size={20} className="animate-spin" /> Loading companions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <p className="font-display text-xl text-white">No local companions found</p>
          <p className="mt-2 text-sm text-white/50">Try adding a new local companion or clearing your search filter.</p>
          <button
            onClick={startNew}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean-400 px-5 py-2.5 text-sm font-bold text-ocean-950 hover:bg-ocean-300 transition"
          >
            <Plus size={16} /> Register companion now
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center"
            >
              <img
                src={c.image_url || 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={c.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover border border-white/10 bg-ocean-900"
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
                  <span>{c.location || 'Diani'}</span>
                  {c.phone && <span>{c.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAvailable(c)}
                  title={c.available ? 'Set as Unavailable' : 'Set as Available'}
                  className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/8 transition"
                >
                  {c.available ? (
                    <>
                      <ToggleRight size={20} className="text-emerald-400" /> <span className="text-emerald-300">Available</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={20} className="text-white/40" /> <span className="text-white/40">Busy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => toggleVerified(c)}
                  title={c.verified ? 'Toggle Verification Status' : 'Mark as Verified'}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60 hover:bg-white/8 hover:text-white transition"
                >
                  <BadgeCheck size={20} className={c.verified ? 'text-ocean-300' : 'text-white/25'} />
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60 hover:bg-white/8 hover:text-white transition"
                  title="Edit Companion Information"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => setDeletingId(c.id)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white/60 hover:bg-coral-500/10 hover:text-coral-400 transition"
                  title="Delete Profile"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ocean-950/85 p-4 pt-16 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-ocean-900 p-6 shadow-2xl animate-scale-in">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">
                  {isNew ? 'Register Local Companion' : `Edit Profile: ${editing.name || ''}`}
                </h2>
                <p className="text-xs text-white/50 mt-0.5">Drag & drop photos or edit information below.</p>
              </div>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/8">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Companion Name">
                <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Amani" className={inputCls} />
              </Field>
              <Field label="Age">
                <input type="number" value={editing.age || ''} onChange={(e) => setEditing({ ...editing, age: e.target.value ? parseInt(e.target.value) : null })} placeholder="e.g. 25" className={inputCls} />
              </Field>

              <Field label="Tagline">
                <input value={editing.tagline || ''} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} placeholder="e.g. Sunset strolls & beach tours" className={inputCls} />
              </Field>
              <Field label="Location">
                <input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="e.g. Diani Beach" className={inputCls} />
              </Field>

              <Field label="Price per hour (KES)">
                <input type="number" value={editing.price_per_hour || 0} onChange={(e) => setEditing({ ...editing, price_per_hour: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
              <Field label="Phone / WhatsApp Contact">
                <input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+254 712 345 678" className={inputCls} />
              </Field>

              <Field label="Rating (0.0 to 5.0)">
                <input type="number" step="0.1" min="0" max="5" value={editing.rating ?? 5.0} onChange={(e) => setEditing({ ...editing, rating: parseFloat(e.target.value) || 5.0 })} className={inputCls} />
              </Field>
              <Field label="Review Count">
                <input type="number" min="0" value={editing.reviews ?? 0} onChange={(e) => setEditing({ ...editing, reviews: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>

              {/* Profile Image Drag & Drop */}
              <div className="sm:col-span-2">
                <ImageUploader
                  label="Profile photo (drag & drop)"
                  images={[editing.image_url || null]}
                  onRemove={removePrimaryImage}
                  onUpload={setPrimaryImage}
                  hint="Set the main profile photo"
                />
              </div>

              <Field label="Languages (comma separated)">
                <input value={editing.languages_str || ''} onChange={(e) => setEditing({ ...editing, languages_str: e.target.value })} placeholder="English, Swahili, French" className={inputCls} />
              </Field>
              <Field label="Interests (comma separated)">
                <input value={editing.interests_str || ''} onChange={(e) => setEditing({ ...editing, interests_str: e.target.value })} placeholder="Beach walks, Safari, Dining, Music" className={inputCls} />
              </Field>

              {/* Gallery Photos Drag & Drop */}
              <div className="sm:col-span-2">
                <ImageUploader
                  label="Gallery photos (drag & drop)"
                  images={editing.gallery_arr || []}
                  onRemove={removeGalleryImage}
                  onUpload={addGalleryImage}
                  multiple
                  hint="Add up to 8 gallery images"
                />
              </div>

              <Field label="Bio & Description" full>
                <textarea value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} rows={3} placeholder="Write a brief intro bio..." className={`${inputCls} resize-none`} />
              </Field>
            </div>

            <div className="mt-4 flex gap-6 rounded-xl border border-white/10 bg-white/5 p-3.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={editing.available || false} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} className="h-4 w-4 accent-ocean-400" /> Available for Booking
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={editing.verified || false} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} className="h-4 w-4 accent-ocean-400" /> Verified Local Companion
              </label>
            </div>

            {saveError && <p className="mt-4 rounded-lg bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">{saveError}</p>}

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-ocean-400 py-3 text-sm font-bold text-ocean-950 transition hover:bg-ocean-300 disabled:opacity-50">
                {saving ? 'Saving…' : isNew ? 'Register Local Companion' : 'Save Changes'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ocean-900 p-6 text-center animate-scale-in shadow-2xl">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-coral-500/15 text-coral-400">
              <Trash2 size={22} />
            </div>
            <h3 className="font-display text-xl font-semibold text-white">Delete companion profile?</h3>
            <p className="mt-2 text-sm text-white/55">This will permanently remove this local companion profile and all associated data.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-coral-500 py-3 text-sm font-bold text-white hover:bg-coral-600 transition">Delete</button>
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:bg-white/8 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
