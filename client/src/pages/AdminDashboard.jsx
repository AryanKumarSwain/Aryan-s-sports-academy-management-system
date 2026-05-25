import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { clearAdminToken } from '../api/client';
import SportsPanel from './admin/SportsPanel';
import CoachesPanel from './admin/CoachesPanel';
import StudentsPanel from './admin/StudentsPanel';
import BatchesPanel from './admin/BatchesPanel';
import PaymentsPanel from './admin/PaymentsPanel';
import AnalyticsPanel from './admin/AnalyticsPanel';

const NAV_ITEMS = [
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'coaches', label: 'Coaches', icon: '👥' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'batches', label: 'Batches', icon: '📅' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'analytics', label: 'Analytics', icon: '📊' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('coaches');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/');
  };

  const renderPanel = () => {
    switch (activeView) {
      case 'sports':
        return <SportsPanel />;
      case 'coaches':
        return <CoachesPanel />;
      case 'students':
        return <StudentsPanel />;
      case 'batches':
        return <BatchesPanel />;
      case 'payments':
        return <PaymentsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return <CoachesPanel />;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface-secondary transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b border-border p-5">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-foreground no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs text-white">SA</span>
            SAMS Admin
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'sidebar-link-active' : 'sidebar-link'}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link to="/" className="btn-secondary mb-2 w-full text-center">
            Back to Home
          </Link>
          <button type="button" className="btn-danger w-full" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-ghost lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <h1 className="text-lg font-bold">Academy Workspace</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 lg:p-8">{renderPanel()}</main>
      </div>
    </div>
  );
}
