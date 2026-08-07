import type { Booking } from './supabase';

const KEY = 'diani_bookings';

export type LocalBooking = Pick<Booking, 'id' | 'companion_id' | 'booking_date' | 'start_time' | 'duration_hours' | 'total_price' | 'status'> & {
  companion_name: string;
  companion_image: string | null;
};

export function getLocalBookings(): LocalBooking[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalBooking[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalBooking(booking: LocalBooking) {
  const all = getLocalBookings();
  all.unshift(booking);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 50)));
}

export function removeLocalBooking(id: string) {
  const all = getLocalBookings().filter((b) => b.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
