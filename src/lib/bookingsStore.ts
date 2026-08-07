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

function writeLocalBookings(all: LocalBooking[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage may be unavailable (private mode, quota). Silently skip persisting.
  }
}

export function saveLocalBooking(booking: LocalBooking) {
  const all = getLocalBookings();
  all.unshift(booking);
  writeLocalBookings(all.slice(0, 50));
}

export function removeLocalBooking(id: string) {
  const all = getLocalBookings().filter((b) => b.id !== id);
  writeLocalBookings(all);
}
