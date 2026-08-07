import { CalendarDays, ChevronRight, Clock, Compass, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { formatDate, formatKES } from '@/lib/format';
import { getLocalBookings, removeLocalBooking, type LocalBooking } from '@/lib/bookingsStore';

export function BookingsPage() {
  const [bookings, setBookings] = useState<LocalBooking[]>([]);

  useEffect(() => {
    setBookings(getLocalBookings());
  }, []);

  const remove = (id: string) => {
    removeLocalBooking(id);
    setBookings(getLocalBookings());
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 lg:px-8">
      <div className="text-center animate-fade-up">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ocean-500/15 text-ocean-300">
          <CalendarDays size={26} />
        </span>
        <h1 className="mt-6 font-display text-5xl font-semibold text-white">Your bookings</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/55">
          Bookings made on this device appear here. They are stored locally for your privacy.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <p className="font-display text-2xl text-white">No bookings yet</p>
          <p className="mt-2 text-sm text-white/50">When you book a companion, the details will show up here.</p>
          <button onClick={() => navigate('/browse')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ocean-300">
            Explore companions <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 animate-fade-up">
              {booking.companion_image && (
                <img src={booking.companion_image} alt={booking.companion_name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              )}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-ocean-300">{booking.status}</p>
                      <h3 className="mt-1 font-display text-xl text-white">{booking.companion_name}</h3>
                    </div>
                    <p className="font-semibold text-sand-300">{formatKES(booking.total_price)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-ocean-300" /> {formatDate(booking.booking_date)} at {booking.start_time}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-ocean-300" /> {booking.duration_hours}h</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => navigate(`/companion/${booking.companion_id}`)} className="text-xs font-semibold text-ocean-300 hover:text-ocean-200">View companion</button>
                  <button onClick={() => remove(booking.id)} className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-coral-400">
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
