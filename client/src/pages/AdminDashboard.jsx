import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { clearAdminToken, SIDEBAR_COLLAPSED_KEY } from '../api/client';
import SportsPanel from './admin/SportsPanel';
import CoachesPanel from './admin/CoachesPanel';
import StudentsPanel from './admin/StudentsPanel';
import BatchesPanel from './admin/BatchesPanel';
import PaymentsPanel from './admin/PaymentsPanel';
import AnalyticsPanel from './admin/AnalyticsPanel';
import BulkImportPanel from './admin/BulkImportPanel';

const NAV_ITEMS = [
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'coaches', label: 'Coaches', icon: '👥' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'batches', label: 'Batches', icon: '📅' },
  { id: 'import', label: 'Bulk Import', icon: '📥' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'analytics', label: 'Analytics', icon: '📊' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('coaches');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
      case 'import':
        return <BulkImportPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return <CoachesPanel />;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface-secondary transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'}`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-foreground no-underline">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-xs text-white">SA</span>
            {!sidebarCollapsed && <span>SAMS Admin</span>}
          </Link>
          <button
            type="button"
            className="btn-ghost hidden text-sm lg:inline-flex"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${activeView === item.id ? 'sidebar-link-active' : 'sidebar-link'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => {
                setActiveView(item.id);
                setSidebarOpen(false);
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {!sidebarCollapsed && item.label}
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

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64'}`}>
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
