import { Outlet } from 'react-router-dom';
import { MarketRegisterNavbar } from './MarketRegisterNavbar';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketRegisterNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
