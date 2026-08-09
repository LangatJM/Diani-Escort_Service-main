import { useEffect } from 'react';
import { useRoute } from '@/lib/router';
import { recordTap, recordCompanionView } from '@/lib/tapTracker';

export function useTapTracker() {
  const route = useRoute();

  useEffect(() => {
    const listener = (e: MouseEvent | PointerEvent) => {
      // Only count real pointer interactions on interactive elements.
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const interactive = target.closest('button, a, input, select, textarea, label');
      if (!interactive) return;

      // Derive the current "page" from the hash route.
      const hash = window.location.hash.replace(/^#/, '');
      const segment = hash.split('/').filter(Boolean)[0] || 'home';
      recordTap(segment);
    };

    document.addEventListener('pointerup', listener, { passive: true });
    return () => document.removeEventListener('pointerup', listener);
  }, []);

  // Track a detail-page view whenever the route points at a companion.
  // Uses the reactive `route` from the router so it fires on actual navigation.
  useEffect(() => {
    if (route.name === 'detail' && route.id) {
      recordCompanionView(route.id);
    }
  }, [route]);
}

