import { useEffect } from 'react';
import { recordTap } from '@/lib/tapTracker';

export function useTapTracker() {
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
}

