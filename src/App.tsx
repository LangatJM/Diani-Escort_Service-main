import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AgeGate } from '@/components/AgeGate';
import { useRoute } from '@/lib/router';
import { useTapTracker } from '@/hooks/useTapTracker';
import { HomePage } from '@/pages/HomePage';
import { BrowsePage } from '@/pages/BrowsePage';
import { DetailPage } from '@/pages/DetailPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { AdminPage } from '@/pages/AdminPage';

function App() {
  const route = useRoute();
  useTapTracker();

  return (
    <div className="flex min-h-screen flex-col bg-ocean-950">
      <AgeGate />
      <Header route={route} />
      <div className="flex-1">
        {route.name === 'home' && <HomePage />}
        {route.name === 'browse' && <BrowsePage initialQuery={route.query} />}
        {route.name === 'detail' && <DetailPage id={route.id} />}
        {route.name === 'bookings' && <BookingsPage />}
        {route.name === 'about' && <AboutPage />}
        {route.name === 'admin' && <AdminPage />}
      </div>
      <Footer />
    </div>
  );
}

export default App;
