import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// True only when both env vars are present. When false, the app runs in "demo mode"
// using in-memory data so the UI still renders without a backend.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: { persistSession: false },
  global: {
    headers: { 'x-demo-mode': isSupabaseConfigured ? 'false' : 'true' },
  },
});

export type Companion = {
  id: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  languages: string[];
  interests: string[];
  price_per_hour: number;
  rating: number;
  reviews: number;
  verified: boolean;
  available: boolean;
  phone: string | null;
  image_url: string | null;
  gallery: string[];
  created_at: string;
};

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  companion_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  meeting_point: string | null;
  notes: string | null;
  status: BookingStatus;
  total_price: number;
  created_at: string;
};

export type NewBooking = Omit<Booking, 'id' | 'status' | 'created_at'>;

export type Review = {
  id: string;
  companion_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type NewReview = Omit<Review, 'id' | 'created_at'>;

export type Admin = {
  id: string;
  email: string;
  created_at: string;
};

// ===== Admin auth helpers =====
// These wrap Supabase Auth so the admin panel can verify the owner's identity.
// When Supabase is not configured they resolve to false, and the panel falls
// back to the demo-mode password.

export async function signInAdmin(email: string, password: string) {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured.' };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutAdmin() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export async function getAdminSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Confirms the current Supabase user is registered as an admin in the `admins` table.
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const session = await getAdminSession();
  if (!session?.user) return false;
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle();
  return !error && !!data;
}

export async function onAdminAuthChange(callback: (session: ReturnType<typeof getAdminSession> extends Promise<infer T> ? Awaited<T> : null) => void) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

// ===== Image upload helpers (Supabase Storage) =====
// Companion photos are uploaded to the public "companion-images" bucket and the
// returned public URL is stored on the companion record.

export const IMAGE_BUCKET = 'companion-images';

function storageAvailable(): boolean {
  return isSupabaseConfigured && !!supabase.storage;
}

// Upload a File to Storage and return its public URL. Generates a unique path
// per upload so files never collide. Returns null on failure.
export async function uploadCompanionImage(file: File, folder: string = 'gallery'): Promise<string | null> {
  const readAsBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  if (!storageAvailable()) {
    return readAsBase64();
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext) ? ext : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  try {
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${safeExt}`,
    });

    if (error) {
      console.warn('Supabase storage upload error, falling back to Data URL:', error.message);
      return readAsBase64();
    }

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl || (await readAsBase64());
  } catch (err) {
    console.warn('Storage upload exception, using Data URL fallback:', err);
    return readAsBase64();
  }
}

// Delete an object from Storage by its public URL. Safe to call even if the URL
// is an external URL (not in our bucket) — it just returns without error.
export async function deleteCompanionImage(publicUrl: string): Promise<void> {
  if (!storageAvailable()) return;
  const base = supabase.storage.from(IMAGE_BUCKET).getPublicUrl('').data.publicUrl;
  const bucketRoot = base.replace(/\/$/, '');
  if (!publicUrl.startsWith(bucketRoot)) return; // external URL — nothing to delete in storage
  const path = publicUrl.slice(bucketRoot.length + 1);
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}
