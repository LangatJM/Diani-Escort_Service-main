import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'browse'; query?: string }
  | { name: 'detail'; id: string }
  | { name: 'bookings' }
  | { name: 'about' }
  | { name: 'admin' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '');
  const [path, queryString] = hash.split('?');
  const segments = path.split('/').filter(Boolean);
  const params = new URLSearchParams(queryString || '');

  if (segments.length === 0) return { name: 'home' };
  if (segments[0] === 'browse') return { name: 'browse', query: params.get('q') || undefined };
  if (segments[0] === 'companion' && segments[1]) return { name: 'detail', id: segments[1] };
  if (segments[0] === 'bookings') return { name: 'bookings' };
  if (segments[0] === 'about') return { name: 'about' };
  if (segments[0] === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0 });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
