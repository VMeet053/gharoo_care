import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const [unseenCount, setUnseenCount] = useState(0);

  const user = JSON.parse(
    localStorage.getItem('serviceManUser') ||
    sessionStorage.getItem('serviceManUser') ||
    '{}'
  );

  useEffect(() => {
    if (!user?._id) return;

    const fetchLeadsAndCalculate = async () => {
      try {
        const response = await fetch(`/api/leads/assigned/${user._id}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          // Filter leads with status 'New'
          const newLeads = data.filter(lead => lead.status === 'New');
          
          // Get seen lead IDs from localStorage
          let seenIds = [];
          try {
            seenIds = JSON.parse(localStorage.getItem('seenLeadIds') || '[]');
          } catch (e) {
            seenIds = [];
          }

          if (location.pathname === '/leads') {
            // Mark all current new leads as seen
            const currentNewIds = newLeads.map(lead => lead.id || lead._id);
            const updatedSeenIds = Array.from(new Set([...seenIds, ...currentNewIds]));
            localStorage.setItem('seenLeadIds', JSON.stringify(updatedSeenIds));
            setUnseenCount(0);
          } else {
            // Count how many new leads have not been seen yet
            const unseen = newLeads.filter(lead => !seenIds.includes(lead.id || lead._id));
            setUnseenCount(unseen.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch leads for badge:', err);
      }
    };

    fetchLeadsAndCalculate();

    // Poll every 10 seconds to automatically fetch new leads
    const interval = setInterval(fetchLeadsAndCalculate, 10000);
    return () => clearInterval(interval);
  }, [location.pathname, user?._id]);

  return (
    <div className="app-shell">
      <Sidebar unseenCount={unseenCount} />
      <div className="app-content">
        <MobileHeader />
        <main className="app-main">
          <Outlet />
        </main>
        <BottomNav unseenCount={unseenCount} />
      </div>
    </div>
  );
}
