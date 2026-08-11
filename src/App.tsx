import { lazy, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgeGate } from '@/components/AgeGate';
import { ToastProvider } from '@/components/Toast';
import { useRoute } from '@/lib/router';
import { useTapTracker } from '@/hooks/useTapTracker';
import { HomePage } from '@/pages/HomePage';
import { Loader2 } from 'lucide-react';

const BrowsePage = lazy(() => import('@/pages/BrowsePage').then((m) => ({ default: m.BrowsePage })));
const DetailPage = lazy(() => import('@/pages/DetailPage').then((m) => ({ default: m.DetailPage })));
const BookingsPage = lazy(() => import('@/pages/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Loader2 size={32} className="animate-spin text-ocean-300" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/50">Loading page…</p>
    </div>
  );
}

function AppContent() {
  const route = useRoute();
  useTapTracker();

  return (
    <div className="flex min-h-screen flex-col bg-ocean-950">
      <AgeGate />
      <Header route={route} />
      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          {route.name === 'home' && <HomePage />}
          {route.name === 'browse' && <BrowsePage initialQuery={route.query} />}
          {route.name === 'detail' && <DetailPage id={route.id} />}
          {route.name === 'bookings' && <BookingsPage />}
          {route.name === 'about' && <AboutPage />}
          {route.name === 'admin' && <AdminPage />}
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
