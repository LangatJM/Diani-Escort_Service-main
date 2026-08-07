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
