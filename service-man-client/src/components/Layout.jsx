import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <MobileHeader />
        <main className="app-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
