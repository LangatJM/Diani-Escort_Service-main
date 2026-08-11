import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, type Companion } from '@/lib/supabase';
import { getStoredCompanions } from '@/lib/demoData';

export function useCompanions() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        // Demo mode: use local stored companions so changes persist.
        if (!cancelled) {
          setCompanions(getStoredCompanions().sort((a, b) => b.rating - a.rating));
          setError(null);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from('companions')
        .select('*')
        .order('rating', { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setCompanions(data as Companion[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { companions, loading, error };
}
